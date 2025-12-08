const parentModel = require('../../../models/parent_model');
const otpModel = require('../../../models/otp_model');

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body || {};

    if (!email) {
      return res.status(400).json({ message: 'email is required' });
    }
    if (!otp) {
      return res.status(400).json({ message: 'otp is required' });
    }

    const rawEmail = String(email).toLowerCase().trim();
    const rawOtp = String(otp).trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
      return res.status(400).json({ message: 'Invalid email address' });
    }

    const parent = await parentModel.findOne({ email: rawEmail });
    if (!parent) {
      return res.status(404).json({ message: 'No parent account found for this email' });
    }

    const otpDoc = await otpModel.findOne({ parent_id: parent._id });
    if (!otpDoc) {
      return res.status(400).json({ message: 'OTP not found or expired. Please request a new one.' });
    }

    if (otpDoc.expires_at < new Date()) {

      await otpModel.deleteOne({ _id: otpDoc._id });
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }


    if (otpDoc.otp_code !== rawOtp) {
      return res.status(400).json({ message: 'Incorrect OTP code' });
    }

    await otpModel.deleteOne({ _id: otpDoc._id });

    return res.status(200).json({ message: 'OTP verified successfully' });
  } catch (err) {
    console.error('verifyOtp error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
