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
        permissions_id:
            {
                
                type: mongoose.Schema.Types.ObjectId,
                ref: "permissions",
                required:true
            },

        
        created_at:{
            type: Date,
            default: Date.now().toLocaleString("en-US", {timeZone: "Africa/Cairo"})
        }

    },
    { versionKey: false }
)

module.exports = mongoose.model("user",userSchema)