const connectDB = require("../config/db");
const env = require("../config/env");
const User = require("../models/User");
const { ROLES } = require("../utils/constants");

const demoUsers = [
  {
    name: "Project Manager",
    email: "manager@example.com",
    password: "Manager@123",
    role: ROLES.MANAGER,
  },
  {
    name: "QA Engineer",
    email: "qa@example.com",
    password: "Qa@123456",
    role: ROLES.QA,
  },
  {
    name: "Developer User",
    email: "developer@example.com",
    password: "Developer@123",
    role: ROLES.DEVELOPER,
  },
];

const seedDemoUsers = async () => {
  try {
    await connectDB(env.mongoUri);

    for (const demoUser of demoUsers) {
      const existingUser = await User.findOne({ email: demoUser.email.toLowerCase() });

      if (existingUser) {
        existingUser.name = demoUser.name;
        existingUser.role = demoUser.role;
        existingUser.password = demoUser.password;
        existingUser.refreshToken = null;
        await existingUser.save();
        console.log(`Updated ${demoUser.role}: ${demoUser.email}`);
      } else {
        await User.create({
          ...demoUser,
          email: demoUser.email.toLowerCase(),
        });
        console.log(`Created ${demoUser.role}: ${demoUser.email}`);
      }
    }

    console.log("Demo users seeded successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Failed to seed demo users:", error.message);
    process.exit(1);
  }
};

seedDemoUsers();
