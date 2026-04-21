const ROLES = {
  ADMIN: "administrator",
  MANAGER: "manager",
  QA: "qa",
  DEVELOPER: "developer",
};

const BUG_TYPES = {
  BUG: "bug",
  FEATURE: "feature",
};

const BUG_STATUS = {
  bug: ["new", "started", "resolved", "reopened"],
  feature: ["new", "started", "completed", "reopened"],
};

module.exports = {
  ROLES,
  BUG_TYPES,
  BUG_STATUS,
};
