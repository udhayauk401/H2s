const router = require("express").Router();
const Scan = require("../models/Scan");
const Badge = require("../models/Badge");
const Worker = require("../models/Worker");
const ExposureRecord = require("../models/ExposureRecord");
const Alert = require("../models/Alert");
const { Settings, CalibrationModel } = require("../models/Misc");
const { requireAuth, requireRole } = require("../middleware/auth");

const rank = { SAFE: 0, MODERATE: 1, WARNING: 2, "HIGH RISK": 3 };

function computeStatus(currentPpm, cumulativePpmH, thresholds) {
  const pick = (v, t) => (v >= t.highRisk ? "HIGH RISK" : v >= t.warning ? "WARNING" : v >= t.moderate ? "MODERATE" : "SAFE");
  const s1 = pick(currentPpm, thresholds.current);
  const s2 = pick(cumulativePpmH, thresholds.cumulative);
  return rank[s1] >= rank[s2] ? s1 : s2;
}

/**
 * POST /api/scans
 * Body: { barcode | badgeId, rgb: {r,g,b}, temperature?, humidity?, readerDeviceId? }
 *
 * This is the single endpoint the reusable reader (or this app's Scan &
 * Analysis page) calls once both the barcode and the RGB capture have
 * happened on-device. It:
 *   1. resolves the badge -> worker
 *   2. derives a colour index and an ESTIMATED ppm value from the active
 *      calibration model (never a hard-coded color==ppm assumption)
 *   3. computes exposure duration from the time since the worker's last scan
 *   4. accumulates cumulative dose (ppm-hours)
 *   5. determines safety status from configurable thresholds
 *   6. persists Scan + ExposureRecord, and raises an Alert if warranted
 */
router.post("/", requireAuth, async (req, res) => {
  try {
    const { barcode, badgeId, rgb, temperature = null, humidity = null, readerDeviceId = null } = req.body;
    if (!rgb || rgb.r == null || rgb.g == null || rgb.b == null) {
      return res.status(400).json({ message: "RGB colour data is required." });
    }

    const badge = await Badge.findOne({ $or: [{ barcode: barcode || null }, { badgeId: badgeId || null }] }).populate("worker");
    if (!badge) return res.status(404).json({ message: "Badge/barcode not recognised." });
    if (!badge.worker) return res.status(400).json({ message: "Badge is not assigned to a worker." });
    if (badge.status === "EXPIRED") return res.status(400).json({ message: "This badge has expired and cannot be used for a scan." });

    if (req.user.role === "WORKER" && req.user.workerId !== badge.worker.workerId) {
      return res.status(403).json({ message: "You may only scan your own badge." });
    }

    const settings = await Settings.findOne({ singleton: "GLOBAL" });
    const activeCal = await CalibrationModel.findOne({ active: true });
    const cal = activeCal || { version: "CAL-v1.0", factor: 0.06, offset: 0.2 }; // fallback if no CalibrationModel is registered yet

    const colorIndex = Math.round((255 - (rgb.r + rgb.g + rgb.b) / 3) * 100) / 100;
    const estimatedH2Sppm = Math.max(0, Math.round((colorIndex * cal.factor - cal.offset) * 100) / 100);

    const lastScan = await Scan.findOne({ worker: badge.worker._id }).sort({ scanTimestamp: -1 });
    const exposureDurationRaw = lastScan ? (Date.now() - new Date(lastScan.scanTimestamp).getTime()) / 3.6e6 : 1;
    const exposureDuration = Math.min(12, Math.max(0.25, Math.round(exposureDurationRaw * 100) / 100));
    const priorCumulative = lastScan ? lastScan.cumulativeDosePpmHours : 0;
    const cumulativeDosePpmHours = Math.round((priorCumulative + estimatedH2Sppm * exposureDuration * 0.3) * 100) / 100;

    const safetyStatus = computeStatus(estimatedH2Sppm, cumulativeDosePpmHours, settings.thresholds);
    const safetyIndex = Math.max(0, Math.round((100 - rank[safetyStatus] * 22 - estimatedH2Sppm) * 100) / 100);

    const scan = await Scan.create({
      badge: badge._id, worker: badge.worker._id, badgeId: badge.badgeId, barcode: badge.barcode, workerId: badge.worker.workerId,
      scanTimestamp: new Date(), rgb, colorIndex, temperature, humidity,
      estimatedH2Sppm, exposureDuration, cumulativeDosePpmHours, safetyIndex, safetyStatus,
      calibrationModelVersion: cal.version, readerDeviceId, recordedBy: req.user.userId,
    });

    badge.scanCount += 1;
    badge.lastScan = scan.scanTimestamp;
    await badge.save();

    const exposureRecord = await ExposureRecord.create({
      worker: badge.worker._id, workerId: badge.worker.workerId, scan: scan._id,
      date: scan.scanTimestamp, shift: badge.worker.shift, currentH2Sppm: estimatedH2Sppm,
      exposureDuration, cumulativeDosePpmHours, safetyIndex, safetyStatus, calibrationModelVersion: cal.version,
    });

    let alert = null;
    if (safetyStatus === "WARNING" || safetyStatus === "HIGH RISK") {
      alert = await Alert.create({
        worker: badge.worker._id, workerId: badge.worker.workerId, exposureRecord: exposureRecord._id, scan: scan._id,
        time: scan.scanTimestamp, currentH2S: estimatedH2Sppm, cumulativeExposure: cumulativeDosePpmHours,
        alertType: safetyStatus === "HIGH RISK" ? "HIGH H2S EXPOSURE" : "ELEVATED H2S EXPOSURE",
        safetyStatus,
        recommendation: safetyStatus === "HIGH RISK"
          ? "Evacuate area immediately, report to shift supervisor, and undergo medical check before re-entry."
          : "Reduce time in the affected zone, verify local ventilation, and re-scan within the hour.",
      });
    }

    res.status(201).json({ scan, exposureRecord, alert });
  } catch (err) {
    res.status(500).json({ message: "Scan processing failed.", error: err.message });
  }
});

// GET /api/scans?workerId=&from=&to=&status=
router.get("/", requireAuth, async (req, res) => {
  const { workerId, from, to, status } = req.query;
  const filter = {};
  if (req.user.role === "WORKER") filter.workerId = req.user.workerId;
  else if (workerId) filter.workerId = workerId;
  if (status) filter.safetyStatus = status;
  if (from || to) filter.scanTimestamp = {};
  if (from) filter.scanTimestamp.$gte = new Date(from);
  if (to) filter.scanTimestamp.$lte = new Date(to);
  const scans = await Scan.find(filter).sort({ scanTimestamp: -1 }).limit(500);
  res.json(scans);
});

module.exports = router;
