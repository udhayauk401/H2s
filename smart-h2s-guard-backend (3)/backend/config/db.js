const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/smart_h2s_guard";
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
  console.log(`[SMART-H2S GUARD] MongoDB connected -> ${uri}`);
}

module.exports = connectDB;
