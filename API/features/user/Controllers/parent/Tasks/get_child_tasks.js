const auth = require('../../../../../utils/auth');
const userModel = require('../../../models/user_model');
const familyModel = require('../../../models/family_model');
const childModel = require('../../../models/child_model');
const taskModel = require('../../../models/tasks_model');
require('dotenv').config();
const taskHelpers = require('../../../../../utils/taskHelpers');

exports.get_child_task = async (req, res) => {
  try {
    let decoded;
    try {
      decoded = await auth.verifyParentToken(req);
    } catch (err) {
      console.error('get_child_task auth error:', err);
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

    const { childcode } = req.body;
    if (!childcode) return res.status(400).json({ message: 'child code is required' });

    const tasksResult = await taskHelpers.fetchTaskByChildCode(childcode, familyId);
    if (!tasksResult) return res.status(404).json({ message: 'Parent not found' });
    if (Array.isArray(tasksResult) && tasksResult.length === 0) {
      return res.status(200).json({ message: 'there is no tasks', tasks: [] });
    }

    return res.status(200).json({
      message: 'Task fetched successfully',
      task: tasksResult,
    });
  } catch (error) {
    console.error('get_child_task error:', error);
    if (error && error.status) return res.status(error.status).json({ message: error.message });
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

// fetchTaskByChildCode and helpers moved to `API/utils/taskHelpers.js`
