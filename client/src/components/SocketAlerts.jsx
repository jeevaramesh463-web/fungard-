import { useEffect } from "react";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext.jsx";

export default function SocketAlerts() {
  const { user } = useAuth();
  useEffect(() => {
    const token = localStorage.getItem("fundguard_token");
    if (!user || !token) return undefined;
    const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:4000", { auth: { token } });
    socket.on("alert:new", (alert) => {
      toast.error(alert.title, { icon: "⚠️", duration: 6000 });
      window.dispatchEvent(new CustomEvent("fundguard:alert", { detail: alert }));
    });
    socket.on("connect_error", (error) => console.error("FundGuard live alerts:", error.message));
    return () => socket.disconnect();
  }, [user]);
  return null;
}
