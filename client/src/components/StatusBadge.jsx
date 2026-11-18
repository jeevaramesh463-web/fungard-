export default function StatusBadge({ status }) {
  const styles = {
    Safe: "badge-safe",
    Suspicious: "badge-warning",
    Blocked: "badge-danger",
    approved: "badge-safe",
    pending: "badge-neutral",
    false_positive: "badge-neutral",
    blocked: "badge-danger"
  };
  return <span className={`badge ${styles[status] || "badge-neutral"}`}><span className="badge-dot" />{status || "—"}</span>;
}
