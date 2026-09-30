/**
 * One-off seed script: creates the org Settings, an initial calibration
 * model, an admin user, a handful of demo workers/badges/users.
 * Run with: npm run seed   (after setting MONGODB_URI in .env)
 */
require("dotenv").config();
const bcrypt = require("bcryptjs");
const connectDB = require("./config/db");
const User = require("./models/User");
const Worker = require("./models/Worker");
const Badge = require("./models/Badge");
const Device = require("./models/Device");
const { Settings, CalibrationModel, Department } = require("./models/Misc");

const DEPARTMENTS = ["Process Unit - CDU", "Process Unit - FCC", "Tank Farm", "Effluent Treatment", "Maintenance", "Utilities", "Lab & QC"];

async function run() {
  await connectDB();

  await Settings.findOneAndUpdate(
    { singleton: "GLOBAL" },
    {
      org: { name: "Mangalore Refinery and Petrochemicals Limited", shortName: "MRPL", site: "Kuthethoor, Mangalore, Karnataka", tagline: "Wear Safe | Work Safe | Know Your Exposure" },
      thresholds: { current: { moderate: 5, warning: 10, highRisk: 15 }, cumulative: { moderate: 20, warning: 50, highRisk: 100 } },
      activeCalibrationVersion: "CAL-v1.3",
      notifications: { emailAlerts: true, smsAlerts: false, highRiskOnly: false },
    },
    { upsert: true }
  );

  await CalibrationModel.deleteMany({});
  await CalibrationModel.create({ version: "CAL-v1.3", description: "Bi(III)-acetate darkening linear-response", factor: 0.062, offset: 0.2, active: true });

  await Department.deleteMany({});
  await Department.insertMany(DEPARTMENTS.map((name) => ({ name, site: "MRPL Kuthethoor" })));

  await Device.deleteMany({});
  await Device.insertMany([
    { deviceId: "RDR-001", name: "Reader Unit A1", location: "CDU Control Room", status: "ONLINE", lastSync: new Date() },
    { deviceId: "RDR-002", name: "Reader Unit A2", location: "Tank Farm Gatehouse", status: "ONLINE", lastSync: new Date() },
    { deviceId: "RDR-003", name: "Reader Unit B1", location: "Effluent Treatment Plant", status: "OFFLINE", lastSync: new Date() },
  ]);

  await User.deleteMany({});
  await Worker.deleteMany({});
  await Badge.deleteMany({});

  const adminHash = await bcrypt.hash("admin123", 10);
  await User.create({ userId: "USR-0001", name: "Rajesh Hegde", email: "admin@mrpl.co.in", passwordHash: adminHash, role: "ADMIN" });

  const demoWorkers = [
    { workerId: "ST1024", name: "Arun Kumar", department: "Process Unit - CDU", designation: "Field Operator", shift: "A - Morning (06:00-14:00)", email: "arun.kumar@mrpl.co.in" },
    { workerId: "ST1042", name: "Priya Shetty", department: "Tank Farm", designation: "Safety Technician", shift: "B - Afternoon (14:00-22:00)", email: "priya.shetty@mrpl.co.in" },
  ];

  let i = 0;
  for (const w of demoWorkers) {
    i += 1;
    const worker = await Worker.create({ ...w, joiningDate: new Date("2020-01-01") });
    const badge = await Badge.create({
      badgeId: `BDG-220${i}`, barcode: `MRPL-BDG-220${i}-880${i}`, worker: worker._id,
      issueDate: new Date(), expiryDate: new Date(Date.now() + 300 * 86400000), status: "VALID",
    });
    worker.badge = badge._id;
    await worker.save();
    const passHash = await bcrypt.hash("worker123", 10);
    await User.create({ userId: `USR-100${i + 1}`, name: w.name, email: w.email, passwordHash: passHash, role: "WORKER", worker: worker._id });
  }

  console.log("Seed complete. Admin login: admin@mrpl.co.in / admin123. Worker login: arun.kumar@mrpl.co.in / worker123");
  process.exit(0);
}

run().catch((err) => { console.error(err); process.exit(1); });
