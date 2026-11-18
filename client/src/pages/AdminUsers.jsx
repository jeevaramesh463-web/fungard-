import { useEffect, useMemo, useState } from "react";
import { Search, ShieldCheck, UserRound, Users } from "lucide-react";
import toast from "react-hot-toast";
import api, { getErrorMessage } from "../lib/api.js";

const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const load = async () => {
    try { setUsers((await api.get("/admin/users")).data.users); }
    catch (error) { toast.error(getErrorMessage(error)); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const visibleUsers = useMemo(() => users.filter((user) =>
    `${user.name} ${user.email}`.toLowerCase().includes(search.toLowerCase())
  ), [users, search]);

  const toggle = async (user) => {
    setBusy(user.id);
    try {
      await api.patch(`/admin/users/${user.id}/status`, { active: !user.is_active });
      setUsers((current) => current.map((entry) => entry.id === user.id ? { ...entry, is_active: !entry.is_active } : entry));
      toast.success(`${user.name} ${user.is_active ? "deactivated" : "activated"}.`);
    } catch (error) { toast.error(getErrorMessage(error)); }
    finally { setBusy(null); }
  };

  return <div className="page-stack">
    <div className="page-heading-row"><div><div className="section-kicker">ACCOUNT OVERSIGHT</div><h1>User management</h1><p>Review demo accounts and manage access to FundGuard.</p></div><div className="user-total"><Users size={16} /> {users.length} accounts</div></div>
    <section className="panel users-panel"><div className="panel-header"><div><h2>Registered accounts</h2><p>Administrators and users in this local demo.</p></div><div className="user-search"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search people…" /></div></div>
      {loading ? <div className="loading-state"><span className="spinner" /> Loading users…</div> : visibleUsers.length ? <div className="table-scroll"><table className="data-table users-table"><thead><tr><th>Account</th><th>Role</th><th>Balance</th><th>Transactions</th><th>Status</th><th>Access</th></tr></thead><tbody>
        {visibleUsers.map((user) => <tr key={user.id}>
          <td><div className="person-cell"><span className="avatar avatar-sm">{user.name.slice(0, 1).toUpperCase()}</span><div><strong>{user.name}</strong><small>{user.email}</small></div></div></td>
          <td><span className={`role-label ${user.role === "admin" ? "role-admin" : ""}`}>{user.role === "admin" ? <ShieldCheck size={12} /> : <UserRound size={12} />}{user.role}</span></td>
          <td>{money(user.balance)}</td><td>{user.transaction_count}</td>
          <td><span className={`user-state ${user.is_active ? "user-state-active" : "user-state-inactive"}`}><i />{user.is_active ? "Active" : "Inactive"}</span></td>
          <td>{user.role === "admin" ? <span className="protected-label">Protected</span> : <button className={`access-action ${user.is_active ? "deactivate-action" : "activate-action"}`} disabled={busy === user.id} onClick={() => toggle(user)}>{busy === user.id ? "Updating…" : user.is_active ? "Deactivate" : "Activate"}</button>}</td>
        </tr>)}
      </tbody></table></div> : <div className="empty-state"><div className="empty-icon"><UserRound size={22} /></div><h3>No matching accounts</h3><p>Try searching by a different name or email.</p></div>}
    </section>
    <div className="users-footnote"><ShieldCheck size={15} /> Deactivated users cannot sign in. Administrator accounts are protected from this action.</div>
  </div>;
}
