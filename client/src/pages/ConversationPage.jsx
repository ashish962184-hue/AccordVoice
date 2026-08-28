import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';
import { CONVERSATION_STATES, SUPPORTED_LANGUAGES } from '../utils/constants';

export default function ConversationPage() {
  const { id } = useParams();
  const [conversation, setConversation] = useState(null);
  const [turns, setTurns] = useState([]);
  const [claims, setClaims] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [clarifications, setClarifications] = useState([]);
  const [agreement, setAgreement] = useState(null);
  const [convState, setConvState] = useState('LISTENING');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeSpeaker, setActiveSpeaker] = useState('participant_a');
  const [textInput, setTextInput] = useState('');
  const [clarAnswer, setClarAnswer] = useState('');
  const [error, setError] = useState('');

  // Voice recording
  const [recording, setRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [micAllowed, setMicAllowed] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const transcriptEndRef = useRef(null);

  // Load conversation data
  const loadData = useCallback(async () => {
    try {
      const [convoRes, turnsRes, claimsRes, conflictsRes, clarsRes] = await Promise.all([
        api.get(`/conversations/${id}`),
        api.get(`/conversations/${id}/turns`),
        api.get(`/conversations/${id}/claims`),
        api.get(`/conversations/${id}/conflicts`),
        api.get(`/conversations/${id}/clarifications`),
      ]);
      setConversation(convoRes.data);
      setTurns(turnsRes.data);
      setClaims(claimsRes.data);
      setConflicts(conflictsRes.data);
      setClarifications(clarsRes.data);

      // Try to load agreement
      try {
        const agrRes = await api.get(`/conversations/${id}/agreement`);
        setAgreement(agrRes.data);
      } catch { setAgreement(null); }

      // Determine state
      const openConflicts = conflictsRes.data.filter((c) => c.status === 'open');
      const pendingClars = clarsRes.data.filter((c) => c.status === 'pending');
      if (convoRes.data.agreement_status === 'verified') setConvState('VERIFIED');
      else if (convoRes.data.agreement_status === 'rejected') setConvState('REJECTED');
      else if (convoRes.data.agreement_status === 'awaiting_confirmation') setConvState('AWAITING_CONFIRMATION');
      else if (convoRes.data.agreement_status === 'draft') setConvState('AGREEMENT_DRAFTED');
      else if (pendingClars.length > 0) setConvState('CLARIFICATION_REQUIRED');
      else if (openConflicts.length > 0) setConvState('CONFLICT_DETECTED');
      else if (turnsRes.data.length > 0) setConvState('UNDERSTANDING');
      else setConvState('LISTENING');
    } catch (err) {
      setError('Failed to load conversation.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [turns]);

  // ─── Voice Recording ───
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicAllowed(true);
      const mediaRecorder = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      setRecordingDuration(0);

      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mediaRecorder.start(100);
      setRecording(true);
      timerRef.current = setInterval(() => setRecordingDuration((d) => d + 1), 1000);
    } catch {
      setMicAllowed(false);
      setError('Microphone access denied. Please allow microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      setRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const submitRecording = async () => {
    if (chunksRef.current.length === 0) return;
    setProcessing(true);
    setError('');
    try {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('audio', blob, 'recording.webm');
      formData.append('speaker', activeSpeaker);
      formData.append('language', activeSpeaker === 'participant_a' ? conversation.participant_a_language : conversation.participant_b_language);

      await api.post(`/conversations/${id}/audio`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      chunksRef.current = [];
      setRecordingDuration(0);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Audio processing failed.');
    } finally {
      setProcessing(false);
    }
  };

  // ─── Text Input ───
  const submitText = async () => {
    if (!textInput.trim()) return;
    setProcessing(true);
    setError('');
    try {
      await api.post(`/conversations/${id}/turns`, {
        speaker: activeSpeaker,
        originalText: textInput.trim(),
        language: activeSpeaker === 'participant_a' ? conversation.participant_a_language : conversation.participant_b_language,
      });
      setTextInput('');
      await loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add turn.');
    } finally {
      setProcessing(false);
    }
  };

  // ─── Analyze ───
  const runAnalysis = async () => {
    setAnalyzing(true);
    setError('');
    try {
      const res = await api.post(`/conversations/${id}/analyze`);
      setClaims(res.data.claims);
      setConflicts(res.data.conflicts);
      if (res.data.state) setConvState(res.data.state.state);

      // Auto-generate clarifications for open conflicts
      for (const conflict of res.data.conflicts) {
        if (conflict.status === 'open') {
          try {
            await api.post(`/conversations/${id}/clarifications`, { conflictId: conflict.id });
          } catch { /* clarification already exists or generation failed */ }
        }
      }
      await loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Analysis failed.');
    } finally {
      setAnalyzing(false);
    }
  };

  // ─── Answer Clarification ───
  const submitClarAnswer = async (clarId) => {
    if (!clarAnswer.trim()) return;
    setProcessing(true);
    try {
      await api.post(`/conversations/${id}/clarifications/${clarId}/answer`, {
        answer: clarAnswer.trim(),
        speaker: activeSpeaker,
      });
      setClarAnswer('');
      await loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit answer.');
    } finally {
      setProcessing(false);
    }
  };

  // ─── Agreement ───
  const generateAgreement = async () => {
    setProcessing(true);
    try {
      const res = await api.post(`/conversations/${id}/agreement/generate`);
      setAgreement(res.data);
      setConvState('AGREEMENT_DRAFTED');
      await loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Agreement generation failed.');
    } finally {
      setProcessing(false);
    }
  };

  const confirmAgreement = async (participant) => {
    setProcessing(true);
    try {
      const res = await api.post(`/conversations/${id}/agreement/confirm`, { participant });
      setAgreement(res.data);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Confirmation failed.');
    } finally {
      setProcessing(false);
    }
  };

  const rejectAgreement = async (participant) => {
    setProcessing(true);
    try {
      await api.post(`/conversations/${id}/agreement/reject`, { participant });
      await loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Rejection failed.');
    } finally {
      setProcessing(false);
    }
  };

  // ─── TTS ───
  const playAgreement = async () => {
    try {
      const res = await api.post(`/conversations/${id}/tts`, { language: conversation.participant_a_language });
      const utterance = new SpeechSynthesisUtterance(res.data.text);
      utterance.lang = res.data.language;
      speechSynthesis.speak(utterance);
    } catch {
      setError('Text-to-speech failed.');
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}><div className="spinner" style={{ width: '2rem', height: '2rem' }} /></div>;
  }

  if (!conversation) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}>Conversation not found. <Link to="/dashboard">Go back</Link></div>;
  }

  const stateInfo = CONVERSATION_STATES[convState] || CONVERSATION_STATES.LISTENING;
  const openConflicts = conflicts.filter((c) => c.status === 'open');
  const pendingClars = clarifications.filter((c) => c.status === 'pending');
  const canGenerateAgreement = openConflicts.length === 0 && claims.length > 0 && pendingClars.length === 0;

  const langLabel = (code) => SUPPORTED_LANGUAGES.find((l) => l.code === code)?.label || code;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/dashboard" style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>← Back</Link>
          <h1 style={{ fontSize: '1.125rem', fontWeight: '700' }}>{conversation.title}</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className={`badge badge-${stateInfo.color}`}>{stateInfo.icon} {stateInfo.label}</span>
          {agreement && <Link to={`/conversations/${id}/agreement`} className="btn btn-secondary btn-sm">View Agreement</Link>}
        </div>
      </div>

      {/* Participant bar */}
      <div style={{ padding: '0.5rem 1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: '1rem', fontSize: '0.8125rem', flexWrap: 'wrap' }}>
        <span><strong>A:</strong> {conversation.participant_a_name} ({langLabel(conversation.participant_a_language)})</span>
        <span>↔</span>
        <span><strong>B:</strong> {conversation.participant_b_name} ({langLabel(conversation.participant_b_language)})</span>
      </div>

      {/* Main workspace */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 380px', minHeight: 0 }}>
        {/* Left: Transcript */}
        <div style={{ borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, overflow: 'auto', padding: '1rem 1.5rem' }}>
            {turns.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎙️</div>
                <p>No turns yet. Record audio or type to begin.</p>
              </div>
            ) : (
              turns.map((turn) => {
                const isA = turn.speaker === 'participant_a';
                return (
                  <div key={turn.id} className="fade-in" style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', alignItems: isA ? 'flex-start' : 'flex-end' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <span className={`badge ${isA ? 'badge-info' : 'badge-warning'}`} style={{ fontSize: '0.625rem' }}>
                        {isA ? conversation.participant_a_name : conversation.participant_b_name}
                      </span>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-secondary)' }}>
                        {new Date(turn.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <div style={{
                      background: isA ? 'rgba(99,102,241,0.1)' : 'rgba(14,165,233,0.1)',
                      border: `1px solid ${isA ? 'rgba(99,102,241,0.2)' : 'rgba(14,165,233,0.2)'}`,
                      borderRadius: '0.75rem', padding: '0.75rem 1rem', maxWidth: '80%', fontSize: '0.875rem',
                    }}>
                      {turn.original_text}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={transcriptEndRef} />
          </div>
        </div>

        {/* Right: AI Intelligence Panel */}
        <div style={{ overflow: 'auto', padding: '1rem' }}>
          {/* Claims */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.8125rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Claims ({claims.length})
            </h3>
            {claims.length === 0 ? (
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>No claims extracted yet. Add conversation turns and analyze.</p>
            ) : (
              claims.map((claim) => (
                <div key={claim.id} style={{ background: 'var(--color-bg)', borderRadius: '0.5rem', padding: '0.625rem', marginBottom: '0.5rem', fontSize: '0.8125rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span className={`badge ${claim.speaker === 'participant_a' ? 'badge-info' : 'badge-warning'}`} style={{ fontSize: '0.5625rem' }}>
                      {claim.speaker === 'participant_a' ? conversation.participant_a_name : conversation.participant_b_name}
                    </span>
                    <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.6875rem' }}>
                      {Math.round((claim.confidence || 0.9) * 100)}%
                    </span>
                  </div>
                  <div><strong>{claim.subject}</strong>.{claim.attribute} = {JSON.stringify(claim.value_json?.value || claim.value_json)} {claim.value_json?.unit || ''}</div>
                </div>
              ))
            )}
          </div>

          {/* Conflicts */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.8125rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Conflicts ({conflicts.length})
            </h3>
            {conflicts.map((conflict) => (
              <div key={conflict.id} style={{
                background: conflict.status === 'open' ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
                border: `1px solid ${conflict.status === 'open' ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`,
                borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '0.5rem', fontSize: '0.8125rem',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                  <span className={`badge ${conflict.status === 'open' ? 'badge-danger' : 'badge-success'}`}>
                    {conflict.status === 'open' ? '⚠️ Open' : '✅ Resolved'}
                  </span>
                  <span className={`badge badge-${conflict.severity === 'high' || conflict.severity === 'critical' ? 'danger' : 'warning'}`}>
                    {conflict.severity}
                  </span>
                </div>
                <p style={{ marginBottom: '0.375rem' }}>{conflict.description}</p>
                {conflict.clarification_question && conflict.status === 'open' && (
                  <p style={{ color: 'var(--color-secondary)', fontStyle: 'italic', fontSize: '0.75rem' }}>
                    💡 {conflict.clarification_question}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Clarifications */}
          {pendingClars.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '0.8125rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--color-warning)', textTransform: 'uppercase' }}>
                ❓ Clarification Needed
              </h3>
              {pendingClars.map((clar) => (
                <div key={clar.id} style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '0.5rem' }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.75rem' }}>{clar.question}</p>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input className="input" style={{ flex: 1 }} placeholder="Type your answer..." value={clarAnswer} onChange={(e) => setClarAnswer(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && submitClarAnswer(clar.id)} />
                    <button className="btn btn-primary btn-sm" onClick={() => submitClarAnswer(clar.id)} disabled={processing || !clarAnswer.trim()}>
                      Answer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Agreement Preview */}
          {agreement && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '0.8125rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--color-success)', textTransform: 'uppercase' }}>
                📋 Agreement {agreement.status === 'verified' ? '✅' : ''}
              </h3>
              <div className="card" style={{ fontSize: '0.8125rem' }}>
                <p style={{ marginBottom: '0.75rem' }}>{agreement.summary}</p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                  <span className={`badge ${agreement.participant_a_confirmed ? 'badge-success' : 'badge-neutral'}`}>
                    {conversation.participant_a_name}: {agreement.participant_a_confirmed ? '✅ Confirmed' : '⏳ Pending'}
                  </span>
                  <span className={`badge ${agreement.participant_b_confirmed ? 'badge-success' : 'badge-neutral'}`}>
                    {conversation.participant_b_name}: {agreement.participant_b_confirmed ? '✅ Confirmed' : '⏳ Pending'}
                  </span>
                </div>
                {agreement.status !== 'verified' && (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {!agreement.participant_a_confirmed && (
                      <button className="btn btn-success btn-sm" onClick={() => confirmAgreement('participant_a')} disabled={processing}>
                        {conversation.participant_a_name} Confirms
                      </button>
                    )}
                    {!agreement.participant_b_confirmed && (
                      <button className="btn btn-success btn-sm" onClick={() => confirmAgreement('participant_b')} disabled={processing}>
                        {conversation.participant_b_name} Confirms
                      </button>
                    )}
                    <button className="btn btn-danger btn-sm" onClick={() => rejectAgreement(activeSpeaker)} disabled={processing}>
                      Reject
                    </button>
                  </div>
                )}
                {agreement.status === 'verified' && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button className="btn btn-secondary btn-sm" onClick={playAgreement}>🔊 Play Agreement</button>
                    <Link to={`/conversations/${id}/agreement`} className="btn btn-primary btn-sm">📄 Full View</Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button className="btn btn-primary" onClick={runAnalysis} disabled={analyzing || turns.length === 0}>
              {analyzing ? <><span className="spinner" /> Analyzing...</> : '🧠 Analyze Conversation'}
            </button>
            {canGenerateAgreement && (
              <button className="btn btn-success" onClick={generateAgreement} disabled={processing}>
                {processing ? <><span className="spinner" /> Generating...</> : '📋 Generate Agreement'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom: Input Controls */}
      <div style={{ borderTop: '1px solid var(--color-border)', padding: '0.75rem 1.5rem' }}>
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', marginBottom: '0.5rem', color: '#f87171', fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
            {error}
            <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}>✕</button>
          </div>
        )}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Speaker Selector */}
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button className={`btn btn-sm ${activeSpeaker === 'participant_a' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveSpeaker('participant_a')}>
              {conversation.participant_a_name}
            </button>
            <button className={`btn btn-sm ${activeSpeaker === 'participant_b' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveSpeaker('participant_b')}>
              {conversation.participant_b_name}
            </button>
          </div>

          {/* Voice Controls */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {!recording ? (
              <button className="btn btn-danger btn-sm" onClick={startRecording} disabled={processing}>
                🎙️ Record
              </button>
            ) : (
              <>
                <button className="btn btn-secondary btn-sm recording-pulse" onClick={stopRecording} style={{ background: '#ef4444', color: 'white' }}>
                  ⏹️ Stop ({recordingDuration}s)
                </button>
              </>
            )}
            {!recording && chunksRef.current.length > 0 && (
              <button className="btn btn-success btn-sm" onClick={submitRecording} disabled={processing}>
                {processing ? <span className="spinner" /> : '📤'} Submit Audio
              </button>
            )}
          </div>

          {/* Text Input */}
          <div style={{ flex: 1, display: 'flex', gap: '0.5rem' }}>
            <input className="input" value={textInput} onChange={(e) => setTextInput(e.target.value)}
              placeholder={`Type as ${activeSpeaker === 'participant_a' ? conversation.participant_a_name : conversation.participant_b_name}...`}
              onKeyDown={(e) => e.key === 'Enter' && submitText()} disabled={processing} />
            <button className="btn btn-primary btn-sm" onClick={submitText} disabled={processing || !textInput.trim()}>
              {processing ? <span className="spinner" /> : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
