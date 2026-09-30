require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const authRoutes = require("./routes/auth");
const workerRoutes = require("./routes/workers");
const badgeRoutes = require("./routes/badges");
const scanRoutes = require("./routes/scans");
const exposureRecordRoutes = require("./routes/exposureRecords");
const alertRoutes = require("./routes/alerts");
const userRoutes = require("./routes/users");
const settingsRoutes = require("./routes/settings");
const deviceRoutes = require("./routes/devices");

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json({ limit: "5mb" }));

app.get("/api/health", (req, res) => res.json({ status: "ok", service: "SMART-H2S GUARD API", time: new Date().toISOString() }));

app.use("/api/auth", authRoutes);
app.use("/api/workers", workerRoutes);
app.use("/api/badges", badgeRoutes);
app.use("/api/scans", scanRoutes);
app.use("/api/exposure-records", exposureRecordRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/users", userRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/devices", deviceRoutes);

app.use((req, res) => res.status(404).json({ message: "Route not found." }));
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error." });
});

const PORT = process.env.PORT || 5000;
connectDB()
  .then(() => app.listen(PORT, () => console.log(`[SMART-H2S GUARD] API listening on port ${PORT}`)))
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  });
