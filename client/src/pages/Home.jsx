import { ArrowRight, ArrowUpRight, BellRing, Check, ChevronRight, CircleDollarSign, LockKeyhole, Radar, ShieldAlert, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  { icon: Radar, title: "Intelligent monitoring", text: "Every transaction is checked against clear, explainable risk signals in real time." },
  { icon: BellRing, title: "Alerts that matter", text: "Instant alerts surface unusual activity to the account owner and review team." },
  { icon: LockKeyhole, title: "Built for trust", text: "Role-based access and secure password handling keep account data protected." }
];

export default function Home() {
  return <div className="landing">
    <nav className="landing-nav"><Link to="/" className="brand"><span className="brand-mark"><ShieldCheck size={21} /></span><span>fund<span>guard</span></span></Link>
      <div className="landing-nav-links"><a href="#features">Platform</a><a href="#how">How it works</a><Link to="/about">About project</Link></div>
      <div className="landing-actions"><Link to="/login" className="login-link">Log in</Link><Link to="/register" className="button button-primary button-small">Get started <ArrowRight size={15} /></Link></div>
    </nav>
    <section className="hero-section">
      <div className="hero-content">
        <div className="eyebrow"><span className="eyebrow-pulse" /> FINANCIAL ACTIVITY, UNDER CONTROL</div>
        <h1>Confidence in every<br />transaction<span className="hero-period">.</span></h1>
        <p className="hero-copy">A smarter way to monitor your funds. FundGuard spots unusual activity, explains the risk, and alerts you the moment it matters.</p>
        <div className="hero-actions"><Link to="/register" className="button button-primary">Start protecting your funds <ArrowRight size={17} /></Link><a className="text-link" href="#how">See how it works <ChevronRight size={16} /></a></div>
        <div className="hero-proof"><div className="proof-avatars"><span>J</span><span>J</span><span>F</span></div><div><strong>Built for clarity, not complexity</strong><small>Transparent risk signals. Actionable alerts.</small></div></div>
      </div>
      <div className="hero-visual">
        <div className="visual-glow" />
        <div className="dashboard-preview">
          <div className="preview-top"><div><div className="preview-kicker">TOTAL BALANCE</div><div className="preview-balance">₹ 84,290<span>.50</span></div></div><span className="preview-month">This month⌄</span></div>
          <div className="preview-chart"><div className="chart-lines"><i /><i /><i /><i /></div><svg viewBox="0 0 520 150" preserveAspectRatio="none" aria-label="Illustrative spending trend"><defs><linearGradient id="area" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#31b9a2" stopOpacity=".24" /><stop offset="100%" stopColor="#31b9a2" stopOpacity="0" /></linearGradient></defs><path d="M0,120 C35,105 43,110 70,87 S114,113 148,87 S190,77 220,92 S265,49 295,64 S330,80 363,45 S405,60 434,35 S480,60 520,12 L520,150 L0,150 Z" fill="url(#area)" /><path d="M0,120 C35,105 43,110 70,87 S114,113 148,87 S190,77 220,92 S265,49 295,64 S330,80 363,45 S405,60 434,35 S480,60 520,12" fill="none" stroke="#36bda8" strokeWidth="3" vectorEffect="non-scaling-stroke" /></svg></div>
          <div className="preview-legend"><span>01 May</span><span>08 May</span><span>15 May</span><span>22 May</span><span>Today</span></div>
          <div className="preview-divider" /><div className="preview-row"><div className="preview-transaction-icon"><ArrowUpRight size={17} /></div><div className="preview-txn-name"><strong>MetroMart Online</strong><small>Shopping · Today, 10:42 AM</small></div><strong className="preview-amount">− ₹2,450.00</strong><span className="preview-safe"><Check size={12} /> Safe</span></div>
          <div className="floating-alert"><span className="floating-alert-icon"><ShieldAlert size={18} /></span><div><strong>Unusual activity detected</strong><small>New device · Needs your attention</small></div><span className="alert-live" /></div>
        </div>
        <div className="visual-caption"><span><span className="online-dot" /> LIVE RISK MONITORING</span><span>01 / 04</span></div>
      </div>
    </section>
    <section className="trust-strip"><span>MADE FOR MORE CONFIDENT FINANCIAL DECISIONS</span><div><span><ShieldCheck size={16} /> Explainable by design</span><span><Zap size={16} /> Real-time alerts</span><span><CircleDollarSign size={16} /> Your funds, in focus</span></div></section>
    <section className="features-section" id="features"><div className="section-heading"><span className="section-kicker">A CLEARER PICTURE</span><h2>Financial security, made<br />refreshingly simple.</h2><p>Know what is happening with your money and why it matters.</p></div><div className="feature-grid">{features.map(({ icon: Icon, title, text }, index) => <article className="feature-card" key={title}><span className="feature-icon"><Icon size={21} /></span><span className="feature-number">0{index + 1}</span><h3>{title}</h3><p>{text}</p><a href="#how">Explore feature <ArrowRight size={15} /></a></article>)}</div></section>
    <section className="how-section" id="how"><div><span className="section-kicker">HOW FUNDGUARD WORKS</span><h2>From transaction<br />to peace of mind.</h2><p>One straightforward flow. No black boxes, no guesswork.</p><Link to="/register" className="button button-primary">Explore the platform <ArrowRight size={16} /></Link></div><div className="steps-list"><div className="step"><span>01</span><div><h3>Record your activity</h3><p>Add a transaction with the details that give it context.</p></div><Sparkles size={19} /></div><div className="step"><span>02</span><div><h3>Check the signals</h3><p>Rules compare amount, activity pace, time, location, and device.</p></div><Radar size={19} /></div><div className="step"><span>03</span><div><h3>Get an instant alert</h3><p>See why activity was flagged and review it in one place.</p></div><BellRing size={19} /></div></div></section>
    <footer className="landing-footer"><Link to="/" className="brand"><span className="brand-mark"><ShieldCheck size={18} /></span><span>fund<span>guard</span></span></Link><span>Problem 29 · SRM TRP Engineering College, Tiruchirappalli</span><Link to="/about">Project details <ArrowRight size={14} /></Link></footer>
  </div>;
}
