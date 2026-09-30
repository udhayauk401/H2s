const router = require("express").Router();
const Alert = require("../models/Alert");
const { requireAuth, requireRole } = require("../middleware/auth");

router.get("/", requireAuth, async (req, res) => {
  const { status } = req.query;
  const filter = {};
  if (req.user.role === "WORKER") filter.workerId = req.user.workerId;
  if (status) filter.status = status;
  const alerts = await Alert.find(filter).populate("worker").sort({ time: -1 }).limit(500);
  res.json(alerts);
});

router.patch("/:alertId/resolve", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const alert = await Alert.findByIdAndUpdate(
    req.params.alertId,
    { status: "RESOLVED", resolvedBy: req.user.userId, resolvedAt: new Date() },
    { new: true }
  );
  res.json(alert);
});

module.exports = router;
