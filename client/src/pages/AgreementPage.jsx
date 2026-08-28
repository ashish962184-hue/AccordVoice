import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';

export default function AgreementPage() {
  const { id } = useParams();
  const [conversation, setConversation] = useState(null);
  const [agreement, setAgreement] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [convoRes, agrRes] = await Promise.all([
          api.get(`/conversations/${id}`),
          api.get(`/conversations/${id}/agreement`),
        ]);
        setConversation(convoRes.data);
        setAgreement(agrRes.data);
      } catch {
        // no agreement
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handlePrint = () => window.print();

  const playAgreement = async () => {
    try {
      const res = await api.post(`/conversations/${id}/tts`, { language: conversation.participant_a_language });
      const utterance = new SpeechSynthesisUtterance(res.data.text);
      utterance.lang = res.data.language;
      speechSynthesis.speak(utterance);
    } catch { /* fallback is already visible as text */ }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" /></div>;
  if (!agreement) return <div style={{ textAlign: 'center', padding: '3rem' }}>No agreement found. <Link to={`/conversations/${id}`}>Go back</Link></div>;

  const agreementData = agreement.agreement_json || {};

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Header (hidden in print) */}
      <div className="no-print" style={{ padding: '1rem 2rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to={`/conversations/${id}`} style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>← Back to Conversation</Link>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={playAgreement}>🔊 Play</button>
          <button className="btn btn-primary btn-sm" onClick={handlePrint}>🖨️ Print / Export</button>
        </div>
      </div>

      {/* Agreement Document */}
      <div style={{ maxWidth: '700px', margin: '2rem auto', padding: '2rem' }}>
        <div className="card" style={{ padding: '2.5rem' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem', borderBottom: '2px solid var(--color-primary)', paddingBottom: '1.5rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-primary)', marginBottom: '0.25rem' }}>
              ACCORDVOICE AGREEMENT
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>
              Conversation-generated agreement record — not legal advice
            </p>
          </div>

          {/* Meta */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem', fontSize: '0.8125rem' }}>
            <div><strong>Title:</strong> {conversation?.title}</div>
            <div><strong>Date:</strong> {new Date(agreement.created_at).toLocaleDateString()}</div>
            <div><strong>Participant A:</strong> {conversation?.participant_a_name}</div>
            <div><strong>Participant B:</strong> {conversation?.participant_b_name}</div>
            <div><strong>Version:</strong> {agreement.version}</div>
            <div><strong>Status:</strong> <span className={`badge ${agreement.status === 'verified' ? 'badge-success' : 'badge-warning'}`}>{agreement.status.toUpperCase()}</span></div>
          </div>

          {/* Agreement Terms */}
          <h2 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
            Agreement Terms
          </h2>
          <div style={{ marginBottom: '2rem' }}>
            {Object.entries(agreementData).map(([key, value]) => (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid rgba(148,163,184,0.1)', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</span>
                <span style={{ fontWeight: '500' }}>
                  {typeof value === 'object' ? `${value.value || ''} ${value.unit || ''}`.trim() : String(value)}
                </span>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '0.5rem', padding: '1rem', marginBottom: '2rem', fontSize: '0.875rem' }}>
            <strong>Summary:</strong> {agreement.summary}
          </div>

          {/* Confirmation Status */}
          <h2 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
            Confirmations
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{conversation?.participant_a_name}</span>
              <span>{agreement.participant_a_confirmed ? `✅ Confirmed (${new Date(agreement.participant_a_confirmed_at).toLocaleString()})` : '⏳ Pending'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{conversation?.participant_b_name}</span>
              <span>{agreement.participant_b_confirmed ? `✅ Confirmed (${new Date(agreement.participant_b_confirmed_at).toLocaleString()})` : '⏳ Pending'}</span>
            </div>
          </div>

          {/* Events */}
          {agreement.events && agreement.events.length > 0 && (
            <>
              <h2 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                Audit Trail
              </h2>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                {agreement.events.map((ev) => (
                  <div key={ev.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.375rem 0', borderBottom: '1px solid rgba(148,163,184,0.05)' }}>
                    <span>{ev.event_type} by {ev.actor}</span>
                    <span>{new Date(ev.created_at).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Footer */}
          <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)', textAlign: 'center', fontSize: '0.6875rem', color: 'var(--color-text-secondary)' }}>
            <p>This document was generated by AccordVoice AI from a recorded conversation.</p>
            <p>It is a conversation record, not legal advice or a binding contract.</p>
          </div>
        </div>
      </div>

      <style>{`@media print { .no-print { display: none !important; } body { background: white; color: black; } .card { border: 1px solid #ccc; } }`}</style>
    </div>
  );
}
