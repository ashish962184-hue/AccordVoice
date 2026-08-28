import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

export default function DashboardPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [stats, setStats] = useState({ totalConversations: 0, verifiedAgreements: 0, pendingClarifications: 0, unresolved: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [convoRes, statsRes] = await Promise.all([
        api.get('/conversations'),
        api.get('/dashboard/stats'),
      ]);
      setConversations(convoRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }

  const statusBadge = (status) => {
    const map = {
      verified: { cls: 'badge-success', label: '✅ Verified' },
      draft: { cls: 'badge-info', label: '📋 Draft' },
      awaiting_confirmation: { cls: 'badge-warning', label: '⏳ Awaiting' },
      rejected: { cls: 'badge-danger', label: '❌ Rejected' },
      pending: { cls: 'badge-neutral', label: '⏸️ Pending' },
    };
    const s = map[status] || map.pending;
    return <span className={`badge ${s.cls}`}>{s.label}</span>;
  };

  const statCards = [
    { label: 'Conversations', value: stats.totalConversations, icon: '💬' },
    { label: 'Verified', value: stats.verifiedAgreements, icon: '✅' },
    { label: 'Active', value: stats.pendingClarifications, icon: '⏳' },
    { label: 'Unresolved', value: stats.unresolved, icon: '⚠️' },
  ];

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Top Bar */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', borderBottom: '1px solid var(--color-border)' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', fontWeight: '700', color: 'var(--color-text)' }}>
          🎙️ AccordVoice
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>{user?.email}</span>
          <button className="btn btn-secondary btn-sm" onClick={() => { signOut(); navigate('/'); }}>Sign Out</button>
        </div>
      </nav>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem' }}>
        {/* Welcome */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.25rem' }}>Welcome back 👋</h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Manage your conversations and agreements</p>
          </div>
          <Link to="/conversations/new" className="btn btn-primary">+ New Conversation</Link>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {statCards.map((s) => (
            <div key={s.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ fontSize: '1.5rem' }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>{s.value}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Conversation List */}
        <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>Recent Conversations</h2>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : conversations.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🎙️</div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>No conversations yet</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Start your first conversation to detect conflicts and build verified agreements.
            </p>
            <Link to="/conversations/new" className="btn btn-primary">Create Your First Conversation</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {conversations.map((c) => (
              <Link key={c.id} to={`/conversations/${c.id}`} className="card" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{c.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <span>{c.participant_a_name} ({c.participant_a_language})</span>
                    <span>↔</span>
                    <span>{c.participant_b_name} ({c.participant_b_language})</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {statusBadge(c.agreement_status)}
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                    {new Date(c.created_at).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
