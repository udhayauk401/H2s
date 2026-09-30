const router = require("express").Router();
const { Settings, CalibrationModel } = require("../models/Misc");
const { requireAuth, requireRole } = require("../middleware/auth");

router.get("/", requireAuth, async (req, res) => {
  const settings = await Settings.findOne({ singleton: "GLOBAL" });
  res.json(settings);
});

router.patch("/", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const settings = await Settings.findOneAndUpdate({ singleton: "GLOBAL" }, req.body, { new: true, upsert: true });
  res.json(settings);
});

router.get("/calibration-models", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const models = await CalibrationModel.find().sort({ createdAt: -1 });
  res.json(models);
});

// Registering a new calibration model lets the color-response formula be
// revised later without redeploying code; only one model is "active" at a time.
router.post("/calibration-models", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const model = await CalibrationModel.create(req.body);
  if (req.body.active) {
    await CalibrationModel.updateMany({ _id: { $ne: model._id } }, { active: false });
    await Settings.findOneAndUpdate({ singleton: "GLOBAL" }, { activeCalibrationVersion: model.version });
  }
  res.status(201).json(model);
});

module.exports = router;
