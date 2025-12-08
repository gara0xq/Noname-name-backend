const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema(
  {
    parent_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'parents',
      required: true,
    },
    otp_code: {
      type: String,
      required: true,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
    expires_at: {
      type: Date,
      required: true,
    },
  },
  { versionKey: false }
);


otpSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('otps', otpSchema);
