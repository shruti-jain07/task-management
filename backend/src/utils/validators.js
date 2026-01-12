function isValidEmail(email) {
  if (!email) return false;
  const trimmed = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmed);
}

module.exports = {
  isValidEmail,
};
