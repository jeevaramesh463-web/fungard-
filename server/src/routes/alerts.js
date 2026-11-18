import { Router } from "express";
import { db } from "../db.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();
router.use(authenticate);

router.get("/", (req, res) => {
  const rows = req.user.role === "admin"
    ? db.prepare("SELECT a.*, u.name AS user_name FROM alerts a JOIN users u ON u.id = a.user_id ORDER BY a.created_at DESC LIMIT 100").all()
    : db.prepare("SELECT * FROM alerts WHERE user_id = ? ORDER BY created_at DESC LIMIT 100").all(req.user.id);
  res.json({ alerts: rows });
});

router.patch("/:id/read", (req, res) => {
  const result = req.user.role === "admin"
    ? db.prepare("UPDATE alerts SET is_read = 1 WHERE id = ?").run(req.params.id)
    : db.prepare("UPDATE alerts SET is_read = 1 WHERE id = ? AND user_id = ?").run(req.params.id, req.user.id);
  if (!result.changes) return res.status(404).json({ error: "Alert not found." });
  res.json({ message: "Alert marked as read." });
});

router.patch("/read-all", (req, res) => {
  const result = req.user.role === "admin"
    ? db.prepare("UPDATE alerts SET is_read = 1 WHERE is_read = 0").run()
    : db.prepare("UPDATE alerts SET is_read = 1 WHERE user_id = ? AND is_read = 0").run(req.user.id);
  res.json({ updated: result.changes });
});

export default router;
