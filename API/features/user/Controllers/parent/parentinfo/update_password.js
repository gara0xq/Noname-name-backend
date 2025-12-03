const verifyJwt = require('../../../../../config/jwt_token_for_parent')
const userModel = require('../../../models/user_model');
const familyModel = require('../../../models/family_model');
const parent_model = require('../../../models/parent_model');
const bcrypt = require('bcryptjs');

exports.updatePass = async (req, res) => {
  try {
    // --- auth ---
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    const decoded = await verifyJwt.verifyJwt(token)

    const parentUserId = decoded.userId;
    const familyId = decoded.familyId;
    const parentId = decoded.parentId;

  
    let { password} = req.body;
    if (!password) return res.status(400).json({ message: 'password is required' });
    password = String(password).trim();
    if (password.length < 6) return res.status(400).json({ message: 'password must be at least 6 characters' });

    
    const family = await familyModel.findById(familyId);
    if (!family) return res.status(403).json({ message: 'Invalid family (from token)' });

    const parentUser = await userModel.findById(parentUserId);
    if (!parentUser) return res.status(403).json({ message: 'Parent user not found' });

    if (String(parentUser.family_id) !== String(family._id)) {
      return res.status(403).json({ message: 'You are not allowed to perform this action for this family' });
    }

    const existParent = await parent_model.findById(parentId);
    if (!existParent) return res.status(404).json({ message: 'Parent not found' });


    const isSame = await bcrypt.compare(password, existParent.password);
    if (isSame) {
      return res.status(400).json({ message: 'New password must be different from the old password' });
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
    console.error(error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};
