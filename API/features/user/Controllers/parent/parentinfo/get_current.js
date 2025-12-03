const verifyJwt = require('../../../../../config/jwt_token_for_parent')
const parentModel = require('../../../models/parent_model');
const userModel = require('../../../models/user_model');
const familyModel = require('../../../models/family_model');

exports.getCurrent = async (req, res) => {
  try {
    const authheader = req.headers['authorization'];
    const token = authheader && authheader.split(' ')[1];

    if (token == null) {
      return res.status(401).json({
        status: false,
        message: "No token provided"
      });
    }

    // verify token
    const decoded = await verifyJwt.verifyJwt(token)

    const user_id = decoded.userId;

    const existingParent = await parentModel.findOne({ user_id: user_id });
    const existingUser = await userModel.findById(user_id);
    const existingFamily = await familyModel.findById(decoded.familyId);

    if (!existingParent || !existingUser || !existingFamily) {
      return res.status(404).json({
        status: false,
        message: "User or family not found"
      });
    }

    return res.status(200).json({
         
          email: existingParent.email,
          phone_number: existingParent.phone_number,
          name: existingUser.name,
          family_code: existingFamily.code,
      
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: 'Something went wrong',
      error: error.message
    });
  }
};
