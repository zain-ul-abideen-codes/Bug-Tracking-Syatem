const express = require("express");
const authenticate = require("../middleware/auth");
const { login, refresh, logout, me } = require("../controllers/authController");

const router = express.Router();

router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", authenticate, me);

module.exports = router;
