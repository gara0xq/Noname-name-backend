const mongoose = require('mongoose')
const moment = require('moment-timezone')


const tasksSchema= new mongoose.Schema(
    {
        parent_id : {
            type : mongoose.Schema.Types.ObjectId,
            ref:"parents",
            required: true,
        },
        child_id : {
            type : mongoose.Schema.Types.ObjectId,
            ref:"children",
            required: true,
        },
        title :{
            type :String,
            required: true,
            trim:true
        },
        description:{
            type :String,
            required: true,
            trim:true
        },
        points: {
            type: Number,
            required:true
        },
        status: {
            type: String,
            enum: ['pending', 'submitted', 'completed', 'expired'],
            default: 'pending'
        },
        punishment :{
            type: String,
            required:true,
        },
        expire_date:{
            type: Date,
            default:  () => moment().tz("Africa/Cairo").add(24, "hours").toDate()
        },
        created_at:{
            type: Date,
            default:  Date.now
        }
    },
 
    { versionKey: false }

)
    
module.exports = mongoose.model("Tasks",tasksSchema)