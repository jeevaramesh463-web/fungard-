import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import AppLayout from "./components/AppLayout.jsx";
import SocketAlerts from "./components/SocketAlerts.jsx";
import Home from "./pages/Home.jsx";
import AuthPage from "./pages/AuthPage.jsx";

const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const Transactions = lazy(() => import("./pages/Transactions.jsx"));
const NewTransaction = lazy(() => import("./pages/NewTransaction.jsx"));
const Alerts = lazy(() => import("./pages/Alerts.jsx"));
const AdminRules = lazy(() => import("./pages/AdminRules.jsx"));
const AdminUsers = lazy(() => import("./pages/AdminUsers.jsx"));
const About = lazy(() => import("./pages/About.jsx"));

function Guard({ children, admin = false }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (admin && user.role !== "admin") return <Navigate to="/dashboard" replace />;
  if (!admin && user.role === "admin" && window.location.pathname === "/dashboard") return <Navigate to="/admin" replace />;
  return children;
}

function Protected({ children, admin = false }) {
  return <Guard admin={admin}><AppLayout>{children}</AppLayout></Guard>;
}

export default function App() {
  const { user } = useAuth();
  return <>
    <SocketAlerts />
    <Suspense fallback={<div className="loading-state"><span className="spinner" /> Loading FundGuard…</div>}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={user ? <Navigate to={user.role === "admin" ? "/admin" : "/dashboard"} replace /> : <AuthPage />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <AuthPage register />} />
        <Route path="/about" element={<About />} />
        <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
        <Route path="/admin" element={<Protected admin><Dashboard admin /></Protected>} />
        <Route path="/transactions" element={<Protected><Transactions /></Protected>} />
        <Route path="/transactions/new" element={<Protected><NewTransaction /></Protected>} />
        <Route path="/alerts" element={<Protected><Alerts /></Protected>} />
        <Route path="/admin/users" element={<Protected admin><AdminUsers /></Protected>} />
        <Route path="/admin/rules" element={<Protected admin><AdminRules /></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  </>;
}
