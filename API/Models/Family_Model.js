const mongoose = require("mongoose");

const familySchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      trim: true
    }
  },
  { versionKey: false }
);

module.exports = mongoose.model("families", familySchema);
