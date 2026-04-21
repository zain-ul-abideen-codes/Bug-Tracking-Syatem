const path = require("path");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env") });

const connectDB = require("../config/db");
const env = require("../config/env");
const User = require("../models/User");
const { ROLES } = require("../utils/constants");

const seedAdmin = async () => {
  try {
    await connectDB(env.mongoUri);

    const existingAdmin = await User.findOne({ email: env.seedAdminEmail.toLowerCase() });
    if (existingAdmin) {
      console.log("Admin account already exists.");
      process.exit(0);
    }

    await User.create({
      name: env.seedAdminName || "System Administrator",
      email: env.seedAdminEmail.toLowerCase(),
      password: env.seedAdminPassword,
      role: ROLES.ADMIN,
    });

    console.log("Admin account seeded successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Failed to seed admin:", error.message);
    process.exit(1);
  }
};

seedAdmin();
