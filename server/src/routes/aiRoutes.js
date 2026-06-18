const express = require("express");
const authenticate = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const { parseBugReport, resolutionCopilot } = require("../controllers/aiController");
const { ROLES } = require("../utils/constants");

const router = express.Router();

router.post("/parse-bug-report", authenticate, authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.QA), parseBugReport);
router.post(
  "/resolution-copilot",
  authenticate,
  authorize(ROLES.DEVELOPER),
  resolutionCopilot
);

module.exports = router;
