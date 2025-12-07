const userModel = require('../../../models/user_model');
const permissionsModel = require('../../../models/permissions_model');
const familyModel = require('../../../models/family_model');
const childModel = require('../../../models/child_model');
const taskModel = require('../../../models/tasks_model');
const auth = require('../../../../../utils/auth');
const childHelpers = require('../../../../../utils/childHelpers');
const taskHelpers = require('../../../../../utils/taskHelpers');

exports.get_children = async (req, res) => {
  try {
    let decoded;
    try {
      decoded = await auth.verifyParentToken(req);
    } catch (err) {
      console.error('get_children auth error:', err);
      return res.status(err.status || 401).json({ message: err.message || 'Invalid or expired token' });
    }

    const parentUserId = decoded.userId;
    const familyId = decoded.familyId;

    const family = await familyModel.findById(familyId);
    if (!family) {
      return res.status(403).json({ message: 'Invalid family (from token)' });
    }

    const parentUser = await userModel.findById(parentUserId);
    if (!parentUser) {
      return res.status(403).json({ message: 'Parent user not found' });
    }

    if (String(parentUser.family_id) !== String(family._id)) {
      return res.status(403).json({
        message: 'You are not allowed to show children for this family',
      });
    }

    const result = await childHelpers.fetchChildren(familyId);

    if (!result || !result.children || result.children.length === 0) {
      return res.status(409).json({ message: 'there is no children' });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('get_children error:', error);
    if (error && error.status) return res.status(error.status).json({ message: error.message });
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

