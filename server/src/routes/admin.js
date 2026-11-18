import { Router } from "express";
import { db } from "../db.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";

const router = Router();
router.use(authenticate, requireAdmin);

router.get("/overview", (req, res) => {
  const summary = db.prepare(`
    SELECT COUNT(*) AS total_transactions,
      SUM(CASE WHEN status != 'Safe' THEN 1 ELSE 0 END) AS flagged,
      SUM(CASE WHEN status = 'Blocked' THEN 1 ELSE 0 END) AS blocked
    FROM transactions
  `).get();
  summary.alerts_today = db.prepare("SELECT COUNT(*) AS count FROM alerts WHERE substr(created_at, 1, 10) = date('now')").get().count;
  const users = db.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'user'").get().count;
  const alerts = db.prepare("SELECT a.*, u.name AS user_name FROM alerts a JOIN users u ON u.id = a.user_id ORDER BY a.created_at DESC LIMIT 8").all();
  const chart = db.prepare("SELECT status, COUNT(*) AS count FROM transactions GROUP BY status").all();
  const daily = db.prepare(`
    SELECT substr(created_at, 1, 10) AS date,
      SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END) AS credits,
      SUM(CASE WHEN type != 'credit' THEN amount ELSE 0 END) AS debits
    FROM transactions
    GROUP BY substr(created_at, 1, 10)
    ORDER BY date DESC
    LIMIT 7
  `).all().reverse();
  res.json({ ...summary, users, alerts, chart, daily });
});

router.get("/users", (req, res) => {
  const users = db.prepare(`
    SELECT u.id, u.name, u.email, u.role, u.balance, u.is_active, u.created_at,
      COUNT(t.id) AS transaction_count
    FROM users u LEFT JOIN transactions t ON t.user_id = u.id
    GROUP BY u.id ORDER BY u.created_at DESC
  `).all();
  res.json({ users: users.map((user) => ({ ...user, is_active: Boolean(user.is_active) })) });
});

router.patch("/users/:id/status", (req, res) => {
  const active = req.body.active;
  if (typeof active !== "boolean") return res.status(400).json({ error: "active must be true or false." });
  if (Number(req.params.id) === req.user.id) return res.status(400).json({ error: "You cannot deactivate your own account." });
  const result = db.prepare("UPDATE users SET is_active = ? WHERE id = ? AND role = 'user'").run(active ? 1 : 0, req.params.id);
  if (!result.changes) return res.status(404).json({ error: "User not found." });
  res.json({ message: `User ${active ? "activated" : "deactivated"}.` });
});

router.get("/rules", (req, res) => {
  res.json({ rules: db.prepare("SELECT * FROM rules ORDER BY key").all().map((rule) => ({ ...rule, enabled: Boolean(rule.enabled) })) });
});

router.put("/rules", (req, res) => {
  if (!Array.isArray(req.body.rules)) return res.status(400).json({ error: "rules must be an array." });
  const update = db.prepare("UPDATE rules SET threshold = ?, points = ?, enabled = ? WHERE key = ?");
  const valid = db.transaction((rules) => {
    for (const rule of rules) {
      if (typeof rule.key !== "string" || !Number.isFinite(Number(rule.threshold)) || Number(rule.threshold) <= 0 ||
        !Number.isInteger(Number(rule.points)) || Number(rule.points) < 0 || Number(rule.points) > 100 ||
        typeof rule.enabled !== "boolean") throw new Error("Each rule needs a positive threshold, 0–100 points, and enabled boolean.");
      const result = update.run(Number(rule.threshold), Number(rule.points), rule.enabled ? 1 : 0, rule.key);
      if (!result.changes) throw new Error(`Unknown rule: ${rule.key}`);
    }
  });
  try {
    valid(req.body.rules);
    res.json({ rules: db.prepare("SELECT * FROM rules ORDER BY key").all().map((rule) => ({ ...rule, enabled: Boolean(rule.enabled) })) });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
