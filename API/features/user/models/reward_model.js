const mongoose = require('mongoose');

const rewardSchema = new mongoose.Schema(
  {
    child_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'children',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    points_cost: {
      type: Number,
      required: true,
    },
    image_url: {
      type: String,
      required: true,
      trim: true,
    },
    redeemed: {
      type: Boolean,
      default: false,
    },
  },
  {
    versionKey: false,
  }
);

module.exports = mongoose.model('reward', rewardSchema);
