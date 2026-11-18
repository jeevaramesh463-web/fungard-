import { useEffect, useState } from "react";
import { Bell, BellRing, CheckCheck, Clock3, ShieldAlert, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import api, { getErrorMessage } from "../lib/api.js";
import StatusBadge from "../components/StatusBadge.jsx";

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    try { setAlerts((await api.get("/alerts")).data.alerts); }
    catch (error) { toast.error(getErrorMessage(error)); }
    finally { setLoading(false); }
  };
  useEffect(() => {
    load();
    const handleAlert = (event) => setAlerts((current) => [event.detail, ...current.filter((alert) => alert.id !== event.detail.id)]);
    window.addEventListener("fundguard:alert", handleAlert);
    return () => window.removeEventListener("fundguard:alert", handleAlert);
  }, []);
  const markRead = async (id) => {
    try { await api.patch(`/alerts/${id}/read`); setAlerts((current) => current.map((alert) => alert.id === id ? { ...alert, is_read: 1 } : alert)); }
    catch (error) { toast.error(getErrorMessage(error)); }
  };
  const readAll = async () => {
    try { await api.patch("/alerts/read-all"); setAlerts((current) => current.map((alert) => ({ ...alert, is_read: 1 }))); toast.success("All alerts marked as read."); }
    catch (error) { toast.error(getErrorMessage(error)); }
  };
  const unread = alerts.filter((alert) => !alert.is_read).length;

  return <div className="page-stack">
    <div className="page-heading-row"><div><div className="section-kicker">REAL-TIME MONITORING</div><h1>Alert center</h1><p>Stay informed about unusual activity and review risk signals.</p></div>{unread > 0 && <button className="button button-secondary" onClick={readAll}><CheckCheck size={16} /> Mark all as read</button>}</div>
    <div className="alert-summary-strip"><div className="alert-summary-icon"><BellRing size={19} /></div><div><strong>{unread ? `${unread} alert${unread === 1 ? "" : "s"} need your attention` : "You’re all caught up"}</strong><span>Alerts update live when new activity is flagged.</span></div><span className="live-tag"><i /> LIVE</span></div>
    <section className="panel alert-center-panel"><div className="panel-header"><div><h2>Recent notifications</h2><p>{alerts.length} {alerts.length === 1 ? "notification" : "notifications"}</p></div><span className="alert-header-mark"><Bell size={18} /> FundGuard alerts</span></div>
      {loading ? <div className="loading-state"><span className="spinner" /> Loading alerts…</div> : alerts.length ? <div className="alert-list">{alerts.map((alert) => <article key={alert.id} className={`alert-card ${!alert.is_read ? "alert-unread" : ""}`}>
        <span className={`alert-icon ${alert.severity === "high" ? "alert-icon-red" : "alert-icon-amber"}`}>{alert.severity === "high" ? <ShieldAlert size={19} /> : <ShieldCheck size={19} />}</span>
        <div className="alert-row-content"><div className="alert-title-line"><strong>{alert.title}</strong>{alert.user_name && <span className="alert-user"> · {alert.user_name}</span>}{!alert.is_read && <span className="unread-label">NEW</span>}</div><p>{alert.message}</p><small><Clock3 size={13} /> {new Date(alert.created_at).toLocaleString()}</small></div>
        <div className="alert-card-actions"><StatusBadge status={alert.severity === "high" ? "Blocked" : "Suspicious"} />{!alert.is_read && <button className="text-action" onClick={() => markRead(alert.id)}>Mark read</button>}</div>
      </article>)}</div> : <div className="empty-state"><div className="empty-icon"><ShieldCheck size={23} /></div><h3>No alerts yet</h3><p>When FundGuard detects unusual activity, it will show up here.</p></div>}
    </section>
    <div className="notification-footnote"><ShieldCheck size={15} /> Notification email and SMS are simulated and recorded locally for this project demo.</div>
  </div>;
}
