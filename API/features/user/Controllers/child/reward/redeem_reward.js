const auth = require('../../../../../utils/auth');
const childModel = require('../../../models/child_model');
const rewardModel = require('../../../models/reward_model');
const userModel = require('../../../models/user_model');
require('dotenv').config();

exports.redeem_my_rewards = async (req, res) => {
  try {
    let decoded;
    try {
      decoded = await auth.verifyChildToken(req);
    } catch (err) {
      console.error('redeem_my_rewards auth error:', err);
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

    const rewardId = req.params.id || {};
    if (!rewardId || typeof rewardId !== 'string' || !rewardId.trim()) {
      return res.status(400).json({ message: 'rewardId is required' });
    }
    const rid = rewardId.trim();

    const existReward = await rewardModel.findById(rid).lean();
    if (!existReward) return res.status(404).json({ message: 'reward not found' });

    if (String(existReward.child_id) !== String(existingChild._id)) {
      return res.status(403).json({ message: "You don't have access to redeem this reward" });
    }

    if (existReward.redeemed === true) {
      return res.status(400).json({ message: 'Reward already redeemed' });
    }

    if (typeof existReward.points_cost === 'number') {
      const upToDateChild = await childModel.findById(existingChild._id).select('points').lean();
      const childPoints = upToDateChild?.points ?? 0;
      if (childPoints < existReward.points_cost) {
        return res.status(400).json({ message: 'Not enough points to redeem this reward' });
      }

      await childModel.findByIdAndUpdate(existingChild._id, {
        $inc: { points: -existReward.points_cost },
      });
    }

    const updatedReward = await rewardModel
      .findByIdAndUpdate(rid, { redeemed: true, redeemed_at: new Date() }, { new: true })
      .lean();

    if (!updatedReward) {
      return res.status(500).json({ message: 'Failed to redeem reward' });
    }

    return res.status(200).json({
      message: 'Reward redeemed successfully',
      child: {
        id: existingChild._id,
        code: existingChild.code,
        name: childUser.name || null,
      },
      reward: updatedReward,
    });
  } catch (error) {
    console.error('redeem_my_rewards error:', error);
    if (error && error.status) return res.status(error.status).json({ message: error.message });
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};
