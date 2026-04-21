const express = require("express");
const authenticate = require("../middleware/auth");
const { getDashboardData } = require("../controllers/dashboardController");

const router = express.Router();

router.get("/", authenticate, getDashboardData);

module.exports = router;
