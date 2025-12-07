const userModel = require('../../../models/user_model');
const familyModel = require('../../../models/family_model');
const childModel = require('../../../models/child_model');
const auth = require('../../../../../utils/auth');
const taskHelpers = require('../../../../../utils/taskHelpers');

exports.get_child = async (req, res) => {
  try {
    let decoded;
    try {
      decoded = await auth.verifyParentToken(req);
    } catch (err) {
      console.error('get_child auth error:', err);
      return res.status(err.status || 401).json({ message: err.message || 'Invalid or expired token' });
    }

    const parentUserId = decoded.userId;
    const familyId = decoded.familyId;

    const family = await familyModel.findById(familyId);
    if (!family) return res.status(403).json({ message: 'Invalid family (from token)' });

    const parentUser = await userModel.findById(parentUserId);
    if (!parentUser) return res.status(403).json({ message: 'Parent user not found' });

    if (String(parentUser.family_id) !== String(family._id)) {
      return res.status(403).json({ message: 'You are not allowed to show a child to this family' });
    }

    let { code } = req.body;
    if (typeof code !== 'string' || !code.trim()) {
      return res.status(400).json({ message: 'code is required' });
    }
    code = code.trim();

    const existchild = await childModel.findOne({ code });
    if (!existchild) return res.status(404).json({ message: 'child not found' });

    const currentChildUser = await userModel.findOne({
      family_id: familyId,
      _id: existchild.user_id,
    });
    if (!currentChildUser) return res.status(404).json({ message: 'code is incorrect' });

    const progress = await taskHelpers.fetchTaskStatusByChildId(existchild._id);

    const childResponse = {
      name: currentChildUser.name || null,
      code: existchild.code,
      gender: existchild.gender,
      birth_date: existchild.birth_date,
      points: existchild.points ?? 0,
      pendingTask: progress?.pending ?? 0,
      completedTask: progress?.completed ?? 0,
      expiredTask: progress?.expired ?? 0,
      submittedTask: progress?.submitted ?? 0,
      declinedTask: progress?.declined ?? 0,
      progress: progress?.progress ?? 0,
    };

    return res.status(200).json({ message: 'child fetched successfully', child: childResponse });
  } catch (error) {
    console.error('get_child error:', error);
    if (error && error.status) return res.status(error.status).json({ message: error.message });
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};
