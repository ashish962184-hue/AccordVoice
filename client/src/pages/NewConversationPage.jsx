import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { SUPPORTED_LANGUAGES, CATEGORIES, AGREEMENT_FIELDS } from '../utils/constants';

export default function NewConversationPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: '', category: '', purpose: '',
    participantA: { name: '', language: 'en', role: '' },
    participantB: { name: '', language: 'en', role: '' },
    expectedFields: [],
  });

  const update = (path, value) => {
    setForm((prev) => {
      const next = { ...prev };
      const keys = path.split('.');
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) {
        obj[keys[i]] = { ...obj[keys[i]] };
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const canProceed = () => {
    switch (step) {
      case 1: return form.title.trim() && form.category;
      case 2: return form.participantA.name.trim() && form.participantB.name.trim();
      case 3: return form.participantA.language && form.participantB.language;
      default: return true;
    }
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/conversations', form);
      navigate(`/conversations/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create conversation.');
      setLoading(false);
    }
  };

  const toggleField = (field) => {
    setForm((prev) => ({
      ...prev,
      expectedFields: prev.expectedFields.includes(field)
        ? prev.expectedFields.filter((f) => f !== field)
        : [...prev.expectedFields, field],
    }));
  };

  return (
    <div style={{ minHeight: '100vh', padding: '2rem' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* Progress */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} style={{ flex: 1, height: '4px', borderRadius: '2px', background: s <= step ? 'var(--color-primary)' : 'var(--color-border)', transition: 'background 0.3s' }} />
          ))}
        </div>

        <div className="card fade-in">
          {/* Step 1: Purpose */}
          {step === 1 && (
            <>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>What's this conversation about?</h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Give your conversation a title and category.</p>
              <div style={{ marginBottom: '1rem' }}>
                <label>Title</label>
                <input className="input" value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="e.g., Supply delivery negotiation" />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label>Category</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.5rem' }}>
                  {CATEGORIES.map((cat) => (
                    <button key={cat.value} className={`btn ${form.category === cat.value ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                      onClick={() => update('category', cat.value)} style={{ justifyContent: 'flex-start' }}>
                      {cat.icon} {cat.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label>Purpose (optional)</label>
                <input className="input" value={form.purpose} onChange={(e) => update('purpose', e.target.value)} placeholder="e.g., Agree on delivery quantity and date" />
              </div>
            </>
          )}

          {/* Step 2: Participants */}
          {step === 2 && (
            <>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem' }}>Who's participating?</h2>
              {['A', 'B'].map((p) => {
                const key = `participant${p}`;
                return (
                  <div key={p} style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--color-bg)', borderRadius: '0.5rem' }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem' }}>Participant {p}</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div>
                        <label>Name</label>
                        <input className="input" value={form[key].name} onChange={(e) => update(`${key}.name`, e.target.value)} placeholder={`Participant ${p} name`} />
                      </div>
                      <div>
                        <label>Role (optional)</label>
                        <input className="input" value={form[key].role} onChange={(e) => update(`${key}.role`, e.target.value)} placeholder="e.g., Buyer, Supplier" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* Step 3: Languages */}
          {step === 3 && (
            <>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem' }}>What languages will they speak?</h2>
              {['A', 'B'].map((p) => {
                const key = `participant${p}`;
                return (
                  <div key={p} style={{ marginBottom: '1.5rem' }}>
                    <label>{form[key].name || `Participant ${p}`}'s Language</label>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <button key={lang.code} className={`btn btn-sm ${form[key].language === lang.code ? 'btn-primary' : 'btn-secondary'}`}
                          onClick={() => update(`${key}.language`, lang.code)}>
                          {lang.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* Step 4: Expected Fields */}
          {step === 4 && (
            <>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>Expected agreement fields</h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Optional — helps AI focus on what matters. Leave empty to let AI detect everything.</p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {AGREEMENT_FIELDS.map((field) => (
                  <button key={field} className={`btn btn-sm ${form.expectedFields.includes(field) ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => toggleField(field)}>
                    {form.expectedFields.includes(field) ? '✓ ' : ''}{field}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Step 5: Review */}
          {step === 5 && (
            <>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem' }}>Review & Start</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
                <div><strong>Title:</strong> {form.title}</div>
                <div><strong>Category:</strong> {CATEGORIES.find((c) => c.value === form.category)?.label}</div>
                {form.purpose && <div><strong>Purpose:</strong> {form.purpose}</div>}
                <div><strong>Participant A:</strong> {form.participantA.name} ({SUPPORTED_LANGUAGES.find((l) => l.code === form.participantA.language)?.label})</div>
                <div><strong>Participant B:</strong> {form.participantB.name} ({SUPPORTED_LANGUAGES.find((l) => l.code === form.participantB.language)?.label})</div>
                {form.expectedFields.length > 0 && <div><strong>Fields:</strong> {form.expectedFields.join(', ')}</div>}
              </div>
            </>
          )}

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.5rem', padding: '0.75rem', marginTop: '1rem', color: '#f87171', fontSize: '0.8125rem' }}>
              {error}
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
            <button className="btn btn-secondary" onClick={() => step === 1 ? navigate('/dashboard') : setStep(step - 1)}>
              {step === 1 ? 'Cancel' : '← Back'}
            </button>
            {step < 5 ? (
              <button className="btn btn-primary" onClick={() => setStep(step + 1)} disabled={!canProceed()}>
                Next →
              </button>
            ) : (
              <button className="btn btn-success" onClick={handleSubmit} disabled={loading}>
                {loading ? <><span className="spinner" /> Creating...</> : '🎙️ Start Conversation'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
