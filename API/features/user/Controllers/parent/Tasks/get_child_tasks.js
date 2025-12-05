const verifyJwt = require('../../../../../config/jwt_token_for_parent')
const userModel = require('../../../models/user_model');
const familyModel = require('../../../models/family_model');
const childModel = require('../../../models/child_model');
const taskModel = require('../../../models/tasks_model');
require('dotenv').config()

exports.get_child_task = async (req, res) => {
  try {

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    const decoded = await verifyJwt.verifyJwt(token)

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


    const tasksResult = await fetchTaskByChildCode(childcode,familyId);
       if (!tasksResult) return res.status(404).json({ message: 'Parent not found' });
    if (Array.isArray(tasksResult) && tasksResult.length === 0) {
      return res.status(200).json({ message: 'there is no tasks', tasks: [] });
    }

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

async function fetchTaskByChildCode(childcode,familyId) {
  const existchild = await childModel.findOne({ code: childcode });
  if (!existchild) return null; 

 
  const tasks = await taskModel.find({ child_id: existchild._id }).sort({ created_at: -1 });

  if (!tasks || tasks.length === 0) return [];
      const currentChildUser = await userModel.findOne({
        family_id : familyId,
        _id:existchild.user_id
      })
      if(!currentChildUser) return res.status(404).json({
          message: 'code is incorrect',
        });


  const childName = await getNameById(existchild._id);
   const now = new Date();

  const mapped = []

    for (const t of tasks) {
    
    const finalStatus = await updateTaskIfExpired(t);

    mapped.push({
      id: t._id,
      title: t.title,
      description: t.description,
      punishment: t.punishment,
      points: t.points,
      status: finalStatus,
      expire_date: t.expire_date,
      created_at: t.created_at,
      child_name: childName
    });
  }
  
  return mapped; 
}


async function getNameById(child_id) {
  if (!child_id) return null;
  const child = await childModel.findById(child_id).populate('user_id', 'name');
  if (!child || !child.user_id) return null;
  return child.user_id.name;
}


async function updateTaskIfExpired(task) {
  const now = new Date();
  const expireDate = new Date(task.expire_date);

  if (expireDate < now && task.status !== "completed") {
    
    await taskModel.findByIdAndUpdate(
      task._id,
      { status: "expired" },
      { new: true }
    );

    return "expired";
  }

  return task.status; 
}
