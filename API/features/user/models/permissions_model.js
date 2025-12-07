const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
  },
  {
    versionKey: false,
  }
);

module.exports = mongoose.model('permissions', permissionSchema);
