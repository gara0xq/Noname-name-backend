const auth = require('../../../../../utils/auth');
const userModel = require('../../../models/user_model');
const familyModel = require('../../../models/family_model');
const rewardModel = require('../../../models/reward_model');
const childModel = require('../../../models/child_model');

exports.getReward = async (req, res) => {
  try {
    let decoded;
    try {
      decoded = await auth.verifyParentToken(req);
    } catch (err) {
      console.error('getReward auth error:', err);
      return res.status(err.status || 401).json({ message: err.message || 'Invalid or expired token' });
    }

    if (!decoded || !decoded.userId || !decoded.familyId) {
      return res.status(400).json({ message: 'Invalid token payload' });
    }

    const parentUserId = decoded.userId;
    const familyId = decoded.familyId;

    let { code } = req.body;

    if (!code) return res.status(400).json({ message: 'child code is required' });
    code = String(code).trim();

    const family = await familyModel.findById(familyId);
    if (!family) return res.status(403).json({ message: 'Invalid family (from token)' });

    const parentUser = await userModel.findById(parentUserId);
    if (!parentUser) return res.status(403).json({ message: 'Parent user not found' });

    if (String(parentUser.family_id) !== String(family._id)) {
      return res
        .status(403)
        .json({ message: 'You are not allowed to add a reward to this family' });
    }

    const child = await childModel.findOne({ code: code });
    if (!child) return res.status(404).json({ message: 'Child not found by code' });
    const existchild = await userModel.findById(child.user_id);
    if (!existchild) return res.status(404).json({ message: 'child user not found' });

    if (!existchild.family_id || String(existchild.family_id) !== String(familyId)) {
      return res.status(403).json({ message: 'Child does not belong to this family' });
    }

    const newReward = await rewardModel.find({
      child_id: child._id,
    });

    return res.status(201).json({
      message: 'Reward fetched successfully',
      reward: newReward,
    });
  } catch (error) {
    console.error('getReward error:', error);
    if (error && error.status) return res.status(error.status).json({ message: error.message });
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};
