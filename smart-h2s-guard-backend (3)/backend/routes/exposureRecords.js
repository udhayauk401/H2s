const router = require("express").Router();
const ExposureRecord = require("../models/ExposureRecord");
const { requireAuth } = require("../middleware/auth");

// GET /api/exposure-records?workerId=&department=&shift=&status=&from=&to=
router.get("/", requireAuth, async (req, res) => {
  const { workerId, shift, status, from, to } = req.query;
  const filter = {};
  if (req.user.role === "WORKER") filter.workerId = req.user.workerId;
  else if (workerId) filter.workerId = workerId;
  if (shift) filter.shift = shift;
  if (status) filter.safetyStatus = status;
  if (from || to) filter.date = {};
  if (from) filter.date.$gte = new Date(from);
  if (to) filter.date.$lte = new Date(to);
  const records = await ExposureRecord.find(filter).populate("worker").sort({ date: -1 }).limit(1000);
  res.json(records);
});

module.exports = router;
