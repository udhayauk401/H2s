const mongoose = require("mongoose");

/**
 * ExposureRecord is the reportable ledger entry for a worker's exposure,
 * generated 1:1 alongside each Scan. Kept as a separate collection so that
 * exposure history, reports, and cumulative-dose analytics can be queried
 * without touching raw sensor capture data, and so the calibration model
 * used for a given scan can be revised/audited independently later.
 */
const ExposureRecordSchema = new mongoose.Schema(
  {
    worker: { type: mongoose.Schema.Types.ObjectId, ref: "Worker", required: true },
    workerId: { type: String, required: true },
    scan: { type: mongoose.Schema.Types.ObjectId, ref: "Scan", required: true },

    date: { type: Date, required: true },
    shift: { type: String },
    currentH2Sppm: { type: Number, required: true },
    exposureDuration: { type: Number, required: true },
    cumulativeDosePpmHours: { type: Number, required: true },
    safetyIndex: { type: Number, required: true },
    safetyStatus: { type: String, enum: ["SAFE", "MODERATE", "WARNING", "HIGH RISK"], required: true },
    calibrationModelVersion: { type: String, required: true },
  },
  { timestamps: true }
);

ExposureRecordSchema.index({ worker: 1, date: -1 });

module.exports = mongoose.model("ExposureRecord", ExposureRecordSchema);
