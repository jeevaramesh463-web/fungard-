import { useEffect, useState } from "react";
import { AlertTriangle, ArrowLeft, Check, Info, Save, ShieldAlert, SlidersHorizontal, ToggleLeft, ToggleRight } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api, { getErrorMessage } from "../lib/api.js";

const descriptions = {
  high_value: "Flag transactions above a fixed INR value.",
  unusual_multiplier: "Compare this transaction with the user’s average amount.",
  velocity_count: "Flag when this many prior transactions occurred within 2 minutes.",
  new_location: "Add risk points when activity comes from a new location.",
  new_device: "Add risk points when activity comes from a new device.",
  unauthorized: "Add risk points for blocked recipients or invalid source accounts."
};
const hasThreshold = (key) => ["high_value", "unusual_multiplier", "velocity_count"].includes(key);

export default function AdminRules() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const load = async () => {
    try { setRules((await api.get("/admin/rules")).data.rules); }
    catch (error) { toast.error(getErrorMessage(error)); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const update = (key, field, value) => setRules((current) => current.map((rule) => rule.key === key ? { ...rule, [field]: value } : rule));
  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try { setRules((await api.put("/admin/rules", { rules })).data.rules); toast.success("Detection rules saved."); }
    catch (error) { toast.error(getErrorMessage(error)); }
    finally { setSaving(false); }
  };

  return <div className="page-stack">
    <div className="page-heading-row"><div><div className="section-kicker">DETECTION CONFIGURATION</div><h1>Detection rules</h1><p>Adjust thresholds and risk points used to score transactions.</p></div><Link to="/admin" className="button button-ghost"><ArrowLeft size={16} /> Admin overview</Link></div>
    <div className="rules-intro"><span><SlidersHorizontal size={19} /></span><div><strong>Transparent, configurable monitoring</strong><p>Updates apply to new transactions immediately. Existing transaction scores are not recalculated automatically.</p></div><span className="rules-impact"><ShieldAlert size={15} /> New activity only</span></div>
    <form onSubmit={save} className="rules-form">
      {loading ? <div className="panel loading-state"><span className="spinner" /> Loading detection rules…</div> : <section className="panel rules-panel">
        <div className="panel-header"><div><h2>Risk signal settings</h2><p>Set the rule trigger threshold and its contribution to the score.</p></div><span className="rules-count">{rules.filter((rule) => rule.enabled).length} active</span></div>
        <div className="rules-table">
          {rules.map((rule) => <article className={`rule-row ${!rule.enabled ? "rule-disabled" : ""}`} key={rule.key}>
            <button type="button" className={`rule-toggle ${rule.enabled ? "enabled" : ""}`} onClick={() => update(rule.key, "enabled", !rule.enabled)} aria-label={`${rule.enabled ? "Disable" : "Enable"} ${rule.label}`}>
              {rule.enabled ? <ToggleRight size={27} /> : <ToggleLeft size={27} />}
            </button>
            <div className="rule-description"><strong>{rule.label}</strong><p>{descriptions[rule.key] || "Configure this transaction risk signal."}</p></div>
            <label className="rule-input"><span>{hasThreshold(rule.key) ? "Threshold" : "Trigger"}</span><div>{hasThreshold(rule.key) ? <><input type="number" min="0.01" step="any" value={rule.threshold} onChange={(event) => update(rule.key, "threshold", Number(event.target.value))} /><small>{rule.key === "high_value" ? "INR" : rule.key === "unusual_multiplier" ? "× average" : "transactions"}</small></> : <span className="rule-trigger">Any match</span>}</div></label>
            <label className="rule-input points-input"><span>Risk points</span><div><input type="number" min="0" max="100" step="1" value={rule.points} onChange={(event) => update(rule.key, "points", Number(event.target.value))} /><small>pts</small></div></label>
          </article>)}
        </div>
        <div className="rules-footer"><span><Info size={15} /> Rule points are combined and capped at a score of 100.</span><button className="button button-primary" disabled={saving}>{saving ? "Saving…" : <><Save size={16} /> Save changes</>}</button></div>
      </section>}
    </form>
    <div className="risk-threshold-card"><span className="risk-threshold-icon"><AlertTriangle size={18} /></span><div><strong>Risk status thresholds</strong><p>Safe: 0–29 points <i /> Suspicious: 30–59 points <i /> Blocked: 60+ points or unauthorized account.</p></div><span className="fixed-tag">FIXED</span></div>
  </div>;
}
