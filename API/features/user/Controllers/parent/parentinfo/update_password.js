const auth = require('../../../../../utils/auth');
const userModel = require('../../../models/user_model');
const familyModel = require('../../../models/family_model');
const parent_model = require('../../../models/parent_model');
const bcrypt = require('bcryptjs');

exports.updatePass = async (req, res) => {
  try {
    let decoded;
    try {
      decoded = await auth.verifyParentToken(req);
    } catch (err) {
      console.error('updatePass auth error:', err);
      return res.status(err.status || 401).json({ message: err.message || 'No token provided' });
    }

    const parentUserId = decoded.userId;
    const familyId = decoded.familyId;
    const parentId = decoded.parentId;

    let { password } = req.body;
    if (!password) return res.status(400).json({ message: 'password is required' });
    password = String(password).trim();
    if (password.length < 6)
      return res.status(400).json({ message: 'password must be at least 6 characters' });

    const family = await familyModel.findById(familyId);
    if (!family) return res.status(403).json({ message: 'Invalid family (from token)' });

    const parentUser = await userModel.findById(parentUserId);
    if (!parentUser) return res.status(403).json({ message: 'Parent user not found' });

    if (String(parentUser.family_id) !== String(family._id)) {
      return res
        .status(403)
        .json({ message: 'You are not allowed to perform this action for this family' });
    }

    const existParent = await parent_model.findById(parentId);
    if (!existParent) return res.status(404).json({ message: 'Parent not found' });

    const isSame = await bcrypt.compare(password, existParent.password);
    if (isSame) {
      return res
        .status(400)
        .json({ message: 'New password must be different from the old password' });
    }

    const hashedPass = await bcrypt.hash(password, 10);
    const updateResult = await parent_model.updateOne(
      { _id: parentId },
      { $set: { password: hashedPass } }
    );

    if (!updateResult.acknowledged || updateResult.modifiedCount === 0) {
      return res.status(500).json({ message: 'Failed to update password' });
    }

    return res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('updatePass error:', error);
    if (error && error.status) return res.status(error.status).json({ message: error.message });
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};
