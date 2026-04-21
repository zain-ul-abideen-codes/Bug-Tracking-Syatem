const mongoose = require("mongoose");

const connectDB = async (mongoUri) => {
  await mongoose.connect(mongoUri);
  return mongoose.connection;
};

module.exports = connectDB;
