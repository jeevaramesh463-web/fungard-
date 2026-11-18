import { useState } from "react";
import { ArrowLeft, ArrowRight, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext.jsx";
import { getErrorMessage } from "../lib/api.js";

export default function AuthPage({ register = false }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, register: signUp } = useAuth();
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      if (register) await signUp(name, email, password);
      else await login(email, password);
      toast.success(register ? "Your account is ready." : "Welcome back.");
      const current = JSON.parse(localStorage.getItem("fundguard_user"));
      navigate(current.role === "admin" ? "/admin" : "/dashboard", { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally { setLoading(false); }
  };

  return <div className="auth-page">
    <div className="auth-aside"><Link to="/" className="brand"><span className="brand-mark"><ShieldCheck size={21} /></span><span>fund<span>guard</span></span></Link><Link to="/" className="back-home"><ArrowLeft size={15} /> Back to home</Link>
      <div className="auth-pitch"><div className="eyebrow"><span className="eyebrow-pulse" /> YOUR MONEY, IN THE KNOW</div><h1>Protection that<br />keeps you in<br /><span>control.</span></h1><p>Transparent monitoring to help you spot what matters and act with confidence.</p><div className="auth-quote"><span>“</span><p>Clarity is the first step to confidence. FundGuard makes every alert make sense.</p></div></div>
      <small className="auth-aside-footer">PROBLEM 29 · SRM TRP ENGINEERING COLLEGE</small>
    </div>
    <main className="auth-main"><div className="auth-form-wrap">
      <div className="auth-form-heading"><span className="section-kicker">{register ? "GET STARTED" : "WELCOME BACK"}</span><h2>{register ? "Create your account" : "Sign in to FundGuard"}</h2><p>{register ? "Set up your personal account in just a moment." : "Your financial overview is right where you left it."}</p></div>
      <form className="auth-form" onSubmit={submit}>
        {register && <label>Full name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Jamie Anand Paul J" required minLength={2} maxLength={80} autoComplete="name" /></label>}
        <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required autoComplete="email" /></label>
        <label>Password<div className="password-wrap"><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={register ? "At least 8 characters" : "Enter your password"} required minLength={register ? 8 : undefined} autoComplete={register ? "new-password" : "current-password"} /><button type="button" className="password-toggle" onClick={() => setShowPassword((value) => !value)} aria-label="Toggle password visibility">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
        {!register && <div className="auth-options"><label className="checkbox-label"><input type="checkbox" /> Remember me</label><span>Secure, encrypted login</span></div>}
        <button className="button button-primary auth-submit" disabled={loading}>{loading ? "Please wait…" : register ? "Create account" : "Sign in"} {!loading && <ArrowRight size={17} />}</button>
      </form>
      {!register && <div className="demo-credentials"><strong>Demo access</strong><span>Admin: admin@fundguard.local</span><span>User: jamie@fundguard.local</span><small>Password: FundGuard123!</small></div>}
      <p className="auth-switch">{register ? "Already have an account?" : "New to FundGuard?"} <Link to={register ? "/login" : "/register"}>{register ? "Sign in" : "Create an account"}</Link></p>
      <div className="auth-security"><ShieldCheck size={15} /> Protected with secure authentication</div>
    </div></main>
  </div>;
}
