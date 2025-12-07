const auth = require('../../../../../utils/auth');
const userModel = require('../../../models/user_model');
const familyModel = require('../../../models/family_model');
const childModel = require('../../../models/child_model');
const taskModel = require('../../../models/tasks_model');
const submit_model = require('../../../models/submit_model');
require('dotenv').config();

exports.get_current_task = async (req, res) => {
  try {
    let decoded;
    try {
      decoded = await auth.verifyParentToken(req);
    } catch (err) {
      console.error('get_current_task auth error:', err);
      return res.status(err.status || 401).json({ message: err.message || 'Invalid or expired token' });
    }

    const parentUserId = decoded.userId;
    const familyId = decoded.familyId;

    const family = await familyModel.findById(familyId);
    if (!family) return res.status(403).json({ message: 'Invalid family (from token)' });

    const parentUser = await userModel.findById(parentUserId);
    if (!parentUser) return res.status(403).json({ message: 'Parent user not found' });

    if (String(parentUser.family_id) !== String(family._id)) {
      return res
        .status(403)
        .json({ message: 'You are not allowed to access this family resources' });
    }

    const taskId = req.params.id;
    if (!taskId) return res.status(400).json({ message: 'taskId is required' });

    const taskResult = await fetchTaskById(taskId);
    if (!taskResult) return res.status(404).json({ message: 'Task not found' });

    return res.status(200).json({
      message: 'Task fetched successfully',
      task: taskResult,
    });
  } catch (error) {
    console.error('get_current_task error:', error);
    if (error && error.status) return res.status(error.status).json({ message: error.message });
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

async function fetchTaskById(taskId) {
  const task = await taskModel.findById(taskId);
  if (!task) return null;
  const childHelpers = require('../../../../../utils/childHelpers');
  const childName = await childHelpers.getNameById(task.child_id);
  const existSubmition = await submit_model.findOne({ task_id: taskId });
  let pic, submitDate;

  if (existSubmition) {
    ((pic = existSubmition.proof_image_url), (submitDate = existSubmition.submitted_at));
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
    proof_image_url: existSubmition ? pic : '',
    submitDate: existSubmition ? submitDate : '',
  };
}

// getNameById moved to `API/utils/childHelpers.js`
