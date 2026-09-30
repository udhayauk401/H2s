const mongoose = require("mongoose");

const WorkerSchema = new mongoose.Schema(
  {
    workerId: { type: String, unique: true, required: true, index: true }, // e.g. ST1024, immutable business key
    name: { type: String, required: true },
    department: { type: String, required: true },
    designation: { type: String },
    shift: { type: String },
    gender: { type: String, enum: ["Male", "Female", "Other"] },
    contact: { type: String },
    email: { type: String },
    address: { type: String },
    joiningDate: { type: Date },
    photoUrl: { type: String },
    badge: { type: mongoose.Schema.Types.ObjectId, ref: "Badge", default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Worker", WorkerSchema);
