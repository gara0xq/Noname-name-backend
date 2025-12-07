const auth = require('../../../../../utils/auth');
const taskHelpers = require('../../../../../utils/taskHelpers');
const userModel = require('../../../models/user_model');
const childModel = require('../../../models/child_model');
const taskModel = require('../../../models/tasks_model');
require('dotenv').config();

exports.get_my_tasks = async (req, res) => {
  try {
    let decoded;
    try {
      decoded = await auth.verifyChildToken(req);
    } catch (err) {
      console.error('get_my_tasks auth error:', err);
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

    const tasks = await taskHelpers.fetchTaskByChildId(existingChild._id);

    return res.status(200).json({
      message: 'Tasks fetched successfully',
      tasks,
    });
  } catch (error) {
    console.error('get_my_tasks error:', error);
    if (error && error.status) return res.status(error.status).json({ message: error.message });
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

// Task helpers extracted to `API/utils/taskHelpers.js`
