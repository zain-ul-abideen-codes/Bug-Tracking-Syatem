const env = require("./config/env");
const app = require("./app");
const connectDB = require("./config/db");

const startServer = async () => {
  try {
    await connectDB(env.mongoUri);
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
