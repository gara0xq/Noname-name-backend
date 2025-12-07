const userModel = require('../../models/user_model');
const jwt = require('../../../../config/jwt_token_for_child');
const childModel = require('../../models/child_model');
const permissionsModel = require('../../models/permissions_model');
const family_model = require('../../models/family_model');

exports.login = async (req, res) => {
  try {
    let { childCode } = req.body;
    if (!childCode) {
      return res.status(400).json({ message: ' childCode  are required' });
    }

    const existingchild = await childModel.findOne({ code: childCode });

    if (!existingchild) {
      return res.status(404).json({ message: 'child not found' });
    }

    const existinguser = await userModel.findOne({
      _id: existingchild.user_id,
    });
    if (!existinguser) {
      return res.status(404).json({ message: 'child user not found' });
    }

    const existpermission = await permissionsModel.findById(existinguser.permissions_id);
    if (!existpermission) return res.status(404).json({ message: 'cant find role' });
    if (existpermission.title.toLowerCase().trim() !== 'child')
      return res.status(403).json({ message: ' user isnt child ' });

    const existfamily = await family_model.findById(existinguser.family_id);
    if (!existfamily) return res.status(404).json({ message: 'family not found' });

    const token = await jwt.signJwt(existingchild, existinguser, existpermission, childCode);
    if (!token) return res.status(400).json({ message: 'problem with token creation' });
    return res.status(200).json({
      message: 'Child login successful',
      token: token,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'something went wrong' });
  }
};
