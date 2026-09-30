const mongoose = require("mongoose");

const AlertSchema = new mongoose.Schema(
  {
    worker: { type: mongoose.Schema.Types.ObjectId, ref: "Worker", required: true },
    workerId: { type: String, required: true },
    exposureRecord: { type: mongoose.Schema.Types.ObjectId, ref: "ExposureRecord", required: true },
    scan: { type: mongoose.Schema.Types.ObjectId, ref: "Scan", required: true },

    time: { type: Date, required: true, default: Date.now },
    currentH2S: { type: Number, required: true },
    cumulativeExposure: { type: Number, required: true },
    alertType: { type: String, enum: ["ELEVATED H2S EXPOSURE", "HIGH H2S EXPOSURE"], required: true },
    safetyStatus: { type: String, enum: ["WARNING", "HIGH RISK"], required: true },
    status: { type: String, enum: ["ACTIVE", "RESOLVED"], default: "ACTIVE" },
    recommendation: { type: String },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

AlertSchema.index({ worker: 1, time: -1 });
AlertSchema.index({ status: 1 });

module.exports = mongoose.model("Alert", AlertSchema);
