const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
    {
        family_id:{
            type : mongoose.Schema.Types.ObjectId,
            ref:"families",
            required:true
        },
        name :{
            type:String,
            required:true,
            trim:true,
        },
        permissions:[
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "",
                required:true
            }
        ],
        created_at:{
            type: Date,
            default: Date.now
        }

    },
    { versionKey: false }
)

module.exports = mongoose.model("user",userSchema)