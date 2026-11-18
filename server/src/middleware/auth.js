import jwt from "jsonwebtoken";
import { db, publicUser } from "../db.js";

const secret = process.env.JWT_SECRET || "local-fundguard-development-secret-change-me";

export function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, secret, { expiresIn: "12h" });
}

export function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ error: "Authentication required." });
  try {
    const payload = jwt.verify(token, secret);
    const row = db.prepare("SELECT * FROM users WHERE id = ? AND is_active = 1").get(payload.id);
    if (!row) return res.status(401).json({ error: "Account is unavailable." });
    req.user = publicUser(row);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired session." });
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin access required." });
  next();
}

export function socketAuth(socket, next) {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication required"));
    const payload = jwt.verify(token, secret);
    const user = db.prepare("SELECT id, role FROM users WHERE id = ? AND is_active = 1").get(payload.id);
    if (!user) return next(new Error("Account unavailable"));
    socket.data.user = user;
    next();
  } catch {
    next(new Error("Invalid or expired session"));
  }
}
