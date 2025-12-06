const verifyJwt = require('../../../../../config/jwt_token_for_parent')
const userModel = require('../../../models/user_model');
const familyModel = require('../../../models/family_model');
const childModel = require('../../../models/child_model');
const taskModel = require('../../../models/tasks_model');
const submit_model = require('../../../models/submit_model');
require('dotenv').config()

exports.get_current_task = async (req, res) => {
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

  
    const { taskId } = req.body; 
    if (!taskId) return res.status(400).json({ message: 'taskId is required' });


    const taskResult = await fetchTaskById(taskId);
    if (!taskResult) return res.status(404).json({ message: 'Task not found' });

    return res.status(200).json({
      message: 'Task fetched successfully',
      task: taskResult
    });
  } catch (error) {
    console.error(error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

async function fetchTaskById(taskId) {

  const task = await taskModel.findById(taskId);
  if (!task) return null;
  const childName = await getNameById(task.child_id);
  const existSubmition = await submit_model.findOne({task_id:taskId})
  let pic , submitDate
  
  if(existSubmition){
    
    pic = existSubmition.proof_image_url,
    submitDate = existSubmition.submited_at
    
  }


  return {
    id: task._id,
    title: task.title,
    description: task.description,
    punishment: task.punishment,
    points: task.points,
    status: task.status,
    expire_date: task.expire_date,
    created_at: task.created_at,
    child_name: childName,
    proof_image_url:existSubmition? pic :"" ,
    submitDate:existSubmition? submitDate :""
  };
}

async function getNameById(child_id) {
  if (!child_id) return null;
  const child = await childModel.findById(child_id).populate('user_id', 'name');
  if (!child || !child.user_id) return null;
  return child.user_id.name;
}
