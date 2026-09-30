const mongoose = require("mongoose");

const DepartmentSchema = new mongoose.Schema(
  { name: { type: String, unique: true, required: true }, site: { type: String } },
  { timestamps: true }
);

const CalibrationModelSchema = new mongoose.Schema(
  {
    version: { type: String, unique: true, required: true }, // e.g. CAL-v1.3
    description: { type: String },
    factor: { type: Number, required: true }, // ppm per colour-index unit
    offset: { type: Number, required: true },
    active: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const SettingsSchema = new mongoose.Schema(
  {
    singleton: { type: String, default: "GLOBAL", unique: true },
    org: {
      name: String,
      shortName: String,
      site: String,
      tagline: String,
    },
    thresholds: {
      current: { moderate: Number, warning: Number, highRisk: Number }, // ppm
      cumulative: { moderate: Number, warning: Number, highRisk: Number }, // ppm-hours
    },
    activeCalibrationVersion: { type: String },
    notifications: {
      emailAlerts: { type: Boolean, default: true },
      smsAlerts: { type: Boolean, default: false },
      highRiskOnly: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

module.exports = {
  Department: mongoose.model("Department", DepartmentSchema),
  CalibrationModel: mongoose.model("CalibrationModel", CalibrationModelSchema),
  Settings: mongoose.model("Settings", SettingsSchema),
};
