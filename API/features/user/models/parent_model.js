const Module = require('module');
const mongoose = require('mongoose');

const parentSchhema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.ObjectId,
      required: true,
      ref: 'user',
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email'],
    },
    password: {
      type: String,
      required: true,
      minlength: [8, 'Password must be at least 8 characters'],
      match: [
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&/]).{8,}$/,
        'Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character',
      ],
    },
    phone_number: {
      type: String,
      trim: true,
    },
  },
  {
    versionKey: false,
  }
);
module.exports = mongoose.model('parents', parentSchhema);
