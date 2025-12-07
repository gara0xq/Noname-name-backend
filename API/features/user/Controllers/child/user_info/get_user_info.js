const userModel = require('../../../models/user_model');
const permissionsModel = require('../../../models/permissions_model');
const familyModel = require('../../../models/family_model');
const childModel = require('../../../models/child_model');
const taskModel = require('../../../models/tasks_model');
const auth = require('../../../../../utils/auth');
const taskHelpers = require('../../../../../utils/taskHelpers');

exports.getChildData = async (req, res) => {
  try {
    let decoded;
    try {
      decoded = await auth.verifyChildToken(req);
    } catch (err) {
      console.error('getChildData auth error:', err);
      return res.status(err.status || 401).json({ message: err.message || 'Invalid or expired token' });
    }

    const { role, childId, userId, familyId } = decoded;

    if (!role || (role.toLowerCase && role.toLowerCase().trim() !== 'child')) {
      return res.status(403).json({ message: 'Token role is not child' });
    }

    let existingChild = null;
    if (childId) {
      existingChild = await childModel
        .findById(childId)
        .select('_id user_id code gender points birth_date')
        .lean();
    }
    if (!existingChild && userId) {
      existingChild = await childModel
        .findOne({ user_id: userId })
        .select('_id user_id code gender points birth_date')
        .lean();
    }
    if (!existingChild) {
      return res.status(404).json({ message: 'child not found' });
    }

    let user;
    if (familyId && existingChild.user_id) {
      user = await userModel.findById(existingChild.user_id).select('family_id name').lean();

      if (!user || String(user.family_id) !== String(familyId)) {
        return res.status(403).json({ message: 'Family mismatch' });
      }
    }

    const progress = await taskHelpers.fetchTaskStatusByChildId(existingChild._id);

    return res.status(200).json({
      message: 'child fetched successfully',
      child: {
        name: user.name,
        code: existingChild.code,
        gender: existingChild.gender,
        birth_date: existingChild.birth_date,
        points: existingChild.points ?? 0,
        pendingTask: progress.pending,
        completedTask: progress.completed,
        expiredTask: progress.expired,
        submittedTask: progress.submitted,
        declinedTask: progress.declined,
        progress: progress.progress,
      },
    });
  } catch (error) {
    console.error('get_my_child error:', error);
    if (error && error.status) return res.status(error.status).json({ message: error.message });
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

// Task helpers moved to `API/utils/taskHelpers.js`
