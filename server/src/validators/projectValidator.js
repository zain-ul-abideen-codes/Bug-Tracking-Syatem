const validateProjectInput = ({ title }) => {
  const errors = {};

  if (!title?.trim()) {
    errors.title = "Project title is required.";
  }

  return errors;
};

module.exports = {
  validateProjectInput,
};
