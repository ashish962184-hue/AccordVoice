import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { user } = useAuth();

  const steps = [
    { icon: '🎙️', title: 'Speak', desc: 'Participants share their understanding in any supported language.' },
    { icon: '🧠', title: 'Understand', desc: 'AI extracts claims about quantities, dates, prices, and responsibilities.' },
    { icon: '⚠️', title: 'Detect', desc: 'Semantic conflict detection identifies disagreements, not just different words.' },
    { icon: '❓', title: 'Clarify', desc: 'Targeted clarification questions resolve ambiguity without blame.' },
    { icon: '📋', title: 'Agree', desc: 'A structured agreement draft is generated from resolved claims.' },
    { icon: '✅', title: 'Verify', desc: 'Both participants explicitly confirm. Nothing is assumed.' },
  ];

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Nav */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', fontWeight: '700' }}>
          🎙️ AccordVoice
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {user ? (
            <Link to="/dashboard" className="btn btn-primary">Dashboard</Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary">Log In</Link>
              <Link to="/register" className="btn btn-primary">Get Started</Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: 'center', padding: '5rem 2rem 3rem', maxWidth: '800px', margin: '0 auto' }}>
        <div className="fade-in">
          <span className="badge badge-info" style={{ marginBottom: '1rem', display: 'inline-block' }}>AI-Powered Mediation</span>
          <h1 style={{ fontSize: '2.75rem', fontWeight: '800', lineHeight: '1.15', marginBottom: '1.5rem', background: 'linear-gradient(135deg, #6366f1, #0ea5e9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Make sure everyone leaves the conversation understanding the same thing.
          </h1>
          <p style={{ fontSize: '1.125rem', color: 'var(--color-text-secondary)', maxWidth: '600px', margin: '0 auto 2.5rem', lineHeight: '1.7' }}>
            AccordVoice listens for ambiguity, detects conflicting commitments, asks the right clarification questions, and creates a mutually confirmed agreement.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to={user ? '/dashboard' : '/register'} className="btn btn-primary btn-lg">
              Start a Conversation →
            </Link>
            <a href="#how-it-works" className="btn btn-secondary btn-lg">How It Works</a>
          </div>
        </div>
      </section>

      {/* Multilingual Badge */}
      <section style={{ textAlign: 'center', padding: '1rem 2rem 3rem' }}>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem', marginBottom: '0.75rem' }}>Supports multilingual conversations</p>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {['English', 'Hindi', 'Telugu', 'Tamil', 'Kannada', 'Malayalam', 'Marathi', 'Bengali'].map((lang) => (
            <span key={lang} className="badge badge-neutral">{lang}</span>
          ))}
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" style={{ padding: '4rem 2rem', maxWidth: '1000px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: '1.75rem', fontWeight: '700', marginBottom: '3rem' }}>How AccordVoice Works</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {steps.map((step, i) => (
            <div key={i} className="card fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{step.icon}</div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--color-primary)', marginRight: '0.5rem' }}>{i + 1}.</span>
                {step.title}
              </h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', lineHeight: '1.6' }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Demo Scenario */}
      <section style={{ padding: '4rem 2rem', maxWidth: '700px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: '700', marginBottom: '2rem' }}>See It In Action</h2>
        <div className="card" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <span className="badge badge-info">A</span>
              <p>"I will deliver <strong>50 units</strong> on <strong>Friday</strong>."</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <span className="badge badge-warning">B</span>
              <p>"We agreed on <strong>20 units</strong> on <strong>Monday</strong>."</p>
            </div>
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', display: 'flex', gap: '0.75rem' }}>
              <span className="badge badge-danger">⚠️</span>
              <p style={{ color: '#f87171' }}><strong>Conflict detected:</strong> quantity (50 vs 20) and delivery date (Friday vs Monday).</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <span className="badge badge-success">AI</span>
              <p>"Which quantity and delivery date should be included in the agreement?"</p>
            </div>
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', display: 'flex', gap: '0.75rem' }}>
              <span className="badge badge-success">✅</span>
              <p><strong>Resolved:</strong> 50 units on Monday — <em>both participants confirmed</em>.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--color-border)', padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '0.8125rem' }}>
        <p>AccordVoice — AI-powered conversational mediation. Not legal advice.</p>
      </footer>
    </div>
  );
}
