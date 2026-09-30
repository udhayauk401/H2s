const router = require("express").Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Worker = require("../models/Worker");
const { requireAuth, requireRole } = require("../middleware/auth");

router.get("/", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const users = await User.find().select("-passwordHash").sort({ createdAt: -1 });
  res.json(users);
});

router.post("/", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const { name, email, role, password, workerId } = req.body;
  const passwordHash = await bcrypt.hash(password || "changeme123", 10);
  const count = await User.countDocuments();
  let worker = null;
  if (role === "WORKER" && workerId) worker = (await Worker.findOne({ workerId }))?._id || null;
  const user = await User.create({ userId: `USR-${1000 + count + 1}`, name, email, role, passwordHash, worker });
  res.status(201).json(user);
});

router.patch("/:userId", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const patch = { ...req.body };
  delete patch.passwordHash;
  const user = await User.findOneAndUpdate({ userId: req.params.userId }, patch, { new: true }).select("-passwordHash");
  res.json(user);
});

module.exports = router;
