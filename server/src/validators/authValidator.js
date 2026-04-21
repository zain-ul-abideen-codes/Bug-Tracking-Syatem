const validateLoginInput = ({ email, password }) => {
  const errors = {};

  if (!email?.trim()) {
    errors.email = "Email is required.";
  }

  if (!password?.trim()) {
    errors.password = "Password is required.";
  }

  return errors;
};

module.exports = {
  validateLoginInput,
};
