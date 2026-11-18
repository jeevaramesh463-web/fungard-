import { db } from "../db.js";

function getEnabledRule(key) {
  return db.prepare("SELECT * FROM rules WHERE key = ? AND enabled = 1").get(key);
}

export function assessTransaction(input, userId) {
  let score = 0;
  const reasons = [];
  const rule = (key, passes, detail) => {
    const config = getEnabledRule(key);
    if (config && passes) {
      score += config.points;
      reasons.push(detail);
    }
    return config;
  };

  const high = getEnabledRule("high_value");
  if (high && input.amount > high.threshold) {
    score += high.points;
    reasons.push(`Amount exceeds the ${high.threshold.toLocaleString()} high-value limit`);
  }

  const average = db.prepare(
    "SELECT AVG(amount) AS average FROM transactions WHERE user_id = ? AND status != 'Blocked'"
  ).get(userId)?.average;
  const multiplier = getEnabledRule("unusual_multiplier");
  if (multiplier && average > 0 && input.amount > average * multiplier.threshold) {
    score += multiplier.points;
    reasons.push(`Amount is more than ${multiplier.threshold}× your average transaction`);
  }

  const velocity = getEnabledRule("velocity_count");
  if (velocity) {
    const since = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const count = db.prepare(
      "SELECT COUNT(*) AS count FROM transactions WHERE user_id = ? AND created_at >= ?"
    ).get(userId, since).count;
    if (count >= velocity.threshold) {
      score += velocity.points;
      reasons.push(`More than ${velocity.threshold} transactions in the last 2 minutes`);
    }
  }

  const hour = input.createdAt ? new Date(input.createdAt).getHours() : new Date().getHours();
  if (hour >= 0 && hour < 5) {
    score += 15;
    reasons.push("Transaction occurred between 12 AM and 5 AM");
  }

  const previous = db.prepare(
    "SELECT DISTINCT location, device FROM transactions WHERE user_id = ?"
  ).all(userId);
  const knownLocations = new Set(previous.map((item) => item.location));
  const knownDevices = new Set(previous.map((item) => item.device));
  rule("new_location", previous.length > 0 && !knownLocations.has(input.location), "New location for this account");
  rule("new_device", previous.length > 0 && !knownDevices.has(input.device), "New device for this account");

  let unauthorized = false;
  if (input.accountId) {
    const account = db.prepare("SELECT id FROM accounts WHERE id = ? AND user_id = ?").get(input.accountId, userId);
    unauthorized = !account;
  }
  const blocked = db.prepare("SELECT reason FROM blocked_accounts WHERE lower(account) = lower(?)").get(input.receiver);
  if (blocked) {
    unauthorized = true;
    reasons.push(`Recipient is blocked: ${blocked.reason}`);
  } else if (unauthorized) {
    reasons.push("Unknown or unauthorized source account");
  }
  const unauthorizedRule = getEnabledRule("unauthorized");
  if (unauthorized && unauthorizedRule) score += unauthorizedRule.points;

  score = Math.min(100, score);
  const status = unauthorized || score >= 60 ? "Blocked" : score >= 30 ? "Suspicious" : "Safe";
  return { score, status, reasons };
}
