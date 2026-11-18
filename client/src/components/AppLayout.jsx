import { useEffect, useState } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { Activity, Bell, ChevronDown, CircleHelp, LayoutDashboard, LogOut, Menu, Moon, Plus, Search, Settings2, ShieldCheck, Sun, UserRound, WalletCards, X } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../lib/api.js";

const userLinks = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/transactions", label: "Transactions", icon: WalletCards },
  { to: "/transactions/new", label: "New transaction", icon: Plus },
  { to: "/alerts", label: "Alerts", icon: Bell }
];
const adminLinks = [
  { to: "/admin", label: "Admin overview", icon: LayoutDashboard },
  { to: "/admin/users", label: "User management", icon: UserRound },
  { to: "/transactions", label: "All transactions", icon: WalletCards },
  { to: "/alerts", label: "Alert center", icon: Bell },
  { to: "/admin/rules", label: "Detection rules", icon: Settings2 }
];

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const [theme, setTheme] = useState(() => localStorage.getItem("fundguard_theme") || "light");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const location = useLocation();
  const links = user?.role === "admin" ? adminLinks : userLinks;

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("fundguard_theme", theme);
  }, [theme]);
  useEffect(() => {
    api.get("/alerts").then(({ data }) => setUnread(data.alerts.filter((alert) => !alert.is_read).length)).catch(() => setUnread(0));
    setMobileOpen(false);
  }, [location.pathname]);
  useEffect(() => {
    const handleAlert = () => setUnread((count) => count + 1);
    window.addEventListener("fundguard:alert", handleAlert);
    return () => window.removeEventListener("fundguard:alert", handleAlert);
  }, []);

  const sidebar = <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
    <Link to="/" className="brand"><span className="brand-mark"><ShieldCheck size={21} /></span><span>fund<span>guard</span></span></Link>
    <div className="workspace-label">WORKSPACE</div>
    <nav className="side-nav">
      {links.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === "/dashboard" || to === "/admin"} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
        <Icon size={18} /><span>{label}</span>{label.toLowerCase().includes("alert") && unread > 0 && <span className="nav-count">{unread}</span>}
      </NavLink>)}
    </nav>
    <div className="sidebar-bottom">
      <Link to="/about" className="nav-link"><CircleHelp size={18} /><span>About the project</span></Link>
      <div className="security-card"><div className="security-icon"><ShieldCheck size={17} /></div><div><strong>Protected workspace</strong><small>Live monitoring is on</small></div><span className="online-dot" /></div>
      <div className="sidebar-profile">
        <span className="avatar">{user?.name?.slice(0, 1).toUpperCase() || "U"}</span>
        <span className="profile-text"><strong>{user?.name}</strong><small>{user?.role === "admin" ? "Administrator" : "Personal account"}</small></span>
        <button className="icon-btn profile-logout" onClick={logout} title="Sign out"><LogOut size={17} /></button>
      </div>
    </div>
  </aside>;

  return <div className="app-shell">
    {mobileOpen && <button className="mobile-backdrop" onClick={() => setMobileOpen(false)} aria-label="Close menu" />}
    {sidebar}
    <div className="main-column">
      <header className="topbar">
        <button className="icon-btn mobile-menu" onClick={() => setMobileOpen((open) => !open)} aria-label="Toggle navigation">{mobileOpen ? <X size={20} /> : <Menu size={20} />}</button>
        <div className="breadcrumbs"><span>Workspace</span><span className="crumb-slash">/</span><strong>{pageTitle(location.pathname)}</strong></div>
        <div className="topbar-actions">
          <label className="quick-search"><Search size={16} /><input placeholder="Search anything..." onKeyDown={(event) => {
            if (event.key === "Enter" && event.currentTarget.value) window.location.href = `/transactions?search=${encodeURIComponent(event.currentTarget.value)}`;
          }} /><kbd>⌘ K</kbd></label>
          <button className="icon-btn theme-toggle" title="Toggle theme" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>{theme === "light" ? <Moon size={18} /> : <Sun size={18} />}</button>
          <Link to="/alerts" className="icon-btn notification-btn" aria-label="Alerts"><Bell size={18} />{unread > 0 && <i />}</Link>
          <span className="topbar-divider" />
          <button className="topbar-user" onClick={() => logout()} title="Sign out">
            <span className="avatar avatar-sm">{user?.name?.slice(0, 1).toUpperCase()}</span><ChevronDown size={14} />
          </button>
        </div>
      </header>
      <main className="page-content">{children}</main>
      <footer className="app-footer"><span><Activity size={14} /> FundGuard monitoring system</span><span>Demo environment · SRM TRP Engineering College</span></footer>
    </div>
  </div>;
}

function pageTitle(path) {
  if (path.startsWith("/admin/rules")) return "Detection rules";
  if (path.startsWith("/admin/users")) return "User management";
  if (path.startsWith("/admin")) return "Admin overview";
  if (path.includes("/new")) return "New transaction";
  if (path.includes("transactions")) return "Transactions";
  if (path.includes("alerts")) return "Alert center";
  return "Overview";
}
