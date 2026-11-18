import { useState } from "react";
import { ArrowDownLeft, ArrowLeft, ArrowRight, ArrowUpRight, CheckCircle2, CircleHelp, LoaderCircle, ShieldAlert, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext.jsx";
import api, { getErrorMessage } from "../lib/api.js";
import StatusBadge from "../components/StatusBadge.jsx";

const initialForm = { type: "debit", amount: "", receiver: "", category: "Shopping", location: "Tiruchirappalli", device: "Chrome · Windows" };
const categories = ["Groceries", "Dining", "Transport", "Shopping", "Utilities", "Education", "Healthcare", "Entertainment", "Salary", "Other"];

export default function NewTransaction() {
  const { user } = useAuth();
  const accountId = user?.role === "user" ? `FG-${String(user.id).padStart(6, "0")}` : "";
  const [form, setForm] = useState({ ...initialForm, accountId });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const record = async (values) => {
    setLoading(true);
    setResult(null);
    try {
      const { data } = await api.post("/transactions", { ...values, amount: Number(values.amount) });
      setResult(data.transaction);
      toast.success(`${data.transaction.status} transaction recorded.`);
    } catch (error) { toast.error(getErrorMessage(error)); }
    finally { setLoading(false); }
  };
  const submit = (event) => {
    event.preventDefault();
    record(form);
  };
  const simulate = () => {
    const demo = { type: "transfer", amount: "8200", receiver: "Viva demo transfer", category: "Shopping", location: "Singapore", device: "New browser · Demo device", accountId };
    setForm(demo);
    setResult(null);
    record(demo);
  };

  return <div className="page-stack">
    <div className="page-heading-row"><div><div className="section-kicker">RECORD ACTIVITY</div><h1>New transaction</h1><p>Add a transaction and let FundGuard check its risk signals.</p></div><Link to="/transactions" className="button button-ghost"><ArrowLeft size={16} /> Transaction history</Link></div>
    <div className="new-transaction-grid">
      <section className="panel transaction-form-panel"><div className="panel-header"><div><h2>Transaction details</h2><p>Provide the context needed to monitor activity.</p></div><span className="secure-label"><CheckCircle2 size={15} /> Secure entry</span></div>
        <form className="transaction-form" onSubmit={submit}>
          <div className="form-field"><label>Transaction type</label><div className="type-selector">
            {[["debit", "Debit", ArrowUpRight], ["credit", "Credit", ArrowDownLeft], ["transfer", "Transfer", ArrowRight]].map(([type, label, Icon]) => <button type="button" className={`type-option ${form.type === type ? "selected" : ""}`} onClick={() => update("type", type)} key={type}><Icon size={17} />{label}</button>)}
          </div></div>
          <div className="form-two-col"><label className="form-field">Amount (INR)<div className="amount-input"><span>₹</span><input type="number" inputMode="decimal" min="0.01" max="100000000" step="0.01" placeholder="0.00" value={form.amount} onChange={(event) => update("amount", event.target.value)} required /></div><small>Enter the total transaction amount.</small></label>
            <label className="form-field">Category<select value={form.category} onChange={(event) => update("category", event.target.value)}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label></div>
          <label className="form-field">Source account ID<input maxLength={40} placeholder="FG-000001" value={form.accountId} onChange={(event) => update("accountId", event.target.value)} /><small>Unknown or unauthorized source accounts are blocked.</small></label>
          <label className="form-field">Receiver / merchant<input maxLength={120} placeholder="e.g. MetroMart Online" value={form.receiver} onChange={(event) => update("receiver", event.target.value)} required /><small>Use “BLACKLISTED MERCHANT” to test an unauthorized recipient.</small></label>
          <div className="form-two-col"><label className="form-field">Location<input maxLength={120} value={form.location} onChange={(event) => update("location", event.target.value)} required /></label><label className="form-field">Device<input maxLength={120} value={form.device} onChange={(event) => update("device", event.target.value)} required /></label></div>
          <div className="form-footer"><span><ShieldAlert size={15} /> This entry will be checked against your activity.</span><button className="button button-primary" disabled={loading}>{loading ? <><LoaderCircle size={16} className="spin" /> Checking…</> : <>Record transaction <ArrowRight size={16} /></>}</button></div>
        </form>
        {result && <div className={`transaction-result result-${result.status.toLowerCase()}`}><div className="result-heading"><span><CheckCircle2 size={18} /> Transaction recorded</span><StatusBadge status={result.status} /></div><div className="result-score"><strong>{result.risk_score}</strong><span> / 100 risk score</span></div>{result.risk_reasons?.length ? <ul>{result.risk_reasons.map((reason) => <li key={reason}><ShieldAlert size={14} />{reason}</li>)}</ul> : <p>No risk rules were triggered. This transaction appears safe.</p>}<button className="text-action" onClick={() => navigate("/transactions")}>View transaction history <ArrowRight size={14} /></button></div>}
      </section>
      <aside className="transaction-side">
        <section className="panel demo-panel"><div className="demo-icon"><Sparkles size={20} /></div><span className="section-kicker">VIVA DEMONSTRATION</span><h2>See alerts in action.</h2><p>Create a sample high-value transfer to trigger a live alert and see its risk score right away.</p><button type="button" className="button button-secondary button-full" onClick={simulate} disabled={loading}><Sparkles size={16} /> {loading ? "Simulating…" : "Simulate transaction"}</button><small>Demo data only · No actual payment is made</small></section>
        <section className="panel detection-info"><h3><CircleHelp size={17} /> What gets checked?</h3><ul><li><span>Amount & personal baseline</span><span>High or unusual</span></li><li><span>Transaction pace</span><span>Velocity check</span></li><li><span>Time, location, device</span><span>Context check</span></li><li><span>Account & recipient</span><span>Authorization</span></li></ul><Link to="/about">Learn about detection <ArrowRight size={14} /></Link></section>
      </aside>
    </div>
  </div>;
}
