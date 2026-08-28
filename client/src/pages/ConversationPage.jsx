import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import Button from '../components/ui/Button';
import { StatusBadge } from '../components/ui/Badge';
import TranscriptPanel from '../components/conversation/TranscriptPanel';
import ClaimPanel from '../components/conversation/ClaimPanel';
import ConflictPanel from '../components/conversation/ConflictPanel';
import ClarificationCard from '../components/conversation/ClarificationCard';
import ConfirmationPanel from '../components/agreement/ConfirmationPanel';
import VerificationTimeline from '../components/agreement/VerificationTimeline';
import VoiceRecorder from '../components/voice/VoiceRecorder';

export default function ConversationPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // State
  const [conversation, setConversation] = useState(null);
  const [turns, setTurns] = useState([]);
  const [claims, setClaims] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [clarifications, setClarifications] = useState([]);
  const [agreement, setAgreement] = useState(null);

  const [activeSpeaker, setActiveSpeaker] = useState('participant_a');
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('mediator'); // 'mediator', 'claims', 'agreement'

  const transcriptEndRef = useRef(null);

  // ─── Fetch All Data ───
  const loadData = useCallback(async () => {
    try {
      const [convRes, turnsRes, claimsRes, conflictsRes, clarifRes, agrRes] = await Promise.all([
        api.get(`/conversations/${id}`),
        api.get(`/conversations/${id}/turns`),
        api.get(`/conversations/${id}/claims`).catch(() => ({ data: { claims: [] } })),
        api.get(`/conversations/${id}/conflicts`).catch(() => ({ data: { conflicts: [] } })),
        api.get(`/conversations/${id}/clarifications`).catch(() => ({ data: { clarifications: [] } })),
        api.get(`/conversations/${id}/agreements`).catch(() => ({ data: { agreement: null } })),
      ]);

      setConversation(convRes.data.conversation);
      setTurns(turnsRes.data.turns || []);
      setClaims(claimsRes.data.claims || []);
      setConflicts(conflictsRes.data.conflicts || []);
      setClarifications(clarifRes.data.clarifications || []);
      setAgreement(agrRes.data.agreement || null);
    } catch (err) {
      console.error('[ConversationPage] Load error:', err);
      setError('Failed to load conversation details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns]);

  // ─── Voice Audio Upload ───
  const handleUploadAudio = async (audioBlob, mimeType) => {
    setError('');
    const speakerLang =
      activeSpeaker === 'participant_a'
        ? conversation?.participant_a_language || 'en'
        : conversation?.participant_b_language || 'en';

    const formData = new FormData();
    formData.append('audio', audioBlob, 'speech_recording.webm');
    formData.append('speaker', activeSpeaker);
    formData.append('language', speakerLang);

    await api.post(`/conversations/${id}/audio`, formData);
    await loadData();

    // Toggle active speaker automatically for seamless natural dialog
    setActiveSpeaker((prev) => (prev === 'participant_a' ? 'participant_b' : 'participant_a'));
  };

  // ─── Text Input Submit ───
  const handleSubmitText = async (text) => {
    setError('');
    const speakerLang =
      activeSpeaker === 'participant_a'
        ? conversation?.participant_a_language || 'en'
        : conversation?.participant_b_language || 'en';

    await api.post(`/conversations/${id}/turns`, {
      speaker: activeSpeaker,
      originalText: text,
      language: speakerLang,
    });
    await loadData();

    // Toggle active speaker
    setActiveSpeaker((prev) => (prev === 'participant_a' ? 'participant_b' : 'participant_a'));
  };

  // ─── Run AI Analysis (Extract Claims, Detect Conflicts, Update State) ───
  const handleAnalyze = async () => {
    if (turns.length === 0) {
      setError('Add some conversation turns before running AI analysis.');
      return;
    }
    setAnalyzing(true);
    setError('');
    try {
      await api.post(`/conversations/${id}/analysis`);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'AI analysis encountered an issue.');
    } finally {
      setAnalyzing(false);
    }
  };

  // ─── Clarification Response Submit ───
  const handleSubmitClarification = async (clarificationId, answer) => {
    setError('');
    try {
      await api.post(`/conversations/${id}/clarifications/${clarificationId}/resolve`, {
        answer,
      });
      await loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit clarification.');
    }
  };

  // ─── Generate Proposed Agreement ───
  const handleDraftAgreement = async () => {
    setDrafting(true);
    setError('');
    try {
      await api.post(`/conversations/${id}/agreements`);
      await loadData();
      setActiveTab('agreement');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate draft agreement.');
    } finally {
      setDrafting(false);
    }
  };

  // ─── Confirm Agreement ───
  const handleConfirm = async (participant) => {
    if (!agreement) return;
    setConfirming(true);
    setError('');
    try {
      await api.post(`/conversations/${id}/agreements/${agreement.id}/confirm`, {
        participant,
      });
      await loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to confirm agreement.');
    } finally {
      setConfirming(false);
    }
  };

  // ─── Reject Agreement ───
  const handleReject = async (participant) => {
    if (!agreement) return;
    setConfirming(true);
    setError('');
    try {
      await api.post(`/conversations/${id}/agreements/${agreement.id}/reject`, {
        participant,
        reason: 'Requested modification of terms.',
      });
      await loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to request changes.');
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Loading conversation workspace...</p>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-base font-bold text-slate-800">Conversation Not Found</h2>
        <Button variant="primary" size="sm" onClick={() => navigate('/dashboard')} className="mt-4">
          Return to Dashboard
        </Button>
      </div>
    );
  }

  const openConflictsCount = conflicts.filter((c) => c.status === 'open').length;
  const pendingClarifs = clarifications.filter((c) => c.status === 'pending');

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-screen bg-slate-50">
      {/* Top Header Bar */}
      <header className="bg-white border-b border-slate-200/80 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
            title="Back to dashboard"
          >
            ←
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
                {conversation.title}
              </h1>
              <StatusBadge state={conversation.state} size="sm" />
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span>{conversation.category || 'General'}</span>
              <span>•</span>
              <span className="text-indigo-700 font-medium">{conversation.participant_a_name} ({conversation.participant_a_language})</span>
              <span>&</span>
              <span className="text-purple-700 font-medium">{conversation.participant_b_name} ({conversation.participant_b_language})</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            loading={analyzing}
            onClick={handleAnalyze}
            icon="🧠"
          >
            AI Analyze
          </Button>

          {agreement ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(`/conversations/${id}/agreement`)}
              icon="📄"
            >
              View Document
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              loading={drafting}
              disabled={turns.length === 0 || openConflictsCount > 0}
              onClick={handleDraftAgreement}
              icon="📋"
            >
              Draft Agreement
            </Button>
          )}
        </div>
      </header>

      {/* Global Error Banner */}
      {error && (
        <div className="px-4 py-2 bg-rose-50 border-b border-rose-200 text-xs text-rose-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="font-bold text-rose-500 hover:text-rose-800">
            ✕
          </button>
        </div>
      )}

      {/* Split Workspace Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* LEFT PANE: LIVE CONVERSATION (Turns + Audio Recorder) */}
        <div className="flex-1 flex flex-col border-r border-slate-200/80 bg-white overflow-hidden">
          <TranscriptPanel
            turns={turns}
            conversation={conversation}
            claims={claims}
            activeSpeaker={activeSpeaker}
            onSpeakerChange={setActiveSpeaker}
            transcriptEndRef={transcriptEndRef}
          />

          {/* Docked Voice Recorder */}
          <VoiceRecorder
            conversationId={id}
            activeSpeaker={activeSpeaker}
            speakerName={
              activeSpeaker === 'participant_a'
                ? conversation.participant_a_name
                : conversation.participant_b_name
            }
            language={
              activeSpeaker === 'participant_a'
                ? conversation.participant_a_language
                : conversation.participant_b_language
            }
            onUploadAudio={handleUploadAudio}
            onSubmitText={handleSubmitText}
          />
        </div>

        {/* RIGHT PANE: AI MEDIATOR & AGREEMENT VERIFICATION */}
        <div className="w-full md:w-[420px] lg:w-[460px] bg-slate-50 flex flex-col overflow-hidden flex-shrink-0 border-t md:border-t-0">
          {/* Tabs */}
          <div className="flex border-b border-slate-200 bg-white px-4">
            <button
              onClick={() => setActiveTab('mediator')}
              className={`py-3 px-3 text-xs font-bold border-b-2 transition-colors ${
                activeTab === 'mediator'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              AI Mediator {openConflictsCount > 0 && <span className="ml-1 text-rose-600 font-extrabold">({openConflictsCount})</span>}
            </button>
            <button
              onClick={() => setActiveTab('claims')}
              className={`py-3 px-3 text-xs font-bold border-b-2 transition-colors ${
                activeTab === 'claims'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Extracted Claims ({claims.length})
            </button>
            <button
              onClick={() => setActiveTab('agreement')}
              className={`py-3 px-3 text-xs font-bold border-b-2 transition-colors ${
                activeTab === 'agreement'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Agreement {agreement && <span className="ml-1 text-emerald-600 font-extrabold">✓</span>}
            </button>
          </div>

          {/* Right Pane Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeTab === 'mediator' && (
              <div className="space-y-4">
                {/* Clarifications in progress */}
                {pendingClarifs.map((clarif) => (
                  <ClarificationCard
                    key={clarif.id}
                    clarification={clarif}
                    conversation={conversation}
                    onSubmitAnswer={handleSubmitClarification}
                  />
                ))}

                {/* Conflicts Panel */}
                <ConflictPanel
                  conflicts={conflicts}
                  claims={claims}
                  conversation={conversation}
                  onResolveConflict={handleAnalyze}
                />

                {/* Verification Confirmation if Agreement exists */}
                {agreement && (
                  <ConfirmationPanel
                    agreement={agreement}
                    conversation={conversation}
                    onConfirm={handleConfirm}
                    onReject={handleReject}
                    loading={confirming}
                  />
                )}

                {/* Audit Trail Timeline */}
                <VerificationTimeline
                  turnsCount={turns.length}
                  claimsCount={claims.length}
                  conflictsCount={conflicts.length}
                  clarificationsCount={clarifications.length}
                  agreement={agreement}
                />
              </div>
            )}

            {activeTab === 'claims' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Structured Commitments
                  </h4>
                  <span className="text-xs text-slate-400 font-mono">{claims.length} total</span>
                </div>
                <ClaimPanel claims={claims} conversation={conversation} />
              </div>
            )}

            {activeTab === 'agreement' && (
              <div className="space-y-4">
                {agreement ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                          Draft Agreement
                        </span>
                        <StatusBadge state={agreement.status === 'verified' ? 'VERIFIED' : 'AGREEMENT_DRAFTED'} size="sm" />
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-800 leading-relaxed font-mono">
                        {agreement.summary || 'Summary terms drafted.'}
                      </div>

                      {agreement.agreement_json && (
                        <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                          {Object.entries(agreement.agreement_json).map(([key, val]) => (
                            <div key={key} className="flex justify-between py-1 border-b border-slate-50">
                              <span className="font-medium text-slate-500 capitalize">{key.replace(/_/g, ' ')}:</span>
                              <span className="font-bold text-slate-900">
                                {typeof val === 'object' ? `${val.value} ${val.unit || ''}` : String(val)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <ConfirmationPanel
                      agreement={agreement}
                      conversation={conversation}
                      onConfirm={handleConfirm}
                      onReject={handleReject}
                      loading={confirming}
                    />

                    <div className="flex justify-center">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(`/conversations/${id}/agreement`)}
                        icon="🖨️"
                      >
                        Print Formal Certificate
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-200 bg-white">
                    <div className="text-3xl mb-2">📋</div>
                    <h4 className="text-xs font-bold text-slate-800 mb-1">
                      No Agreement Drafted Yet
                    </h4>
                    <p className="text-xs text-slate-500 mb-4 max-w-xs mx-auto">
                      Speak turns, extract claims, and resolve any detected conflicts to generate a formal agreement.
                    </p>
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={turns.length === 0 || openConflictsCount > 0}
                      loading={drafting}
                      onClick={handleDraftAgreement}
                    >
                      Generate Draft Agreement
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
