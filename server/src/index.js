import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "node:http";
import { Server } from "socket.io";
import { db } from "./db.js";
import { socketAuth } from "./middleware/auth.js";
import authRoutes from "./routes/auth.js";
import transactionRoutes from "./routes/transactions.js";
import alertRoutes from "./routes/alerts.js";
import adminRoutes from "./routes/admin.js";

const app = express();
const server = http.createServer(app);
const allowedOrigin = process.env.CLIENT_URL || "http://localhost:5173";
const io = new Server(server, { cors: { origin: allowedOrigin, methods: ["GET", "POST", "PATCH", "PUT"] } });

io.use(socketAuth);
io.on("connection", (socket) => {
  const user = socket.data.user;
  socket.join(`user:${user.id}`);
  if (user.role === "admin") socket.join("admins");
});

app.set("io", io);
app.use(cors({ origin: allowedOrigin }));
app.use(express.json({ limit: "1mb" }));
app.get("/api/health", (_req, res) => res.json({ status: "ok", database: db.open ? "connected" : "disconnected" }));
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/admin", adminRoutes);
app.use((req, res) => res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` }));
app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: "An unexpected server error occurred." });
});

const port = Number(process.env.PORT) || 4000;
server.listen(port, () => console.log(`FundGuard API listening at http://localhost:${port}`));
