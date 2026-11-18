import { ArrowDownLeft, ArrowUpRight, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import StatusBadge from "./StatusBadge.jsx";

const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value || 0);

export default function TransactionTable({ rows, page, pages, onPage, onSort, onReview, admin = false }) {
  if (!rows.length) return <div className="empty-state"><div className="empty-icon"><ArrowUpDown size={22} /></div><h3>No transactions found</h3><p>Try changing your filters or add a new transaction.</p></div>;
  return <>
    <div className="table-scroll">
      <table className="data-table">
        <thead><tr>
          {admin && <th>Account holder</th>}
          <th>Transaction</th><th onClick={() => onSort?.("amount")} className="sortable">Amount ↕</th>
          <th>Category</th><th>Risk</th><th onClick={() => onSort?.("date")} className="sortable">Date ↕</th>
          {admin && <th>Review</th>}
        </tr></thead>
        <tbody>{rows.map((tx) => <tr key={tx.id}>
          {admin && <td><div className="person-cell"><span className="avatar avatar-sm">{(tx.user_name || "U").slice(0, 1)}</span><div><strong>{tx.user_name}</strong><small>{tx.user_email}</small></div></div></td>}
          <td><div className="transaction-cell">
            <span className={`transaction-type-icon ${tx.type === "credit" ? "credit" : ""}`}>{tx.type === "credit" ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}</span>
            <div><strong>{tx.receiver}</strong><small className="capitalize">{tx.type} · {tx.location}</small></div>
          </div></td>
          <td className={tx.type === "credit" ? "amount-positive" : "amount-negative"}>{tx.type === "credit" ? "+" : "−"}{money(tx.amount)}</td>
          <td>{tx.category}</td><td><StatusBadge status={tx.status} /><small className="risk-score">{tx.risk_score} risk</small></td>
          <td>{new Date(tx.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}<small>{new Date(tx.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</small></td>
          {admin && <td>{tx.status !== "Safe" && <div className="review-actions">
            <button className="text-action" onClick={() => onReview?.(tx.id, "approve")}>Approve</button>
            <button className="text-action danger-text" onClick={() => onReview?.(tx.id, "block")}>Block</button>
            <button className="text-action danger-text" onClick={() => onReview?.(tx.id, "false_positive")}>False positive</button>
          </div>}</td>}
        </tr>)}</tbody>
      </table>
    </div>
    {pages > 1 && <div className="pagination"><span>Page {page} of {pages}</span><div><button className="icon-btn" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page"><ChevronLeft size={18} /></button><button className="icon-btn" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Next page"><ChevronRight size={18} /></button></div></div>}
  </>;
}
