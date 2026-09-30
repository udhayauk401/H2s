const router = require("express").Router();
const Device = require("../models/Device");
const { requireAuth, requireRole } = require("../middleware/auth");

router.get("/", requireAuth, requireRole("ADMIN"), async (req, res) => {
  res.json(await Device.find().sort({ createdAt: -1 }));
});

router.post("/", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const device = await Device.create(req.body);
  res.status(201).json(device);
});

router.patch("/:deviceId", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const device = await Device.findOneAndUpdate({ deviceId: req.params.deviceId }, req.body, { new: true });
  res.json(device);
});

module.exports = router;
