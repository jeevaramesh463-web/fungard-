import { db } from "../db.js";

export function createAlert(io, { userId, transactionId, status, score, reasons }) {
  const row = db.prepare(
    "INSERT INTO alerts (user_id, transaction_id, title, message, severity) VALUES (?, ?, ?, ?, ?)"
  ).run(
    userId,
    transactionId,
    `${status} transaction detected`,
    `Risk score ${score}: ${reasons.join("; ") || "A transaction requires review."}`,
    status === "Blocked" ? "high" : "medium"
  );
  const alert = db.prepare("SELECT * FROM alerts WHERE id = ?").get(row.lastInsertRowid);
  const message = `FundGuard ${status.toLowerCase()} transaction alert: risk ${score}.`;
  db.prepare("INSERT INTO notification_logs (user_id, channel, message) VALUES (?, 'email', ?)").run(userId, message);
  db.prepare("INSERT INTO notification_logs (user_id, channel, message) VALUES (?, 'sms', ?)").run(userId, message);
  console.log(`[simulated email/SMS] user=${userId}: ${message}`);
  io.to(`user:${userId}`).to("admins").emit("alert:new", alert);
  return alert;
}
