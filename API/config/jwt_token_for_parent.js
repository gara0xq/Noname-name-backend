const jwt = require('jsonwebtoken');
require('dotenv')


exports.signJwt = async (existingParent,existinguser,existpermission,res)=>{
    try {
        const token = jwt.sign(
            {
                userId:existingParent.user_id,
                familyId:existinguser.family_id,
                parentId:existingParent._id ,
                role: existpermission.title
            }, process.env.ACCESS_TOKEN_SECRET
        );
        return token
        
        
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'something went wrong' });
        
    }
              
}
exports.verifyJwt= async (token,res)=>{
    try {
    const decoded = await new Promise((resolve, reject) => {
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
          if (err) return reject(err);
        resolve(user);
      });
    });
    
    return decoded
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'something went wrong' });
    }
    
}