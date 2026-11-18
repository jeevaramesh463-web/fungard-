import { useEffect, useState } from "react";
import { Activity, ArrowDownLeft, ArrowRight, ArrowUpRight, CircleDollarSign, Clock3, Plus, ShieldAlert, ShieldCheck, Sparkles, Users, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api, { getErrorMessage } from "../lib/api.js";
import toast from "react-hot-toast";
import StatusBadge from "../components/StatusBadge.jsx";
import TransactionTable from "../components/TransactionTable.jsx";

const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);
const COLORS = ["#18a88d", "#e7a43a", "#eb6670"];

export default function Dashboard({ admin = false }) {
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const calls = admin
        ? [api.get("/admin/overview"), api.get("/transactions", { params: { limit: 6 } })]
        : [api.get("/transactions/summary"), api.get("/transactions", { params: { limit: 6 } }), api.get("/alerts")];
      const results = await Promise.all(calls);
      setSummary(results[0].data);
      setTransactions(results[1].data.transactions);
      setAlerts(admin ? results[0].data.alerts : results[2].data.alerts.slice(0, 4));
    } catch (error) { toast.error(getErrorMessage(error)); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [admin]);

  const review = async (id, action) => {
    try {
      await api.patch(`/transactions/${id}/review`, { action });
      toast.success(action === "false_positive" ? "Marked as false positive." : "Transaction approved.");
      load();
    } catch (error) { toast.error(getErrorMessage(error)); }
  };

  if (loading) return <div className="loading-state"><span className="spinner" /> Loading your overview…</div>;
  if (!summary) return <div className="empty-state"><h3>Overview unavailable</h3><button className="button button-secondary" onClick={load}>Try again</button></div>;

  return <div className="page-stack">
    <div className="page-heading-row"><div><div className="section-kicker">{admin ? "CONTROL CENTER" : "YOUR FINANCIAL SNAPSHOT"}</div><h1>{admin ? "Admin overview" : "Good to see you again."}</h1><p>{admin ? "Monitor transactions, alerts, and account activity across FundGuard." : "Here’s what’s happening with your funds today."}</p></div>
      <div className="heading-actions">{admin ? <><Link to="/transactions/new" className="button button-primary"><Sparkles size={16} /> Simulate transaction</Link><Link to="/admin/users" className="button button-secondary"><Users size={16} /> Manage users</Link><Link to="/admin/rules" className="button button-secondary"><Activity size={16} /> Detection rules</Link></> : <Link to="/transactions/new" className="button button-primary"><Plus size={17} /> New transaction</Link>}</div>
    </div>
    <div className={`stats-grid ${admin ? "admin-stats" : ""}`}>
      {admin ? <>
        <Stat icon={Wallet} label="Total transactions" value={summary.total_transactions || 0} tone="blue" hint="Across all accounts" />
        <Stat icon={ShieldAlert} label="Flagged for review" value={summary.flagged || 0} tone="amber" hint="Suspicious activity" />
        <Stat icon={ShieldCheck} label="Blocked transactions" value={summary.blocked || 0} tone="red" hint="Prevented by rules" />
        <Stat icon={Users} label="Active users" value={summary.users || 0} tone="teal" hint={`${summary.alerts_today || 0} transactions today`} />
      </> : <>
        <Stat icon={CircleDollarSign} label="Available balance" value={money(summary.balance)} tone="teal" hint="Across your primary account" />
        <Stat icon={Activity} label="Total transactions" value={summary.transactions || 0} tone="blue" hint="All recorded activity" />
        <Stat icon={ShieldAlert} label="Needs your attention" value={summary.flagged || 0} tone="amber" hint={`${summary.blocked || 0} blocked by FundGuard`} />
      </>}
    </div>
    <div className="dashboard-charts">
      <section className="panel chart-panel"><div className="panel-header"><div><h2>{admin ? "Transaction overview" : "Cash flow"}</h2><p>{admin ? "Recent account activity" : "Credits and debits over the last 7 days"}</p></div><span className="chart-period"><span className="chart-legend-dot teal-dot" /> Credits <span className="chart-legend-dot blue-dot" /> Debits</span></div>
        <div className="chart-area">{summary.daily?.length ? <ResponsiveContainer width="100%" height="100%"><AreaChart data={summary.daily} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}><defs><linearGradient id="creditsFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#20af96" stopOpacity=".2" /><stop offset="100%" stopColor="#20af96" stopOpacity="0" /></linearGradient><linearGradient id="debitsFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#6b8bf5" stopOpacity=".14" /><stop offset="100%" stopColor="#6b8bf5" stopOpacity="0" /></linearGradient></defs><CartesianGrid strokeDasharray="3 5" vertical={false} stroke="var(--line)" /><XAxis dataKey="date" tickFormatter={(value) => value.slice(5)} tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} /><YAxis tickFormatter={(value) => `₹${value / 1000}k`} tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} width={48} /><Tooltip formatter={(value) => money(value)} contentStyle={{ background: "var(--surface)", borderColor: "var(--line)", borderRadius: 10, color: "var(--text)" }} /><Area type="monotone" dataKey="credits" stroke="#20af96" strokeWidth={2.5} fill="url(#creditsFill)" /><Area type="monotone" dataKey="debits" stroke="#6b8bf5" strokeWidth={2.5} fill="url(#debitsFill)" /></AreaChart></ResponsiveContainer> : <div className="chart-empty">Transaction trends will appear as you record activity.</div>}</div>
      </section>
      <section className="panel category-panel"><div className="panel-header"><div><h2>{admin ? "Risk distribution" : "Spending by category"}</h2><p>{admin ? "Transactions grouped by current risk" : "Your top spending categories"}</p></div></div>
        <div className="donut-wrap">{(admin ? summary.chart : summary.categories)?.length ? <><div className="donut-chart"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={admin ? summary.chart : summary.categories} dataKey={admin ? "count" : "total"} nameKey={admin ? "status" : "category"} innerRadius={62} outerRadius={82} paddingAngle={4} stroke="none">{(admin ? summary.chart : summary.categories).map((entry, index) => <Cell key={entry.status || entry.category} fill={admin ? ({ Safe: COLORS[0], Suspicious: COLORS[1], Blocked: COLORS[2] }[entry.status] || COLORS[index % 3]) : COLORS[index % COLORS.length]} />)}</Pie><Tooltip contentStyle={{ background: "var(--surface)", borderColor: "var(--line)", borderRadius: 10, color: "var(--text)" }} /></PieChart></ResponsiveContainer><div className="donut-center"><strong>{admin ? summary.total_transactions : summary.categories.length}</strong><span>{admin ? "transactions" : "categories"}</span></div></div>
          <div className="category-legend">{(admin ? summary.chart : summary.categories).slice(0, 4).map((entry, index) => <div key={entry.status || entry.category}><span className="chart-legend-dot" style={{ background: admin ? ({ Safe: COLORS[0], Suspicious: COLORS[1], Blocked: COLORS[2] }[entry.status]) : COLORS[index % COLORS.length] }} /><span>{admin ? entry.status : entry.category}</span><strong>{admin ? entry.count : money(entry.total)}</strong></div>)}</div></> : <div className="chart-empty">Your spending breakdown will appear here.</div>}</div>
      </section>
    </div>
    <section className="panel transactions-panel"><div className="panel-header"><div><h2>{admin ? "Transactions requiring attention" : "Recent transactions"}</h2><p>{admin ? "Review flagged activity and take action" : "A quick look at your latest activity"}</p></div><Link to="/transactions" className="panel-link">View all <ArrowRight size={15} /></Link></div>
      <TransactionTable rows={transactions} page={1} pages={1} admin={admin} onReview={review} />
    </section>
    <section className="panel alerts-panel"><div className="panel-header"><div><h2>Latest alerts</h2><p>Real-time risk notifications</p></div><Link to="/alerts" className="panel-link">Alert center <ArrowRight size={15} /></Link></div>
      {alerts.length ? <div className="alert-list compact">{alerts.map((alert) => <AlertItem key={alert.id} alert={alert} />)}</div> : <div className="inline-empty"><span className="safe-check"><ShieldCheck size={17} /></span><div><strong>All clear</strong><small>No suspicious activity to review.</small></div></div>}
    </section>
    {admin && <div className="admin-note"><Sparkles size={16} /> Detection is running against editable rules. Review thresholds in <Link to="/admin/rules">Detection rules</Link>.</div>}
  </div>;
}

function Stat({ icon: Icon, label, value, tone, hint }) {
  return <article className="stat-card"><div className={`stat-icon ${tone}`}><Icon size={19} /></div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-hint"><span className="stat-hint-dot" />{hint}</div></article>;
}

function AlertItem({ alert }) {
  return <div className={`alert-row ${alert.severity === "high" ? "alert-row-high" : ""}`}><span className={`alert-icon ${alert.severity === "high" ? "alert-icon-red" : "alert-icon-amber"}`}><ShieldAlert size={18} /></span><div className="alert-row-content"><div><strong>{alert.title}</strong>{alert.user_name && <span className="alert-user"> · {alert.user_name}</span>}</div><p>{alert.message}</p><small><Clock3 size={12} /> {new Date(alert.created_at).toLocaleString()}</small></div><StatusBadge status={alert.severity === "high" ? "Blocked" : "Suspicious"} /></div>;
}
