const userModel = require('../../models/user_model');
const jwt = require('../../../../config/jwt_token_for_child');
const childModel = require('../../models/child_model');
const permissionsModel = require('../../models/permissions_model');
const family_model = require('../../models/family_model');

exports.login = async (req, res) => {
  try {
    let { childCode } = req.body;
    if (typeof childCode !== 'string' || !childCode.trim()) {
      return res.status(400).json({ message: 'childCode is required' });
    }

    childCode = childCode.trim();
    if (childCode.length !== 6) {
      return res.status(400).json({ message: 'childCode must be 6 characters long' });
    }

    const existingchild = await childModel.findOne({ code: childCode });

    if (!existingchild) {
      return res.status(404).json({ message: 'child not found' });
    }

    const existinguser = await userModel.findById(existingchild.user_id);
    if (!existinguser) {
      return res.status(404).json({ message: 'Child user not found' });
    }

    const existpermission = await permissionsModel.findById(existinguser.permissions_id);
    if (!existpermission) return res.status(404).json({ message: "Can't find role" });
    if (String(existpermission.title).toLowerCase().trim() !== 'child')
      return res.status(403).json({ message: 'User is not a child' });

    const existfamily = await family_model.findById(existinguser.family_id);
    if (!existfamily) return res.status(404).json({ message: 'family not found' });

    const token = await jwt.signJwt(existingchild, existinguser, existpermission, childCode);
    if (!token) return res.status(400).json({ message: 'Problem creating token' });
    return res.status(200).json({ message: 'Child login successful', token });
  } catch (error) {
    console.error('child_login error:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};
