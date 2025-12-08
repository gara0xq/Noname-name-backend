const bcrypt = require('bcryptjs');
const parentModel = require('../../models/parent_model');
const userModel = require('../../models/user_model');

const permissionsModel = require('../../models/permissions_model');
const jwtSign = require('../../../../config/jwt_token_for_parent');

exports.login = async (req, res) => {
  try {
    let { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: ' email, password are required' });
    }

    const existingParent = await parentModel.findOne({ email: email.toLowerCase().trim() });

    if (!existingParent) {
      return res.status(404).json({ message: 'Email not found' });
    }

    const match = await bcrypt.compare(password, existingParent.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    const existinguser = await userModel.findById(existingParent.user_id);
    if (!existinguser) {
      return res.status(404).json({ message: 'Associated user not found' });
    }

    
    const existpermission = existinguser.permissions_id
      ? await permissionsModel.findById(existinguser.permissions_id)
      : null;
    if (!existpermission) {
      return res.status(404).json({ message: 'Permission not found for user' });
    }
    const token = await jwtSign.signJwt(existingParent, existinguser, existpermission);
    if (!token) return res.status(400).json({ message: 'problem with token creation' });

    return res.status(201).json({
      token: token,
    });
  } catch (error) {
    console.error('parent_login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
