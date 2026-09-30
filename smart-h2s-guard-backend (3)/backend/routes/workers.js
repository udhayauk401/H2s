const router = require("express").Router();
const Worker = require("../models/Worker");
const Badge = require("../models/Badge");
const { requireAuth, requireRole } = require("../middleware/auth");

// GET /api/workers  (admin: all; worker: only self via /api/workers/me)
router.get("/", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const { search, department, shift, badgeStatus, safetyStatus } = req.query;
  const filter = {};
  if (department) filter.department = department;
  if (shift) filter.shift = shift;
  if (search) filter.$or = [{ workerId: new RegExp(search, "i") }, { name: new RegExp(search, "i") }];
  let workers = await Worker.find(filter).populate("badge").lean();
  if (badgeStatus) workers = workers.filter((w) => w.badge && w.badge.status === badgeStatus);
  // safetyStatus filtering happens against the worker's latest scan; left to a
  // dedicated aggregation/report endpoint in a full implementation.
  res.json(workers);
});

router.get("/me", requireAuth, requireRole("WORKER"), async (req, res) => {
  const worker = await Worker.findOne({ workerId: req.user.workerId }).populate("badge");
  res.json(worker);
});

router.get("/:workerId", requireAuth, async (req, res) => {
  if (req.user.role === "WORKER" && req.user.workerId !== req.params.workerId) {
    return res.status(403).json({ message: "You may only view your own record." });
  }
  const worker = await Worker.findOne({ workerId: req.params.workerId }).populate("badge");
  if (!worker) return res.status(404).json({ message: "Worker not found." });
  res.json(worker);
});

// POST /api/workers  (admin only) - Worker ID must be unique
router.post("/", requireAuth, requireRole("ADMIN"), async (req, res) => {
  try {
    const exists = await Worker.findOne({ workerId: req.body.workerId });
    if (exists) return res.status(409).json({ message: "Worker ID already exists." });
    const worker = await Worker.create(req.body);
    res.status(201).json(worker);
  } catch (err) {
    res.status(400).json({ message: "Could not create worker.", error: err.message });
  }
});

// PATCH /api/workers/:workerId
// Admin can edit any field except workerId. Workers may edit only limited
// self-service fields (address/contact/email/gender/photoUrl).
router.patch("/:workerId", requireAuth, async (req, res) => {
  const { workerId } = req.params;
  if (req.user.role === "WORKER") {
    if (req.user.workerId !== workerId) return res.status(403).json({ message: "You may only edit your own profile." });
    const allowed = ["address", "contact", "email", "gender", "photoUrl"];
    const patch = {};
    allowed.forEach((k) => { if (k in req.body) patch[k] = req.body[k]; });
    const worker = await Worker.findOneAndUpdate({ workerId }, patch, { new: true });
    return res.json(worker);
  }
  const patch = { ...req.body };
  delete patch.workerId; // immutable
  const worker = await Worker.findOneAndUpdate({ workerId }, patch, { new: true });
  res.json(worker);
});

module.exports = router;
