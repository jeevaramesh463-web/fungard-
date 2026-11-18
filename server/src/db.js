import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const databasePath = process.env.DATABASE_PATH
  ? path.resolve(process.cwd(), process.env.DATABASE_PATH)
  : path.resolve(here, "../data/fundguard.sqlite");
fs.mkdirSync(path.dirname(databasePath), { recursive: true });

export const db = new Database(databasePath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user', 'admin')),
    balance REAL NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    balance REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active'
  );
  CREATE TABLE IF NOT EXISTS blocked_accounts (
    account TEXT PRIMARY KEY,
    reason TEXT NOT NULL DEFAULT 'Flagged by an administrator'
  );
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id TEXT,
    type TEXT NOT NULL CHECK(type IN ('credit', 'debit', 'transfer')),
    amount REAL NOT NULL CHECK(amount > 0),
    receiver TEXT NOT NULL,
    category TEXT NOT NULL,
    location TEXT NOT NULL,
    device TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Safe' CHECK(status IN ('Safe', 'Suspicious', 'Blocked')),
    risk_score INTEGER NOT NULL DEFAULT 0,
    risk_reasons TEXT NOT NULL DEFAULT '[]',
    review_status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transaction_id INTEGER REFERENCES transactions(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'medium',
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS notification_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    channel TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS rules (
    key TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    threshold REAL NOT NULL,
    points INTEGER NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1
  );
`);

const defaultRules = [
  ["high_value", "High-value transaction limit", 5000, 30],
  ["unusual_multiplier", "Unusual amount multiplier", 3, 25],
  ["velocity_count", "Transactions in 2 minutes", 5, 25],
  ["new_location", "New location", 1, 10],
  ["new_device", "New device", 1, 10],
  ["unauthorized", "Unauthorized account", 1, 50]
];
const insertRule = db.prepare(
  "INSERT OR IGNORE INTO rules (key, label, threshold, points, enabled) VALUES (?, ?, ?, ?, 1)"
);
for (const rule of defaultRules) insertRule.run(...rule);

export function publicUser(row) {
  const { password_hash, ...user } = row;
  return { ...user, is_active: Boolean(user.is_active) };
}
