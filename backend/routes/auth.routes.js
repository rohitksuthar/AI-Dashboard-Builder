const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const User = require("../models/User");
const requireAuth = require("../middleware/auth");

const router = express.Router();

// Slow down brute-force login/register attempts against a single IP.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: "Too many attempts. Please try again in a few minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * POST /api/auth/register
 * body: { fullName, email, password }
 */
router.post("/register", authLimiter, async (req, res) => {
  try {
    const { fullName, email, password } = req.body || {};

    if (!fullName || fullName.trim().length < 2) {
      return res.status(400).json({ error: "Please enter your full name." });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Please enter a valid email address." });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: "An account with that email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name: fullName.trim(), email: email.toLowerCase(), passwordHash });

    const token = signToken(user._id.toString());
    res.status(201).json({ user: { name: user.name, email: user.email }, token });
  } catch (err) {
    console.error("Register error:", err.message);
    res.status(500).json({ error: "Something went wrong creating your account. Please try again." });
  }
});

/**
 * POST /api/auth/login
 * body: { email, password }
 */
router.post("/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!isValidEmail(email) || !password) {
      return res.status(400).json({ error: "Please enter a valid email and password." });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    // Same error for "no such user" and "wrong password" — don't leak which one it was.
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = signToken(user._id.toString());
    res.json({ user: { name: user.name, email: user.email }, token });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ error: "Something went wrong logging you in. Please try again." });
  }
});

/**
 * GET /api/auth/me
 * header: Authorization: Bearer <token>
 * Lets the frontend verify a stored token is still valid on page load,
 * and re-fetch the current user's name/email without re-sending a password.
 */
router.get("/me", requireAuth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ error: "User not found." });
  res.json({ user: { name: user.name, email: user.email } });
});

module.exports = router;
