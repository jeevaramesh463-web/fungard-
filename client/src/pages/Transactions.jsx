import { useEffect, useState } from "react";
import { Download, Search, SlidersHorizontal, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import api, { getErrorMessage } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import TransactionTable from "../components/TransactionTable.jsx";

export default function Transactions() {
  const [params, setParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(params.get("search") || "");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [sort, setSort] = useState("date");
  const [direction, setDirection] = useState("desc");
  const { user } = useAuth();

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/transactions", { params: { page, limit: 10, search, status, type, sort, direction } });
      setRows(data.transactions);
      setPages(Math.max(data.pages, 1));
      setTotal(data.total);
    } catch (error) { toast.error(getErrorMessage(error)); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [page, search, status, type, sort, direction]);

  const doExport = async () => {
    try {
      const { data } = await api.get("/transactions/export", { responseType: "blob" });
      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url; link.download = "fundguard-transactions.csv"; link.click();
      URL.revokeObjectURL(url);
      toast.success("CSV exported.");
    } catch (error) { toast.error(getErrorMessage(error)); }
  };
  const review = async (id, action) => {
    try { await api.patch(`/transactions/${id}/review`, { action }); toast.success("Review updated."); load(); }
    catch (error) { toast.error(getErrorMessage(error)); }
  };
  const changeSort = (field) => {
    if (sort === field) setDirection((value) => value === "desc" ? "asc" : "desc");
    else { setSort(field); setDirection("desc"); }
  };

  return <div className="page-stack">
    <div className="page-heading-row"><div><div className="section-kicker">ACTIVITY LEDGER</div><h1>{user?.role === "admin" ? "All transactions" : "Transaction history"}</h1><p>Search, review, and export recorded fund activity.</p></div><button className="button button-secondary" onClick={doExport}><Download size={16} /> Export CSV</button></div>
    <section className="panel transaction-list-panel">
      <div className="filter-toolbar">
        <label className="filter-search"><Search size={16} /><input placeholder="Search receiver, category…" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} />{search && <button className="clear-search" onClick={() => setSearch("")} aria-label="Clear search"><X size={14} /></button>}</label>
        <div className="filter-select-wrap"><SlidersHorizontal size={15} /><select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} aria-label="Filter by risk status"><option value="">All statuses</option><option>Safe</option><option>Suspicious</option><option>Blocked</option></select></div>
        <select className="filter-select" value={type} onChange={(event) => { setType(event.target.value); setPage(1); }} aria-label="Filter by transaction type"><option value="">All types</option><option value="credit">Credit</option><option value="debit">Debit</option><option value="transfer">Transfer</option></select>
        <span className="results-count">{total} {total === 1 ? "result" : "results"}</span>
      </div>
      {loading ? <div className="loading-state table-loading"><span className="spinner" /> Loading transactions…</div> : <TransactionTable rows={rows} page={page} pages={pages} onPage={setPage} onSort={changeSort} onReview={review} admin={user?.role === "admin"} />}
    </section>
  </div>;
}
