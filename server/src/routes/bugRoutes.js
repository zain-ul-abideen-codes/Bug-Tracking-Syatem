const express = require("express");
const authenticate = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const bugPriorityRateLimiter = require("../middleware/bugPriorityRateLimiter");
const sanitizePrioritySuggestionInput = require("../middleware/sanitizePrioritySuggestionInput");
const validateObjectId = require("../middleware/validateObjectId");
const upload = require("../config/multer");
const { listBugs, suggestPriority, createBug, updateBug, deleteBug, addComment } = require("../controllers/bugController");
const { ROLES } = require("../utils/constants");

const router = express.Router();

router.use(authenticate);
router.get("/", listBugs);
router.post("/suggest-priority", bugPriorityRateLimiter, sanitizePrioritySuggestionInput, suggestPriority);
router.post(
  "/",
  authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.QA),
  upload.single("screenshot"),
  createBug
);
router.put(
  "/:id",
  authorize(ROLES.ADMIN, ROLES.QA, ROLES.DEVELOPER),
  validateObjectId(),
  upload.single("screenshot"),
  updateBug
);
router.post(
  "/:id/comments",
  authorize(ROLES.ADMIN, ROLES.QA, ROLES.DEVELOPER),
  validateObjectId(),
  addComment
);
router.delete("/:id", authorize(ROLES.ADMIN, ROLES.QA), validateObjectId(), deleteBug);

module.exports = router;
