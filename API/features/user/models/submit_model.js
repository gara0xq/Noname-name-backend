const mongoose = require('mongoose');

const submitSchema = new mongoose.Schema(
  {
    task_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tasks',
      required: true,
    },
    proof_image_url: {
      type: String,
      required: true,
      trim: true,
    },
    submitted_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  }
);

module.exports = mongoose.model('submit', submitSchema);
