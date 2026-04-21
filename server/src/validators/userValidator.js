const { ROLES } = require("../utils/constants");

const validateUserInput = ({ name, email, password, role }, isUpdate = false) => {
  const errors = {};

  if (!name?.trim()) {
    errors.name = "Name is required.";
  }

  if (!email?.trim()) {
    errors.email = "Email is required.";
  }

  if (!isUpdate && !password?.trim()) {
    errors.password = "Password is required.";
  }

  if (password && password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }

  if (!Object.values(ROLES).includes(role)) {
    errors.role = "Invalid role selected.";
  }

  return errors;
};

module.exports = {
  validateUserInput,
};
