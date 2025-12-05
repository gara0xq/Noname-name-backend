
const userModel = require('../../../models/user_model');
const permissionsModel = require('../../../models/permissions_model');
const familyModel = require('../../../models/family_model');
const childModel = require('../../../models/child_model');
const verifyJwt = require('../../../../../config/jwt_token_for_parent')

exports.get_children = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({
      message:'token not found'
    });

    const decoded = await verifyJwt.verifyJwt(token)
    
    const parentUserId = decoded.userId;
    const familyId = decoded.familyId;

    const family = await familyModel.findById(familyId);
    if (!family) {
      return res.status(403).json({ message: 'Invalid family (from token)' });
    }

    const parentUser = await userModel.findById(parentUserId);
    if (!parentUser) return res.status(403).json({ message: 'Parent user not found' });

    if (String(parentUser.family_id) !== String(family._id)) {
      return res.status(403).json({
        message: 'You are not allowed to show a child to this family',
      });
    }

    let { code } = req.body;
     if (!code) {
      return res.status(400).json({
        message: 'code are required',
      });

    }
    if (typeof code !== 'string' || !code.trim()) {
    return res.status(400).json({ message: 'code is required' });
  }
  const currentChild = await childModel.findOne({code})
  if (!currentChild) return res.status(404).json({
    message:'child not found'
  })
  code = code.trim();
      const currentChildUser = await userModel.findOne({
        family_id : familyId,
        _id:currentChild.user_id
      })
      if(!currentChildUser) return res.status(404).json({
          message: 'code is incorrect',
        });
    const result = await fetchChildren(familyId,res,code)
    return res.status(200).json(result);
  }catch(error){

    console.error(error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    return res.status(500).json({
      message: error.message || 'Internal server error',
    });
  
  }

}

async function fetchChildren(familyId,res,code,permissionTitle='child') {
  const permission = await permissionsModel.findOne({ title: permissionTitle });
  if (!permission) {
    return res.status(409).json({ message: 'there is no children' }); 
  }


  const users = await userModel.find({
    family_id: familyId,
    permissions_id: permission._id,
    
  }).select('_id').lean();

  if (!users.length) {
    return res.status(409).json({ message: 'there is no children' }); 
  }

  const userIds = users.map(u => u._id);

  const children = await childModel
    .find({ user_id: { $in: userIds } ,code:code})
    .populate('user_id', 'name')
    .select('code gender points user_id birth_date');

  if (!children.length) {
    return res.status(409).json({ message: 'there is no child' }); 
  }

  return {
    message: 'child fetched successfully',
    child:  {
      name: children[0].user_id ? children[0].user_id.name : null,
      code: children[0].code,
      gender: children[0].gender,
      birth_date: children[0].birth_date,
      points: children[0].points ?? 0
    }
  };
}