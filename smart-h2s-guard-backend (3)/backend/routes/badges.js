const router = require("express").Router();
const Badge = require("../models/Badge");
const Worker = require("../models/Worker");
const { requireAuth, requireRole } = require("../middleware/auth");

router.get("/", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const badges = await Badge.find().populate("worker").sort({ createdAt: -1 });
  res.json(badges);
});

// GET /api/badges/lookup/:code  -> resolves by badgeId OR barcode (used by the barcode-scan step)
router.get("/lookup/:code", requireAuth, async (req, res) => {
  const { code } = req.params;
  const badge = await Badge.findOne({ $or: [{ badgeId: code }, { barcode: code }] }).populate("worker");
  if (!badge) return res.status(404).json({ message: "Badge/barcode not recognised." });
  res.json(badge);
});

router.post("/", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const badge = await Badge.create(req.body);
  if (req.body.worker) await Worker.findByIdAndUpdate(req.body.worker, { badge: badge._id });
  res.status(201).json(badge);
});

router.patch("/:badgeId", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const badge = await Badge.findOneAndUpdate({ badgeId: req.params.badgeId }, req.body, { new: true });
  res.json(badge);
});

// POST /api/badges/:badgeId/replace -> retires old badge, issues + assigns a new one
router.post("/:badgeId/replace", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const old = await Badge.findOne({ badgeId: req.params.badgeId });
  if (!old) return res.status(404).json({ message: "Badge not found." });
  old.status = "EXPIRED";
  await old.save();
  const fresh = await Badge.create({
    badgeId: req.body.newBadgeId,
    barcode: req.body.newBarcode,
    worker: old.worker,
    issueDate: new Date(),
    expiryDate: req.body.expiryDate,
    status: "VALID",
  });
  if (old.worker) await Worker.findByIdAndUpdate(old.worker, { badge: fresh._id });
  res.status(201).json(fresh);
});

module.exports = router;
