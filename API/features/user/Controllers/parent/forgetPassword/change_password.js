const parent_model = require('../../../models/parent_model');
const bcrypt = require('bcryptjs');

exports.updatePass = async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'email is required' });
    }

    email = String(email).toLowerCase().trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Invalid email address' });
    }

    if (!password) {
      return res.status(400).json({ message: 'password is required' });
    }

    password = String(password).trim();

    if (password.length < 6) {
      return res.status(400).json({ message: 'password must be at least 6 characters' });
    }

    const parent = await parent_model.findOne({ email });
    if (!parent) {
      return res.status(404).json({ message: 'Parent not found' });
    }

    const isSame = await bcrypt.compare(password, parent.password);
    if (isSame) {
      return res
        .status(400)
        .json({ message: 'New password must be different from the old password' });
    }

    const hashedPass = await bcrypt.hash(password, 10);

    const updateResult = await parent_model.updateOne(
      { _id: parent._id },
      { $set: { password: hashedPass } }
    );

    if (!updateResult.acknowledged || updateResult.modifiedCount === 0) {
      return res.status(500).json({ message: 'Failed to update password' });
    }

    return res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('updatePass error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
