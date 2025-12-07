const auth = require('../../../../../utils/auth');
const userModel = require('../../../models/user_model');
const permissionsModel = require('../../../models/permissions_model');
const familyModel = require('../../../models/family_model');
const childModel = require('../../../models/child_model');
const reward_model = require('../../../models/reward_model');

exports.updatedReward = async (req, res) => {
  try {
    let decoded;
    try {
      decoded = await auth.verifyParentToken(req);
    } catch (err) {
      console.error('updatedReward auth error:', err);
      return res.status(err.status || 401).json({ message: err.message || 'Invalid or expired token' });
    }

    const parentUserId = decoded.userId;
    const familyId = decoded.familyId;

    let { rewardId, title, points, imageurl } = req.body;
    if (!rewardId) {
      return res.status(400).json({
        message: 'rewardId are required',
      });
    }

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ message: 'title is required' });
    }
    title = title.trim();

    if (points === undefined || points === null || points === '') {
      return res.status(400).json({ message: 'points is required' });
    }
    const pointsNumber = Number(points);
    if (!Number.isFinite(pointsNumber) || pointsNumber < 0 || !Number.isInteger(pointsNumber)) {
      return res.status(400).json({ message: 'points must be a non-negative integer' });
    }

    if (!imageurl || typeof imageurl !== 'string') {
      return res.status(400).json({ message: 'imageurl is required' });
    }
    imageurl = imageurl.trim();
    if (!/^https?:\/\/\S+\.\S+/.test(imageurl)) {
      return res.status(400).json({ message: 'imageurl must be a valid URL' });
    }

    rewardId = String(rewardId).trim();

    const family = await familyModel.findById(familyId);
    if (!family) {
      return res.status(403).json({ message: 'Invalid family (from token)' });
    }

    const parentUser = await userModel.findById(parentUserId);
    if (!parentUser) return res.status(403).json({ message: 'Parent user not found' });

    if (String(parentUser.family_id) !== String(family._id)) {
      return res.status(403).json({ message: 'You are not allowed to update a rewards to this family' });
    }

    const existReward = await reward_model.findById(rewardId);
    if (!existReward) return res.status(404).json({ message: 'task not found' });

    const existchild = await childModel.findOne({ _id: existReward.child_id });
    if (!existchild) {
      return res.status(404).json({ message: 'Child not found ' });
    }

    const currentChildUser = await userModel.findOne({
      family_id: familyId,
      _id: existchild.user_id,
    });
    if (!currentChildUser)
      return res.status(404).json({
        message: 'user is incorrect',
      });

    const updatedReward = await reward_model.findByIdAndUpdate(
      rewardId,
      {
        $set: {
          child_id: existReward.child_id,
          title: title,
          image_url: imageurl,
          points_cost: points,
        },
      },
      { new: true }
    );
    if (!updatedReward) {
      return res.status(404).json({ message: 'Associated user for child not found' });
    }

    return res.status(200).json({
      message: 'reward updated successfully',
      reward: {
        id: updatedReward._id,
        child_id: updatedReward.child_id,
        title: updatedReward.title,
        image_url: updatedReward.image_url,
        points_cost: updatedReward.points_cost,
        updated_at: new Date(),
      },
    });
  } catch (error) {
    console.error('updatedReward error:', error);
    if (error && error.status) return res.status(error.status).json({ message: error.message });
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};
