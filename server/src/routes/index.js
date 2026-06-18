const express = require("express");
const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const projectRoutes = require("./projectRoutes");
const bugRoutes = require("./bugRoutes");
const dashboardRoutes = require("./dashboardRoutes");
const aiRoutes = require("./aiRoutes");
const agentRoutes = require("./agentRoutes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/projects", projectRoutes);
router.use("/bugs", bugRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/ai", aiRoutes);
router.use("/agent", agentRoutes);

module.exports = router;
