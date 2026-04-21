const express = require("express");
const authenticate = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const validateObjectId = require("../middleware/validateObjectId");
const {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
} = require("../controllers/userController");
const { ROLES } = require("../utils/constants");

const router = express.Router();

router.use(authenticate);
router.get("/", authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.QA, ROLES.DEVELOPER), listUsers);
router.get("/:id", authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.QA, ROLES.DEVELOPER), validateObjectId(), getUserById);
router.post("/", authorize(ROLES.ADMIN), createUser);
router.put("/:id", authorize(ROLES.ADMIN), validateObjectId(), updateUser);
router.delete("/:id", authorize(ROLES.ADMIN), validateObjectId(), deleteUser);
router.patch("/:id/reset-password", authorize(ROLES.ADMIN), validateObjectId(), resetUserPassword);

module.exports = router;
