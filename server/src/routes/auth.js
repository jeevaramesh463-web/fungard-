import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, publicUser } from "../db.js";
import { authenticate, signToken } from "../middleware/auth.js";

const router = Router();

router.post("/register", async (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  if (name.length < 2 || name.length > 80) return res.status(400).json({ error: "Name must be 2–80 characters." });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "Enter a valid email address." });
  if (password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters." });
  if (db.prepare("SELECT id FROM users WHERE email = ?").get(email)) return res.status(409).json({ error: "An account with this email already exists." });

  const passwordHash = await bcrypt.hash(password, 12);
  const result = db.prepare("INSERT INTO users (name, email, password_hash, balance) VALUES (?, ?, ?, 10000)")
    .run(name, email, passwordHash);
  const accountId = `FG-${String(result.lastInsertRowid).padStart(6, "0")}`;
  db.prepare("INSERT INTO accounts (id, user_id, label, balance) VALUES (?, ?, 'Primary account', 10000)")
    .run(accountId, result.lastInsertRowid);
  const user = publicUser(db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid));
  res.status(201).json({ token: signToken(user), user });
});

router.post("/login", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const row = db.prepare("SELECT * FROM users WHERE email = ? AND is_active = 1").get(email);
  if (!row || !(await bcrypt.compare(password, row.password_hash))) {
    return res.status(401).json({ error: "Email or password is incorrect." });
  }
  const user = publicUser(row);
  res.json({ token: signToken(user), user });
});

router.get("/me", authenticate, (req, res) => res.json({ user: req.user }));

export default router;
