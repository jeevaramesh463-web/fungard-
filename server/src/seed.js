import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "./db.js";

const demoPassword = await bcrypt.hash("FundGuard123!", 10);
const reset = db.transaction(() => {
  db.exec("DELETE FROM notification_logs; DELETE FROM alerts; DELETE FROM transactions; DELETE FROM accounts; DELETE FROM blocked_accounts; DELETE FROM users;");
  const userInsert = db.prepare("INSERT INTO users (name, email, password_hash, role, balance) VALUES (?, ?, ?, ?, ?)");
  const adminId = Number(userInsert.run("FundGuard Administrator", "admin@fundguard.local", demoPassword, "admin", 0).lastInsertRowid);
  const demoUsers = [
    { name: "Jamie Anand Paul J", email: "jamie@fundguard.local", balance: 24580.5 },
    { name: "Jayadharshan B", email: "jayadharshan@fundguard.local", balance: 18740 }
  ];
  const userIds = demoUsers.map((user) =>
    Number(userInsert.run(user.name, user.email, demoPassword, "user", user.balance).lastInsertRowid)
  );
  const accountInsert = db.prepare("INSERT INTO accounts (id, user_id, label, balance) VALUES (?, ?, ?, ?)");
  userIds.forEach((userId, index) => accountInsert.run(`FG-${String(userId).padStart(6, "0")}`, userId, "Primary account", demoUsers[index].balance));
  db.prepare("INSERT INTO blocked_accounts (account, reason) VALUES (?, ?)").run("BLACKLISTED MERCHANT", "Known suspicious recipient");

  const categories = ["Groceries", "Dining", "Transport", "Shopping", "Utilities", "Education", "Healthcare", "Entertainment"];
  const locations = ["Tiruchirappalli", "Chennai", "Coimbatore", "Madurai"];
  const devices = ["Chrome · Windows", "Safari · iPhone", "Android app"];
  const insertTxn = db.prepare(`
    INSERT INTO transactions (user_id, account_id, type, amount, receiver, category, location, device, status, risk_score, risk_reasons, review_status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const records = [];
  for (let i = 0; i < 120; i += 1) {
    const userIndex = i % userIds.length;
    const userId = userIds[userIndex];
    const type = i % 5 === 0 ? "credit" : i % 3 === 0 ? "transfer" : "debit";
    let amount = Math.round((180 + ((i * 197) % 3200)) * 100) / 100;
    const date = new Date(Date.now() - (i % 28) * 86400000 - (i % 24) * 3600000);
    let status = "Safe";
    let score = 0;
    let reasons = [];
    let receiver = `Merchant ${String.fromCharCode(65 + (i % 20))}`;
    let location = locations[i % locations.length];
    let device = devices[i % devices.length];
    if (i === 17 || i === 68) {
      status = "Suspicious"; score = 42; amount = 7900 + i;
      reasons = ["Amount exceeds the 5,000 high-value limit", "New device for this account"];
      location = "Singapore";
    }
    if (i === 42) {
      status = "Blocked"; score = 75; receiver = "BLACKLISTED MERCHANT";
      reasons = ["Recipient is blocked: Known suspicious recipient", "Amount exceeds the 5,000 high-value limit"];
      amount = 8600;
    }
    const when = i === 92 ? new Date(new Date().setHours(2, 15, 0, 0)) : date;
    if (i === 92) {
      status = "Suspicious"; score = 35; reasons = ["Transaction occurred between 12 AM and 5 AM"];
    }
    records.push({ userId, accountId: `FG-${String(userId).padStart(6, "0")}`, type, amount, receiver,
      category: categories[i % categories.length], location, device, status, score, reasons, when });
  }
  const alertInsert = db.prepare("INSERT INTO alerts (user_id, transaction_id, title, message, severity, created_at) VALUES (?, ?, ?, ?, ?, ?)");
  for (const record of records) {
    const transaction = insertTxn.run(record.userId, record.accountId, record.type, record.amount, record.receiver, record.category,
      record.location, record.device, record.status, record.score, JSON.stringify(record.reasons),
      record.status === "Safe" ? "pending" : "pending", record.when.toISOString());
    if (record.status !== "Safe") {
      alertInsert.run(record.userId, transaction.lastInsertRowid, `${record.status} transaction detected`,
        `Risk score ${record.score}: ${record.reasons.join("; ")}`, record.status === "Blocked" ? "high" : "medium", record.when.toISOString());
    }
  }
  return { adminId, userIds, count: records.length };
});

const result = reset();
console.log(`Seeded ${result.count} transactions. Admin: admin@fundguard.local; users: jamie@fundguard.local, jayadharshan@fundguard.local; password: FundGuard123!`);
db.close();
