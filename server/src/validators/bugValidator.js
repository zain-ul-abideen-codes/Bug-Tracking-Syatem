const { BUG_STATUS, BUG_TYPES } = require("../utils/constants");

const validateBugInput = ({ title, type, status, project }) => {
  const errors = {};

  if (!title?.trim()) {
    errors.title = "Title is required.";
  }

  if (!Object.values(BUG_TYPES).includes(type)) {
    errors.type = "Type must be bug or feature.";
  }

  if (!project?.trim()) {
    errors.project = "Project is required.";
  }

  if (!status || !BUG_STATUS[type]?.includes(status)) {
    errors.status = "Status is invalid for the selected type.";
  }

  return errors;
};

module.exports = {
  validateBugInput,
};
