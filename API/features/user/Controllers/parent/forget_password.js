// controllers/.../forget_password.js
const parentModel = require('../../models/parent_model');
const otpModel = require('../../models/otp_model');
const mailer = require('../../../../utils/mailersend_otp');
const userModel = require('../../../user/models/user_model');

// simple local OTP generator
function generateOtp(length = 6) {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  return otp;
}

exports.forgetPassword = async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ message: 'email is required' });

    const rawEmail = String(email).toLowerCase().trim();
    // simple email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
      return res.status(400).json({ message: 'Invalid email address' });
    }

    // find parent by email
    const parent = await parentModel.findOne({ email: rawEmail });
    if (!parent) {
      return res.status(404).json({ message: 'No parent account found for this email' });
    }

    const otp = generateOtp(6);
    const expiresAt = new Date(Date.now() + 4 * 60 * 1000); // 4 minutes

    // choose a display name for email template (customize to your schema)
    const userinf =  await userModel.findById(parent.user_id).select('name').lean();
    if (!userinf) {
      return res.status(404).json({ message: 'Associated user not found' });
    }
    const parentName = userinf.name || '';

    // send email
    try {
      if (!parent.email) {
        return res.status(400).json({ message: 'Parent account has no email configured' });
      }

      await mailer.sendOtpEmail({
        toEmail: parent.email,
        otp,
        subject: 'Your verification code',
        name: parentName,
      });
    } catch (sendErr) {
      console.error('MailerSend error:', {
        message: sendErr.message,
        status: sendErr.status,
        response: sendErr.response,
      });
      return res
        .status(502)
        .json({ message: 'Failed to send OTP via email', error: sendErr.message });
    }

    // save OTP in DB
    try {
      await otpModel.findOneAndUpdate(
        { parent_id: parent._id },
        { parent_id: parent._id, otp_code: otp, expires_at: expiresAt },
        { upsert: true, new: true }
      );
    } catch (dbErr) {
      console.error('OTP save error:', dbErr);
      return res
        .status(500)
        .json({ message: 'Failed to persist OTP', error: dbErr.message });
    }

    return res.status(200).json({ message: 'OTP sent to provided email address' });
  } catch (err) {
    console.error('forgetPassword error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
