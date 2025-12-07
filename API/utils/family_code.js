const familyModel = require('../features/user/models/family_model');

async function generateUniqueFamilyCode(maxAttempts = 20) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const exists = await familyModel.findOne({ code });
    if (!exists) return code;
  }
  return false;
}

async function checkFamilyCode(code) {
  if (code) {
    const family = await familyModel.findOne({ code: code });

    if (!family) {
      return null;
    }

    return family;
  }
}

module.exports = {
  generateUniqueFamilyCode,
  checkFamilyCode,
};