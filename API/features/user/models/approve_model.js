const mongoose = require('mongoose');

const approveSchema = new mongoose.Schema(
  {
    task_submission_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'submit',
      required: true,
    },

    submitted_at: {
      type: Date,
      default: Date.now,
    },
    redeemed_points: {
      type: Number,
    },
  },
  {
    versionKey: false,
  }
);

module.exports = mongoose.model('approve', approveSchema);
