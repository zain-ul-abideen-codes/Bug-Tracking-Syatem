const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const User = require("../models/User");
const { ROLES } = require("../utils/constants");
const { validateUserInput } = require("../validators/userValidator");

const listUsers = asyncHandler(async (req, res) => {
  let query = {};
  if (req.user.role === ROLES.MANAGER) {
    query = { role: { $in: [ROLES.QA, ROLES.DEVELOPER] } };
  }
  if (req.user.role === ROLES.QA) {
    query = { role: ROLES.DEVELOPER };
  }
  if (req.user.role === ROLES.DEVELOPER) {
    query = { _id: req.user._id };
  }

  const users = await User.find(query).select("-password -refreshToken").sort({ createdAt: -1 });
  res.status(200).json({ users });
});

const getUserById = asyncHandler(async (req, res) => {
  if (
    [ROLES.QA, ROLES.DEVELOPER].includes(req.user.role) &&
    String(req.user._id) !== req.params.id
  ) {
    throw new ApiError(403, "You can only view your own user record.");
  }

  const user = await User.findById(req.params.id).select("-password -refreshToken");
  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  res.status(200).json({ user });
});

const createUser = asyncHandler(async (req, res) => {
  const errors = validateUserInput(req.body);
  if (Object.keys(errors).length) {
    return res.status(400).json({ message: "Validation failed", errors });
  }

  const existingUser = await User.findOne({ email: req.body.email.toLowerCase() });
  if (existingUser) {
    throw new ApiError(409, "Email is already in use.");
  }

  const user = await User.create({
    name: req.body.name,
    email: req.body.email.toLowerCase(),
    password: req.body.password,
    role: req.body.role,
  });

  res.status(201).json({
    message: "User created successfully.",
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

const updateUser = asyncHandler(async (req, res) => {
  const errors = validateUserInput(req.body, true);
  if (Object.keys(errors).length) {
    return res.status(400).json({ message: "Validation failed", errors });
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  if (req.body.email && req.body.email.toLowerCase() !== user.email) {
    const existingUser = await User.findOne({ email: req.body.email.toLowerCase() });
    if (existingUser) {
      throw new ApiError(409, "Email is already in use.");
    }
  }

  user.name = req.body.name;
  user.email = req.body.email.toLowerCase();
  user.role = req.body.role;
  await user.save();

  res.status(200).json({
    message: "User updated successfully.",
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  await user.deleteOne();
  res.status(200).json({ message: "User deleted successfully." });
});

const resetUserPassword = asyncHandler(async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) {
    throw new ApiError(400, "New password must be at least 8 characters.");
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  user.password = newPassword;
  user.refreshToken = null;
  await user.save();

  res.status(200).json({ message: "Password reset successfully." });
});

module.exports = {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
};
