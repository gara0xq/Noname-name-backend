const jwt = require('jsonwebtoken');
const userModel = require('../../models/user_model');
const permissionsModel = require('../../models/permissions_model');
const familyModel = require('../../models/family_model');
const childModel = require('../../models/child_model');
const taskModel = require('../../models/tasks_model')
const moment = require('moment-timezone')


exports.addTask = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    const decoded = await new Promise((resolve, reject) => {
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) return reject(err);
        resolve(user);
      });
    });
    

    const parentUserId = decoded.userId;     
    const familyId = decoded.familyId;       
    const parentId = decoded.parentId;       
    const role = decoded.role;               

    let {title,description,points,code,punishment,expire_date } = req.body;
    if (!title || !description || !points ||!code ||!punishment) {
      return res.status(400).json({
        message: 'name and gender are required',
      });
    }


    
    title = String(title).trim();
    description = String(description).trim();
    punishment = String(punishment).trim();
    code = String(code);


      if (expire_date) {
      expire_date = moment(expire_date).tz("Africa/Cairo").toDate();
    } else {
      expire_date = moment().tz("Africa/Cairo").add(24, "hours").toDate();
    }



    const family = await familyModel.findById(familyId);
    if (!family) {
      return res.status(403).json({ message: 'Invalid family (from token)' });
    }


    const parentUser = await userModel.findById(parentUserId);
    if (!parentUser)
      return res.status(403).json({ message: 'Parent user not found' });

    if (String(parentUser.family_id) !== String(family._id)) {
      return res.status(403).json({
        message: 'You are not allowed to add a tasks',
      });
    }



    const currentChild = await childModel.findOne({code:code})
    if(!currentChild) return res.status(404).json({
        message: 'child not found',
      });
      const creatTask = await taskModel.create(
        {
            parent_id:parentId,
            child_id:currentChild._id,
            title:title,
            description:description,
            points:points,
            punishment:punishment,
            expire_date:expire_date,
            
        }
      )

      if (!creatTask)return res.status(403).json({
        message: 'no task added',
      });






    return res.status(201).json({
      message: 'task added successfully',
      task:{
            parent_id: parentId,
            child_id: currentChild._id,
            title,
            description,
            points,
            punishment,
            expire_date,
            created_at: moment().tz("Africa/Cairo").format("YYYY-MM-DD HH:mm:ss")
            
        },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error.message || 'Internal server error',
    });
  }
};

async function generateUniqueChildCode(maxAttempts = 20) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const exists = await childModel.findOne({ code });
    if (!exists) return code;
  }
  return null;
}
