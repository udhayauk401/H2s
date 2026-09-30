const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { requireAuth } = require("../middleware/auth");

// POST /api/auth/login  { email, password }
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || "").toLowerCase().trim() }).populate("worker");
    if (!user || user.status !== "ACTIVE") return res.status(401).json({ message: "Invalid credentials." });

    const ok = await bcrypt.compare(password || "", user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials." });

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { userId: user.userId, role: user.role, workerId: user.worker ? user.worker.workerId : null },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
    );

    res.json({
      token,
      user: { userId: user.userId, name: user.name, email: user.email, role: user.role, workerId: user.worker ? user.worker.workerId : null },
    });
  } catch (err) {
    res.status(500).json({ message: "Login failed.", error: err.message });
  }
});

// GET /api/auth/me
router.get("/me", requireAuth, async (req, res) => {
  const user = await User.findOne({ userId: req.user.userId }).select("-passwordHash").populate("worker");
  res.json(user);
});

module.exports = router;
