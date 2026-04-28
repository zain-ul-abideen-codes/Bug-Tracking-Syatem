const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const env = require("../config/env");
const User = require("../models/User");
const { validateLoginInput } = require("../validators/authValidator");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require("../services/tokenService");

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: env.nodeEnv === "production",
};

const buildAuthResponse = (user) => {
  const payload = {
    userId: user._id,
    role: user.role,
    email: user.email,
    name: user.name,
  };

  return {
    accessToken: signAccessToken(payload),
    refreshToken: user.refreshToken || signRefreshToken({ userId: user._id }),
    user: payload,
  };
};

const login = asyncHandler(async (req, res) => {
  const errors = validateLoginInput(req.body);
  if (Object.keys(errors).length) {
    return res.status(400).json({ message: "Validation failed", errors });
  }

  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const auth = buildAuthResponse(user);
  user.refreshToken = auth.refreshToken;
  await user.save();

  res
    .cookie(env.refreshCookieName, auth.refreshToken, cookieOptions)
    .status(200)
    .json({
      accessToken: auth.accessToken,
      user: auth.user,
    });
});

const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[env.refreshCookieName];
  if (!token) {
    throw new ApiError(401, "Refresh token missing.");
  }

  const payload = verifyRefreshToken(token);
  const user = await User.findById(payload.userId);

  if (!user || user.refreshToken !== token) {
    throw new ApiError(401, "Refresh token invalid.");
  }

  const auth = buildAuthResponse(user);

  res
    .cookie(env.refreshCookieName, auth.refreshToken, cookieOptions)
    .status(200)
    .json({
      accessToken: auth.accessToken,
      user: auth.user,
    });
});

const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.[env.refreshCookieName];
  if (token) {
    const user = await User.findOne({ refreshToken: token });
    if (user) {
      user.refreshToken = null;
      await user.save();
    }
  }

  res.clearCookie(env.refreshCookieName, cookieOptions).status(200).json({
    message: "Logged out successfully.",
  });
});

const me = asyncHandler(async (req, res) => {
  res.status(200).json({ user: req.user });
});

module.exports = {
  login,
  refresh,
  logout,
  me,
};
