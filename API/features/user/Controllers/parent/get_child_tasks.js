const jwt = require('jsonwebtoken');
const userModel = require('../../models/user_model');
const familyModel = require('../../models/family_model');
const childModel = require('../../models/child_model');
const parent_model = require('../../models/parent_model');
const taskModel = require('../../models/tasks_model');
require('dotenv').config()

exports.get_child_task = async (req, res) => {
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

    const family = await familyModel.findById(familyId);
    if (!family) return res.status(403).json({ message: 'Invalid family (from token)' });

    const parentUser = await userModel.findById(parentUserId);
    if (!parentUser) return res.status(403).json({ message: 'Parent user not found' });

    if (String(parentUser.family_id) !== String(family._id)) {
      return res.status(403).json({ message: 'You are not allowed to access this family resources' });
    }

  
    const { childcode } = req.body; 
    if (!childcode) return res.status(400).json({ message: 'child code is required' });


    const tasksResult = await fetchTaskByChildCode(childcode);
    if (!tasksResult) return res.status(404).json({ message: 'Task not found' });

    return res.status(200).json({
      message: 'Task fetched successfully',
      task: tasksResult
    });
  } catch (error) {
    console.error(error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

async function fetchTaskByChildCode(childcode) {
  const existchild = await childModel.findOne({ code: childcode });
  if (!existchild) return null; 

 
  const tasks = await taskModel.find({ child_id: existchild._id }).sort({ created_at: -1 });

  if (!tasks || tasks.length === 0) return [];


  const childName = await getNameById(existchild._id);

  const mapped = tasks.map(t => ({
    id: t._id,
    title: t.title,
    description: t.description,
    punishment: t.punishment,
    points: t.points,
    status: t.status,
    expire_date: t.expire_date,
    created_at: t.created_at,
    child_name: childName
  }));

  return mapped;
}


async function getNameById(child_id) {
  if (!child_id) return null;
  const child = await childModel.findById(child_id).populate('user_id', 'name');
  if (!child || !child.user_id) return null;
  return child.user_id.name;
}
