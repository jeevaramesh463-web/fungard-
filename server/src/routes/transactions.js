import { Router } from "express";
import { db } from "../db.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { assessTransaction } from "../services/detection.js";
import { createAlert } from "../services/alerts.js";

const router = Router();
router.use(authenticate);

router.get("/", (req, res) => {
  const admin = req.user.role === "admin";
  const where = [];
  const params = [];
  if (!admin) { where.push("t.user_id = ?"); params.push(req.user.id); }
  if (req.query.status && ["Safe", "Suspicious", "Blocked"].includes(req.query.status)) {
    where.push("t.status = ?"); params.push(req.query.status);
  }
  if (req.query.type && ["credit", "debit", "transfer"].includes(req.query.type)) {
    where.push("t.type = ?"); params.push(req.query.type);
  }
  if (req.query.search) {
    where.push("(t.receiver LIKE ? OR t.category LIKE ? OR u.name LIKE ?)");
    const search = `%${String(req.query.search).slice(0, 100)}%`;
    params.push(search, search, search);
  }
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const total = db.prepare(`SELECT COUNT(*) AS count FROM transactions t JOIN users u ON u.id = t.user_id ${clause}`).get(...params).count;
  const sortMap = { date: "t.created_at", amount: "t.amount", risk: "t.risk_score" };
  const order = sortMap[req.query.sort] || "t.created_at";
  const direction = req.query.direction === "asc" ? "ASC" : "DESC";
  const rows = db.prepare(
    `SELECT t.*, u.name AS user_name, u.email AS user_email FROM transactions t JOIN users u ON u.id = t.user_id ${clause} ORDER BY ${order} ${direction} LIMIT ? OFFSET ?`
  ).all(...params, limit, (page - 1) * limit);
  res.json({ transactions: rows.map((row) => ({ ...row, risk_reasons: JSON.parse(row.risk_reasons) })), total, page, pages: Math.ceil(total / limit) });
});

router.get("/summary", (req, res) => {
  const scoped = req.user.role === "admin" ? "" : "WHERE user_id = ?";
  const params = req.user.role === "admin" ? [] : [req.user.id];
  const totals = db.prepare(`SELECT COUNT(*) AS transactions, SUM(CASE WHEN status != 'Safe' THEN 1 ELSE 0 END) AS flagged, SUM(CASE WHEN status = 'Blocked' THEN 1 ELSE 0 END) AS blocked FROM transactions ${scoped}`).get(...params);
  const balance = req.user.role === "admin"
    ? db.prepare("SELECT COALESCE(SUM(balance), 0) AS balance FROM users WHERE role = 'user' AND is_active = 1").get().balance
    : db.prepare("SELECT balance FROM users WHERE id = ?").get(req.user.id).balance;
  const categories = db.prepare(
    `SELECT category, SUM(amount) AS total FROM transactions ${scoped ? "WHERE user_id = ? AND type != 'credit'" : "WHERE type != 'credit'"} GROUP BY category ORDER BY total DESC LIMIT 6`
  ).all(...params);
  const daily = db.prepare(
    `SELECT substr(created_at, 1, 10) AS date, SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END) AS credits, SUM(CASE WHEN type != 'credit' THEN amount ELSE 0 END) AS debits FROM transactions ${scoped} GROUP BY substr(created_at, 1, 10) ORDER BY date DESC LIMIT 7`
  ).all(...params).reverse();
  res.json({ ...totals, balance, categories, daily });
});

router.get("/export", (req, res) => {
  const rows = req.user.role === "admin"
    ? db.prepare("SELECT t.*, u.name AS user_name, u.email AS user_email FROM transactions t JOIN users u ON u.id = t.user_id ORDER BY t.created_at DESC").all()
    : db.prepare("SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC").all(req.user.id);
  const columns = ["id", "user_name", "type", "amount", "receiver", "category", "location", "device", "status", "risk_score", "created_at"];
  const quote = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const csv = [columns.join(","), ...rows.map((row) => columns.map((col) => quote(row[col])).join(","))].join("\r\n");
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="fundguard-transactions.csv"');
  res.send(csv);
});

router.post("/", (req, res) => {
  const { type, amount, receiver, category, location, device, accountId } = req.body;
  const parsedAmount = Number(amount);
  if (!["credit", "debit", "transfer"].includes(type)) return res.status(400).json({ error: "Choose a valid transaction type." });
  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0 || parsedAmount > 100000000) return res.status(400).json({ error: "Amount must be greater than 0 and no more than 100,000,000." });
  const fields = [receiver, category, location, device];
  if (fields.some((value) => typeof value !== "string" || !value.trim() || value.length > 120)) return res.status(400).json({ error: "Receiver, category, location, and device are required (max 120 characters)." });
  const input = {
    type, amount: parsedAmount, receiver: receiver.trim(), category: category.trim(),
    location: location.trim(), device: device.trim(), accountId: accountId || null,
    createdAt: req.body.createdAt
  };
  if (input.createdAt && Number.isNaN(Date.parse(input.createdAt))) return res.status(400).json({ error: "Transaction date is invalid." });
  const assessment = assessTransaction(input, req.user.id);
  const transaction = db.transaction(() => {
    const result = db.prepare(
      `INSERT INTO transactions (user_id, account_id, type, amount, receiver, category, location, device, status, risk_score, risk_reasons, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(req.user.id, input.accountId, type, parsedAmount, input.receiver, input.category, input.location, input.device,
      assessment.status, assessment.score, JSON.stringify(assessment.reasons), input.createdAt || new Date().toISOString());
    if (assessment.status !== "Blocked") {
      const delta = type === "credit" ? parsedAmount : -parsedAmount;
      db.prepare("UPDATE users SET balance = balance + ? WHERE id = ?").run(delta, req.user.id);
      if (input.accountId) db.prepare("UPDATE accounts SET balance = balance + ? WHERE id = ? AND user_id = ?").run(delta, input.accountId, req.user.id);
    }
    return db.prepare("SELECT * FROM transactions WHERE id = ?").get(result.lastInsertRowid);
  })();
  if (assessment.status !== "Safe") createAlert(req.app.get("io"), { userId: req.user.id, transactionId: transaction.id, ...assessment });
  res.status(201).json({ transaction: { ...transaction, risk_reasons: assessment.reasons } });
});

router.patch("/:id/review", requireAdmin, (req, res) => {
  const { action } = req.body;
  const map = { approve: ["Safe", "approved"], block: ["Blocked", "blocked"], false_positive: ["Safe", "false_positive"] };
  if (!map[action]) return res.status(400).json({ error: "Choose approve, block, or false_positive." });
  const row = db.prepare("SELECT * FROM transactions WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Transaction not found." });
  const [nextStatus, reviewStatus] = map[action];
  db.transaction(() => {
    const wasApplied = row.status !== "Blocked";
    const willApply = nextStatus !== "Blocked";
    if (wasApplied !== willApply) {
      const delta = row.type === "credit" ? row.amount : -row.amount;
      const appliedDelta = willApply ? delta : -delta;
      db.prepare("UPDATE users SET balance = balance + ? WHERE id = ?").run(appliedDelta, row.user_id);
      if (row.account_id) db.prepare("UPDATE accounts SET balance = balance + ? WHERE id = ? AND user_id = ?").run(appliedDelta, row.account_id, row.user_id);
    }
    db.prepare("UPDATE transactions SET status = ?, review_status = ? WHERE id = ?").run(nextStatus, reviewStatus, row.id);
  })();
  res.json({ message: "Transaction review updated." });
});

export default router;
