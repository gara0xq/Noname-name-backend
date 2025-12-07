const mongoose = require('mongoose');

const childSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
      unique: true,
    },
    code: { type: String, trim: true, required: true, unique: true },
    gender: {
      type: String,
      trim: true,
      required: true,
    },
    points: { type: Number, default: 0 },
    birth_date: {
      type: Date,
      required: true,
    },
  },
  { timestamps: false, versionKey: false }
);

module.exports = mongoose.model('children', childSchema);
