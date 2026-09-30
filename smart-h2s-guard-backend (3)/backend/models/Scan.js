const mongoose = require("mongoose");

/**
 * A Scan is the raw event captured by the reusable external reader:
 *  1) barcode read  -> identifies the Badge/Worker
 *  2) RGB read       -> colour response of the Bi(III) sensing paper
 *  3) optional env   -> temperature / humidity
 * The computed exposure numbers are denormalised onto the Scan for fast
 * dashboard reads, and are also mirrored into an ExposureRecord so that
 * exposure history can be queried/reported independently of raw scans.
 */
const ScanSchema = new mongoose.Schema(
  {
    badge: { type: mongoose.Schema.Types.ObjectId, ref: "Badge", required: true },
    worker: { type: mongoose.Schema.Types.ObjectId, ref: "Worker", required: true },
    badgeId: { type: String, required: true },
    barcode: { type: String, required: true },
    workerId: { type: String, required: true },

    scanTimestamp: { type: Date, required: true, default: Date.now },
    rgb: {
      r: { type: Number, required: true },
      g: { type: Number, required: true },
      b: { type: Number, required: true },
    },
    colorIndex: { type: Number, required: true }, // derived darkness/intensity index from RGB
    temperature: { type: Number, default: null }, // deg C, optional
    humidity: { type: Number, default: null }, // %RH, optional

    // computed exposure fields (also mirrored into ExposureRecord)
    estimatedH2Sppm: { type: Number, required: true }, // ESTIMATED - never a raw ppm reading
    exposureDuration: { type: Number, required: true }, // hours since previous scan for this worker
    cumulativeDosePpmHours: { type: Number, required: true },
    safetyIndex: { type: Number, required: true },
    safetyStatus: { type: String, enum: ["SAFE", "MODERATE", "WARNING", "HIGH RISK"], required: true },

    calibrationModelVersion: { type: String, required: true },
    readerDeviceId: { type: String, default: null }, // which reusable reader captured this
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, // admin operator, if applicable
  },
  { timestamps: true }
);

ScanSchema.index({ worker: 1, scanTimestamp: -1 });

module.exports = mongoose.model("Scan", ScanSchema);
