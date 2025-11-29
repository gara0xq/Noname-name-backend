const Module = require("module")
const mongoose = require("mongoose")



const parentSchhema = new mongoose.Schema(
    {
        user_id :{
            type: mongoose.Schema.ObjectId,
            required: true,
            ref:"user",
            unique:true
        },
        email: {
            type: String,
            trim: true
        },
        password: {
            type: String,
            trim: true
        },
        phone_number: {
            type: String,
            trim: true
        }
    },
    {
    versionKey: false

   }

)
module.exports = mongoose.model("parents",parentSchhema)