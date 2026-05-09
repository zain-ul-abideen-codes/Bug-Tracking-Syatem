const env = require("./config/env");
const app = require("./app");
const connectDB = require("./config/db");
const User = require("./models/User");
const { ROLES } = require("./utils/constants");

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

const ensureAdminAccount = async () => {
  const adminEmail = env.seedAdminEmail.toLowerCase();
  const existingAdmin = await User.findOne({ email: adminEmail });

  if (existingAdmin) {
    const isDevelopment = env.nodeEnv !== "production";
    const passwordMatches = await existingAdmin.comparePassword(env.seedAdminPassword);
    let shouldSave = false;

    if (existingAdmin.name !== (env.seedAdminName || "System Administrator")) {
      existingAdmin.name = env.seedAdminName || "System Administrator";
      shouldSave = true;
    }

    if (existingAdmin.role !== ROLES.ADMIN) {
      existingAdmin.role = ROLES.ADMIN;
      shouldSave = true;
    }

    if (isDevelopment && !passwordMatches) {
      existingAdmin.password = env.seedAdminPassword;
      existingAdmin.refreshToken = null;
      shouldSave = true;
    }

    if (shouldSave) {
      await existingAdmin.save();
      console.log(`Synchronized default admin account for ${adminEmail}`);
    }

    return;
  }

  await User.create({
    name: env.seedAdminName || "System Administrator",
    email: adminEmail,
    password: env.seedAdminPassword,
    role: ROLES.ADMIN,
  });

  console.log(`Seeded default admin account for ${adminEmail}`);
};

const ensureDemoAccounts = async () => {
  if (env.nodeEnv === "production") {
    return;
  }

  for (const demoUser of demoUsers) {
    const normalizedEmail = demoUser.email.toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (!existingUser) {
      await User.create({
        ...demoUser,
        email: normalizedEmail,
      });
      console.log(`Seeded demo ${demoUser.role} account for ${normalizedEmail}`);
      continue;
    }

    const passwordMatches = await existingUser.comparePassword(demoUser.password);
    let shouldSave = false;

    if (existingUser.name !== demoUser.name) {
      existingUser.name = demoUser.name;
      shouldSave = true;
    }

    if (existingUser.role !== demoUser.role) {
      existingUser.role = demoUser.role;
      shouldSave = true;
    }

    if (!passwordMatches) {
      existingUser.password = demoUser.password;
      existingUser.refreshToken = null;
      shouldSave = true;
    }

    if (shouldSave) {
      await existingUser.save();
      console.log(`Synchronized demo ${demoUser.role} account for ${normalizedEmail}`);
    }
  }
};

const startServer = async () => {
  try {
    await connectDB(env.mongoUri);
    await ensureAdminAccount();
    await ensureDemoAccounts();
    app.listen(env.port, () => {
      console.log(`Server running on port ${env.port}`);
    });
  } catch (error) {
    console.error("MongoDB connection failed. Server not started.");
    console.error(error.message);
    process.exit(1);
  }
};

startServer();
