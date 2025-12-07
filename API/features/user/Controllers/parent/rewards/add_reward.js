const auth = require('../../../../../utils/auth');
const userModel = require('../../../models/user_model');
const familyModel = require('../../../models/family_model');
const rewardModel = require('../../../models/reward_model');
const childModel = require('../../../models/child_model');

exports.addReward = async (req, res) => {
  try {
    let decoded;
    try {
      decoded = await auth.verifyParentToken(req);
    } catch (err) {
      console.error('addReward auth error:', err);
      return res.status(err.status || 401).json({ message: err.message || 'Invalid or expired token' });
    }

    if (!decoded || !decoded.userId || !decoded.familyId) {
      return res.status(400).json({ message: 'Invalid token payload' });
    }

    const parentUserId = decoded.userId;
    const familyId = decoded.familyId;

    let { code, title, points, imageurl } = req.body;

    if (!code) return res.status(400).json({ message: 'child code is required' });
    code = String(code).trim();

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

    const existingByTitle = await rewardModel.findOne({
      child_id: child._id,
      title: { $regex: `^${title}$`, $options: 'i' },
    });
    if (existingByTitle) {
      return res
        .status(409)
        .json({ message: 'A reward with this title already exists for this child' });
    }

    const newReward = await rewardModel.create({
      child_id: child._id,
      title,
      points_cost: pointsNumber,
      image_url: imageurl,
      redeemed: false,
    });

    return res.status(201).json({
      message: 'Reward created',
      reward: newReward,
    });
  } catch (error) {
    console.error('addReward error:', error);
    if (error && error.status) return res.status(error.status).json({ message: error.message });
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};
