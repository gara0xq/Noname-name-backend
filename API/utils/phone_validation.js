exports.isValidPhone = (phone) => {
  if (!phone) return false;

  const phoneRegex = /^[+]?[0-9]{7,15}$/;
  return phoneRegex.test(phone.toString().trim());
};
