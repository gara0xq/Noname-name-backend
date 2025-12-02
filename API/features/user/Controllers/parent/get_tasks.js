const jwt = require('jsonwebtoken');
const userModel = require('../../models/user_model');
const permissionsModel = require('../../models/permissions_model');
const familyModel = require('../../models/family_model');
const childModel = require('../../models/child_model');
const parent_model = require('../../models/parent_model');
const taskModel = require('../../models/tasks_model')

exports.get_tasks = async (req, res) => {
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
    

    const family = await familyModel.findById(familyId);
    if (!family) {
      return res.status(403).json({ message: 'Invalid family (from token)' });
    }

    const parentUser = await userModel.findById(parentUserId);
    if (!parentUser) return res.status(403).json({ message: 'Parent user not found' });

    if (String(parentUser.family_id) !== String(family._id)) {
      return res.status(403).json({
        message: 'You are not allowed to show a child to this family',
      });
    }

   
    const result = await fetchAlltasks(parentId,res);


    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    return res.status(500).json({
      message: error.message || 'Internal server error',
    });
  }
};

async function fetchAlltasks(parentId ,res) {
  const parent = await parent_model.findOne({ _id:parentId   });
  if (!parent) {
    return res.status(409).json({ message: 'there is no parent' }); 
  }

  const tasks = await taskModel.find({
    parent_id:parentId
  }).select('_id');

  if (!tasks.length) {
    return res.status(409).json({ message: 'there is no tasks' }); 
  }

  const taskIds = tasks.map(u => u._id);

  const taskss = await taskModel
    .find({ _id: { $in: taskIds } })

  if (!taskss.length) {
    return {
      status: false,
      message: 'there is no tasks',
      children: []
    };
  }
  

  const mappedPromises = taskss.map(async t => {
    const name = await getNameById(t.child_id); 
    return {
      id: t._id,
      title: t.title,
      points: t.points,
      status: t.status,
      expire_date: t.expire_date,
      name: name 
    };
  });

  
  const tasksss = await Promise.all(mappedPromises);

  return {
    message: 'tasks fetched successfully',
    tasksss
  };
}
async function getNameById(child_id) {
  const child = await childModel.findById(child_id).populate("user_id", "name");

  if (!child) return null;
  if (!child.user_id) return null;

  return child.user_id.name;
}


