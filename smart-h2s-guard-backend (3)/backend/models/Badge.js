const mongoose = require("mongoose");

const BadgeSchema = new mongoose.Schema(
  {
    badgeId: { type: String, unique: true, required: true, index: true },
    barcode: { type: String, unique: true, required: true, index: true }, // barcode/QR payload printed on the passive strip
    worker: { type: mongoose.Schema.Types.ObjectId, ref: "Worker", default: null },
    issueDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true },
    status: { type: String, enum: ["VALID", "EXPIRING SOON", "EXPIRED"], default: "VALID" },
    scanCount: { type: Number, default: 0 },
    lastScan: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Badge", BadgeSchema);
