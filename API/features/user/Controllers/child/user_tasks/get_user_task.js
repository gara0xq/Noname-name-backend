const jwtUtil = require('../../../../../config/jwt_token_for_child');
const userModel = require('../../../models/user_model');
const childModel = require('../../../models/child_model');
const taskModel = require('../../../models/tasks_model');
require('dotenv').config();

exports.get_my_tasks = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'token not found' });

    let decoded;
    try {
      decoded = await jwtUtil.verifyJwt(token);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    const { role, childId, userId } = decoded;
    if (!role || role.toLowerCase().trim() !== 'child') {
      return res.status(403).json({ message: 'Token role is not child' });
    }

    let existingChild = null;
    if (childId) {
      existingChild = await childModel.findById(childId).select('_id user_id code').lean();
    }
    if (!existingChild && userId) {
      existingChild = await childModel.findOne({ user_id: userId }).select('_id user_id code').lean();
    }
    if (!existingChild) {
      return res.status(404).json({ message: 'child not found' });
    }

    const tasks = await fetchTaskByChildId(existingChild._id);

    return res.status(200).json({
      message: 'Tasks fetched successfully',
      tasks
    });
  } catch (error) {
    console.error('get_my_tasks error:', error);
    return res.status(500).json({
      message: error.message || 'Internal server error',
    });
  }
};

async function fetchTaskByChildId(childId) {
  const child = await childModel
    .findById(childId)
    .populate('user_id', 'name')
    .lean();

  if (!child) return [];

  const tasks = await taskModel
    .find({ child_id: childId })
    .sort({ created_at: -1 })
    .lean();

  if (!tasks || tasks.length === 0) return [];

  const mapped = [];

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
      child_name: child.user_id?.name || null
    });
  }

  return mapped;
}

async function updateTaskIfExpired(task) {
  const now = new Date();
  const expireDate = task.expire_date ? new Date(task.expire_date) : null;


  if (task.status === 'submitted') {
    return 'submitted';
  }

  if (expireDate && expireDate < now && task.status !== 'completed') {
    try {

      await taskModel.findByIdAndUpdate(task._id, { status: 'expired' }, { new: true });
    } catch (err) {
      console.error('Failed to mark task expired:', err);

    }
    return 'expired';
  }


  return task.status;
}
