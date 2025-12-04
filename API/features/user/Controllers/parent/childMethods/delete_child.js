const verifyJwt = require('../../../../../config/jwt_token_for_parent');
const userModel = require('../../../models/user_model');
const familyModel = require('../../../models/family_model');
const childModel = require('../../../models/child_model');
const tasks_model = require('../../../models/tasks_model');

exports.deleteChild = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    const decoded = await verifyJwt.verifyJwt(token);
    if (!decoded || !decoded.userId || !decoded.familyId) {
      return res.status(401).json({ message: 'Invalid token payload' });
    }

    const parentUserId = decoded.userId;
    const familyId = decoded.familyId;

    let { code } = req.body;
    if (!code) {
      return res.status(400).json({ message: 'code is required' });
    }
    code = String(code).trim();
    if (code.length !== 6) {
      return res.status(400).json({ message: 'code must be 6 characters long' });
    }

    const family = await familyModel.findById(familyId);
    if (!family) return res.status(403).json({ message: 'Invalid family (from token)' });

    const parentUser = await userModel.findById(parentUserId);
    if (!parentUser) return res.status(403).json({ message: 'Parent user not found' });

    if (String(parentUser.family_id) !== String(family._id)) {
      return res.status(403).json({ message: 'You are not allowed to delete a child from this family' });
    }

    const existchild = await childModel.findOne({ code: code });
    if (!existchild) return res.status(404).json({ message: 'Child not found by code' });

    if (existchild.family_id && String(existchild.family_id) !== String(family._id)) {
      return res.status(403).json({ message: 'Child does not belong to this family' });
    }

    const currentChildUser = await userModel.findOne({
      family_id: familyId,
      _id: existchild.user_id
    });
    if (!currentChildUser) return res.status(404).json({ message: 'Child does not belong to this family' });

    const tasksDel = await tasks_model.deleteMany({ child_id: existchild._id });
    const userDel = await userModel.deleteOne({ _id: existchild.user_id });
    const childDel = await childModel.deleteOne({ _id: existchild._id });

    if (childDel.deletedCount === 0) {
      return res.status(500).json({ message: 'Failed to delete child' });
    }

    return res.status(200).json({
      message: 'Child deleted successfully'
    });
  } catch (error) {
    console.error('deleteChild error:', { message: error.message, stack: error.stack });
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};