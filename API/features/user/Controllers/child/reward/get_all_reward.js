const auth = require('../../../../../utils/auth');
const childModel = require('../../../models/child_model');
const rewardModel = require('../../../models/reward_model');
const userModel = require('../../../models/user_model');
require('dotenv').config();

exports.get_my_rewards = async (req, res) => {
  try {
    let decoded;
    try {
      decoded = await auth.verifyChildToken(req);
    } catch (err) {
      console.error('get_my_rewards auth error:', err);
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

    const childUser = await userModel
      .findById(existingChild.user_id)
      .select('name family_id')
      .lean();
    if (!childUser) {
      return res.status(404).json({ message: 'child user not found' });
    }

    const rewards = await rewardModel
      .find({ child_id: existingChild._id })
      .sort({ created_at: -1 })
      .lean();
    if (!rewards || rewards.length === 0) {
      return res.status(200).json({
        message: 'no rewards found',
        child: {
          id: existingChild._id,
          code: existingChild.code,
          name: childUser.name || null,
        },
        rewards: [],
      });
    }

    return res.status(200).json({
      message: 'Rewards fetched successfully',
      child: {
        id: existingChild._id,
        code: existingChild.code,
        name: childUser.name || null,
      },
      rewards,
    });
  } catch (error) {
    console.error('get_my_rewards error:', error);
    if (error && error.status) return res.status(error.status).json({ message: error.message });
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};
