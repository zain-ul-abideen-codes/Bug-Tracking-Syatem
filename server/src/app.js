const express = require("express");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const env = require("./config/env");
const routes = require("./routes");
const agentRoutes = require("./routes/agentRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  })
);
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/uploads", express.static(path.resolve(env.uploadDir)));
app.use("/api/agent", agentRoutes);
app.use("/api", routes);
app.use(errorHandler);

module.exports = app;
