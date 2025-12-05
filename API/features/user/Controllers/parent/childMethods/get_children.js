const userModel = require('../../../models/user_model');
const permissionsModel = require('../../../models/permissions_model');
const familyModel = require('../../../models/family_model');
const childModel = require('../../../models/child_model');
const verifyJwt = require('../../../../../config/jwt_token_for_parent')

exports.get_children = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    const decoded = await verifyJwt.verifyJwt(token)

    const parentUserId = decoded.userId;
    const familyId = decoded.familyId;

    const family = await familyModel.findById(familyId);
    if (!family) {
      return res.status(403).json({ message: 'Invalid family (from token)' });
    }

    const parentUser = await userModel.findById(parentUserId);
    if (!parentUser) return res.status(403).json({ message: 'Parent user not found' });

    if (String(parentUser.family_id) !== String(family._id)) {
      return res.status(403).json({
        message: 'You are not allowed to show a child to this family',
      });
    }

    const result = await fetchAllChildren(familyId);

    // If no children exist
    if (!result.status) {
      return res.status(409).json({
        message: result.message,
        children: result.children
      });
    }

    return res.status(200).json(result);

  } catch (error) {
    console.error(error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};

async function fetchAllChildren(familyId, permissionTitle = 'child') {
  const permission = await permissionsModel.findOne({ title: permissionTitle });
  if (!permission) {
    return {
      message: 'there is no children',
      children: []
    };
  }

  const users = await userModel.find({
    family_id: familyId,
    permissions_id: permission._id
  }).select('_id');

  if (!users.length) {
    return {
      message: 'there is no children',
      children: []
    };
  }

  const userIds = users.map(u => u._id);

  const children = await childModel
    .find({ user_id: { $in: userIds } })
    .populate('user_id', 'name')
    .select('code gender points user_id birth_date');

  if (!children.length) {
    return {

      message: 'there is no children',
      children: []
    };
  }

  return {

    message: 'children fetched successfully',
    children: children.map(c => ({
      name: c.user_id ? c.user_id.name : null,
      code: c.code,
      gender: c.gender,
      birth_date: c.birth_date,
      points: c.points ?? 0
    }))
  };
}
