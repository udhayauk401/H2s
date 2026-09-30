const mongoose = require("mongoose");

const DeviceSchema = new mongoose.Schema(
  {
    deviceId: { type: String, unique: true, required: true },
    name: { type: String, required: true },
    type: { type: String, default: "Handheld RGB + Barcode Reader" },
    location: { type: String },
    status: { type: String, enum: ["ONLINE", "OFFLINE"], default: "OFFLINE" },
    lastSync: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Device", DeviceSchema);
