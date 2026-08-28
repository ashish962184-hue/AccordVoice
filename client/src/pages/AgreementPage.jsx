import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import Button from '../components/ui/Button';
import { StatusBadge } from '../components/ui/Badge';
import ConfirmationPanel from '../components/agreement/ConfirmationPanel';
import VerificationTimeline from '../components/agreement/VerificationTimeline';

export default function AgreementPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [conversation, setConversation] = useState(null);
  const [agreement, setAgreement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');

  const loadAgreementData = useCallback(async () => {
    try {
      setLoading(true);
      const [convRes, agrRes] = await Promise.all([
        api.get(`/conversations/${id}`),
        api.get(`/conversations/${id}/agreements`),
      ]);

      setConversation(convRes.data.conversation);
      setAgreement(agrRes.data.agreement || null);
    } catch (err) {
      console.error('[AgreementPage] Load error:', err);
      setError('Failed to load agreement document.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadAgreementData();
  }, [loadAgreementData]);

  const handleConfirm = async (participant) => {
    if (!agreement) return;
    setConfirming(true);
    try {
      await api.post(`/conversations/${id}/agreements/${agreement.id}/confirm`, {
        participant,
      });
      await loadAgreementData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to confirm agreement.');
    } finally {
      setConfirming(false);
    }
  };

  const handleReject = async (participant) => {
    if (!agreement) return;
    setConfirming(true);
    try {
      await api.post(`/conversations/${id}/agreements/${agreement.id}/reject`, {
        participant,
        reason: 'Requested modification of terms.',
      });
      await loadAgreementData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reject agreement.');
    } finally {
      setConfirming(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Loading agreement document...</p>
        </div>
      </div>
    );
  }

  if (!agreement) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4">
        <div className="text-4xl">📋</div>
        <h2 className="text-base font-bold text-slate-800">No Agreement Document Generated</h2>
        <p className="text-xs text-slate-500">
          Return to the conversation workspace to draft terms once participants have spoken.
        </p>
        <Button variant="primary" size="sm" onClick={() => navigate(`/conversations/${id}`)}>
          Back to Workspace
        </Button>
      </div>
    );
  }

  const isVerified =
    agreement.status === 'verified' ||
    (agreement.participant_a_confirmed && agreement.participant_b_confirmed);

  return (
    <div className="min-h-screen bg-slate-100/70 p-4 sm:p-6 lg:p-8">
      {/* Top Action Bar (hidden on print) */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate(`/conversations/${id}`)}
          icon="←"
        >
          Back to Workspace
        </Button>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handlePrint} icon="🖨️">
            Print Document
          </Button>
        </div>
      </div>

      {/* Main Document Paper Container */}
      <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-300/80 shadow-lg p-6 sm:p-10 space-y-8 print:shadow-none print:border-none print:p-0">
        {/* Certificate Header */}
        <div className="border-b-2 border-slate-900 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎙️</span>
              <span className="font-extrabold text-xl tracking-tight text-slate-900">
                AccordVoice
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block mt-1">
              Mutual Agreement Verification Record
            </span>
          </div>

          <div className="text-left sm:text-right">
            <StatusBadge state={isVerified ? 'VERIFIED' : 'AGREEMENT_DRAFTED'} size="md" />
            <span className="text-[11px] font-mono text-slate-400 block mt-1">
              Doc ID: {agreement.id?.slice(0, 8)} • Version 1.0
            </span>
          </div>
        </div>

        {/* Conversation Title & Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
          <div>
            <span className="text-slate-400 block uppercase tracking-wider font-semibold text-[10px]">
              Agreement Topic
            </span>
            <span className="font-bold text-slate-900 text-sm block mt-0.5">
              {conversation?.title}
            </span>
            <span className="text-slate-500 block mt-0.5">{conversation?.category}</span>
          </div>

          <div>
            <span className="text-slate-400 block uppercase tracking-wider font-semibold text-[10px]">
              Parties Involved
            </span>
            <div className="mt-0.5 font-medium text-slate-800">
              <div>Party A: <span className="font-bold">{conversation?.participant_a_name}</span> ({conversation?.participant_a_language})</div>
              <div>Party B: <span className="font-bold">{conversation?.participant_b_name}</span> ({conversation?.participant_b_language})</div>
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            1. Executive Agreement Summary
          </h3>
          <p className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-800 leading-relaxed font-serif">
            {agreement.summary || 'Summary not provided.'}
          </p>
        </div>

        {/* Structured Terms */}
        {agreement.agreement_json && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              2. Verified Terms & Conditions
            </h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="p-3">Clause / Dimension</th>
                    <th className="p-3">Agreed Term Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.entries(agreement.agreement_json).map(([key, val]) => (
                    <tr key={key}>
                      <td className="p-3 font-semibold text-slate-700 capitalize">
                        {key.replace(/_/g, ' ')}
                      </td>
                      <td className="p-3 font-bold text-slate-900">
                        {typeof val === 'object' ? `${val.value} ${val.unit || ''}` : String(val)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Participant Confirmation Status */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            3. Participant Verification Sign-Off
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className={`p-4 rounded-xl border ${agreement.participant_a_confirmed ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-slate-200'} text-xs space-y-1`}>
              <span className="font-bold text-slate-900 block text-sm">{conversation?.participant_a_name}</span>
              <span className="text-[11px] text-slate-500 block">Party A Signature</span>
              <div className="pt-2 font-mono text-xs">
                {agreement.participant_a_confirmed ? (
                  <span className="text-emerald-700 font-bold">✓ Confirmed explicitly on {new Date(agreement.participant_a_confirmed_at).toLocaleString()}</span>
                ) : (
                  <span className="text-amber-700 font-semibold">○ Awaiting explicit confirmation</span>
                )}
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${agreement.participant_b_confirmed ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-slate-200'} text-xs space-y-1`}>
              <span className="font-bold text-slate-900 block text-sm">{conversation?.participant_b_name}</span>
              <span className="text-[11px] text-slate-500 block">Party B Signature</span>
              <div className="pt-2 font-mono text-xs">
                {agreement.participant_b_confirmed ? (
                  <span className="text-emerald-700 font-bold">✓ Confirmed explicitly on {new Date(agreement.participant_b_confirmed_at).toLocaleString()}</span>
                ) : (
                  <span className="text-amber-700 font-semibold">○ Awaiting explicit confirmation</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Live Confirmation Action Form (hidden on print) */}
        <div className="print:hidden">
          <ConfirmationPanel
            agreement={agreement}
            conversation={conversation}
            onConfirm={handleConfirm}
            onReject={handleReject}
            loading={confirming}
          />
        </div>

        {/* Verification Audit Timeline */}
        <div className="pt-4 border-t border-slate-200">
          <VerificationTimeline
            turnsCount={5}
            claimsCount={4}
            conflictsCount={1}
            clarificationsCount={1}
            agreement={agreement}
          />
        </div>
      </div>
    </div>
  );
}
