const auth = require('../../../../../utils/auth');
const userModel = require('../../../models/user_model');
const familyModel = require('../../../models/family_model');
const childModel = require('../../../models/child_model');
const reward_model = require('../../../models/reward_model');

exports.deletereward = async (req, res) => {
  try {
    let decoded;
    try {
      decoded = await auth.verifyParentToken(req);
    } catch (err) {
      console.error('deletereward auth error:', err);
      return res.status(err.status || 401).json({ message: err.message || 'Invalid or expired token' });
    }

    if (!decoded || !decoded.userId || !decoded.familyId) {
      return res.status(401).json({ message: 'Invalid token payload' });
    }

    const parentUserId = decoded.userId;
    const familyId = decoded.familyId;

    let rewardId = req.params.id;
    console.log(rewardId);
    if (!rewardId) return res.status(400).json({ message: 'rewardId is required' });
    rewardId = String(rewardId).trim();

    const family = await familyModel.findById(familyId);
    if (!family) return res.status(403).json({ message: 'Invalid family (from token)' });

    const parentUser = await userModel.findById(parentUserId);
    if (!parentUser) return res.status(403).json({ message: 'Parent user not found' });

    if (String(parentUser.family_id) !== String(family._id)) {
      return res
        .status(403)
        .json({ message: 'You are not allowed to delete a reward from this family' });
    }
    console.log(rewardId);

    const existreward = await reward_model.findById(rewardId);
    if (!existreward) return res.status(404).json({ message: 'reward not found by rewardId' });

    if (existreward.child_id) {
      const child = await childModel.findById(existreward.child_id);
      if (!child) return res.status(404).json({ message: 'Child for this reward not found' });

      if (child.family_id && String(child.family_id) !== String(family._id)) {
        return res.status(403).json({ message: 'reward does not belong to this family' });
      }

      const currentChildUser = await userModel.findOne({
        family_id: familyId,
        _id: child.user_id,
      });
      if (!currentChildUser)
        return res.status(404).json({ message: 'Child does not belong to this family' });
    }

    const delRes = await reward_model.deleteOne({ _id: existreward._id });
    if (delRes.deletedCount === 0) {
      return res.status(500).json({ message: 'Failed to delete reward' });
    }

    return res.status(200).json({
      message: 'reward deleted successfully',
      deleted: { rewardDeleted: delRes.deletedCount, reward_id: existreward._id },
    });
  } catch (error) {
    console.error('deletereward error:', { message: error.message, stack: error.stack });
    if (error && error.status) return res.status(error.status).json({ message: error.message });
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};
