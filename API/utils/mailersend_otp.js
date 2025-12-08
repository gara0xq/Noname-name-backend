const https = require('https');
require('dotenv').config();

function getApiKey() {
  const key = process.env.MAILERSEND_API_KEY;
  if (!key) {
    const e = new Error('MAILERSEND_API_KEY not configured');
    e.code = 'MAILERSEND_MISSING_KEY';
    throw e;
  }
  return key;
}

function getFromEmail() {
  return process.env.MAILERSEND_FROM_EMAIL || process.env.MAILERSEND_FROM;
}

function getFromName() {
  return process.env.MAILERSEND_FROM_NAME || 'My App';
}

function getSupportEmail() {
  return process.env.MAILERSEND_SUPPORT_EMAIL || 'support@example.com';
}

function sendRequest(body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.mailersend.com',
      path: '/v1/email',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getApiKey()}`,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        const status = res.statusCode;
        let parsed = null;
        try {
          parsed = data ? JSON.parse(data) : null;
        } catch (err) {
          parsed = { raw: data };
        }

        if (status >= 200 && status < 300) return resolve(parsed);

        const e = new Error(parsed && parsed.message ? parsed.message : `MailerSend API error: ${status}`);
        e.status = status;
        e.response = parsed;
        return reject(e);
      });
    });

    req.on('error', (err) => reject(err));
    req.write(JSON.stringify(body));
    req.end();
  });
}

/**
 * Send OTP email via MailerSend using a template.
 *
 * @param {{
 *   toEmail: string,
 *   otp: string,
 *   subject?: string,
 *   name?: string
 * }} opts
 */
async function sendOtpEmail({ toEmail, otp, subject, name } = {}) {
  if (!toEmail) throw new Error('`toEmail` is required');
  if (!otp) throw new Error('`otp` is required');

  const fromEmail = getFromEmail();
  if (!fromEmail) {
    const e = new Error('MAILERSEND_FROM_EMAIL not configured');
    e.code = 'MAILERSEND_MISSING_FROM';
    throw e;
  }

  const fromName = getFromName();
  const supportEmail = getSupportEmail();

  const templateId =
    process.env.MAILERSEND_TEMPLATE_FORGOT_PASSWORD || '3zxk54vqv1qljy6v';

  const payload = {
    from: { email: fromEmail, name: fromName },
    to: [{ email: toEmail }],
    subject: subject || 'Your verification code',
    template_id: templateId,
    variables: [
      {
        email: toEmail,
        substitutions: [
          { var: 'code', value: otp },
          { var: 'name', value: name || '' },
          { var: 'account.name', value: fromName },
          { var: 'support_email', value: supportEmail },
        ],
      },
    ],
  };

  return sendRequest(payload);
}

module.exports = {
  sendOtpEmail,
};
