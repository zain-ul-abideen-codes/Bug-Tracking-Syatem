const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const User = require("../models/User");
const { verifyAccessToken } = require("../services/tokenService");

const authenticate = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;

  if (!token) {
    throw new ApiError(401, "Authentication required.");
  }

  let payload;

  try {
    payload = verifyAccessToken(token);
  } catch (_error) {
    throw new ApiError(401, "Access token expired or invalid.");
  }

  const user = await User.findById(payload.userId).select("-password");

  if (!user) {
    throw new ApiError(401, "User not found.");
  }

  req.user = user;
  next();
});

module.exports = authenticate;
