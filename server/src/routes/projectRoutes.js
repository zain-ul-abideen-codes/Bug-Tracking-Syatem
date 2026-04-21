const express = require("express");
const authenticate = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const validateObjectId = require("../middleware/validateObjectId");
const {
  listProjects,
  createProject,
  updateProject,
  deleteProject,
} = require("../controllers/projectController");
const { ROLES } = require("../utils/constants");

const router = express.Router();

router.use(authenticate);
router.get("/", listProjects);
router.post("/", authorize(ROLES.ADMIN, ROLES.MANAGER), createProject);
router.put("/:id", authorize(ROLES.ADMIN, ROLES.MANAGER), validateObjectId(), updateProject);
router.delete("/:id", authorize(ROLES.ADMIN, ROLES.MANAGER), validateObjectId(), deleteProject);

module.exports = router;
