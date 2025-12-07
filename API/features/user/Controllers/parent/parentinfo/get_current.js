const auth = require('../../../../../utils/auth');
const parentModel = require('../../../models/parent_model');
const userModel = require('../../../models/user_model');
const familyModel = require('../../../models/family_model');

exports.getCurrent = async (req, res) => {
  try {
    let decoded;
    try {
      decoded = await auth.verifyParentToken(req);
    } catch (err) {
      console.error('getCurrent auth error:', err);
      return res.status(err.status || 401).json({ status: false, message: err.message || 'No token provided' });
    }

    const user_id = decoded.userId;

    const existingParent = await parentModel.findOne({ user_id: user_id });
    const existingUser = await userModel.findById(user_id);
    const existingFamily = await familyModel.findById(decoded.familyId);

    if (!existingParent || !existingUser || !existingFamily) {
      return res.status(404).json({
        status: false,
        message: 'User or family not found',
      });
    }

    return res.status(200).json({
      email: existingParent.email,
      phone_number: existingParent.phone_number,
      name: existingUser.name,
      family_code: existingFamily.code,
    });
  } catch (error) {
    console.error('getCurrent error:', error);
    if (error && error.status) return res.status(error.status).json({ status: false, message: error.message });
    return res.status(500).json({ status: false, message: 'Something went wrong', error: error.message });
  }
};
