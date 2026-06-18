const rateLimit = require("express-rate-limit");

const bugPriorityRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => String(req.user?._id || "anonymous"),
  message: {
    message: "Too many priority suggestion requests. Please try again in a minute.",
  },
});

module.exports = bugPriorityRateLimiter;
