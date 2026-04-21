const jwt = require("jsonwebtoken");
const env = require("../config/env");

const signAccessToken = (payload) =>
  jwt.sign(payload, env.accessSecret, { expiresIn: env.accessExpiresIn });

const signRefreshToken = (payload) =>
  jwt.sign(payload, env.refreshSecret, { expiresIn: env.refreshExpiresIn });

const verifyAccessToken = (token) => jwt.verify(token, env.accessSecret);
const verifyRefreshToken = (token) => jwt.verify(token, env.refreshSecret);

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
