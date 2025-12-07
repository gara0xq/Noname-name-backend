// controllers/child/get_current_task.js
const auth = require('../../../../../utils/auth');
const taskHelpers = require('../../../../../utils/taskHelpers');
const childModel = require('../../../models/child_model');
const taskModel = require('../../../models/tasks_model');
require('dotenv').config();

exports.get_current_task = async (req, res) => {
  try {
    let decoded;
    try {
      decoded = await auth.verifyChildToken(req);
    } catch (err) {
      console.error('get_current_task auth error:', err);
      return res.status(err.status || 401).json({ message: err.message || 'Invalid or expired token' });
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
      existingChild = await childModel
        .findOne({ user_id: userId })
        .select('_id user_id code')
        .lean();
    }

    if (!existingChild) {
      return res.status(404).json({ message: 'child not found' });
    }

    const taskId = req.params.id;
    if (!taskId) {
      return res.status(400).json({ message: 'taskId is required' });
    }

    const task = await taskHelpers.fetchTaskByIdForChild(taskId, existingChild._id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found or not yours' });
    }
    if (task.status == 'submitted')
      return res.status(403).json({ message: 'this task aready submitted ' });

    return res.status(200).json({
      message: 'Task fetched successfully',
      task,
    });
  } catch (error) {
    console.error('get_current_task error:', error);
    if (error && error.status) return res.status(error.status).json({ message: error.message });
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

// fetchTaskByIdForChild moved to `API/utils/taskHelpers.js`
