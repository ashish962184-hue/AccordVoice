import React from 'react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

export default function ConfirmationPanel({
  agreement,
  conversation,
  onConfirm,
  onReject,
  loading = false,
}) {
  if (!agreement) return null;

  const participantAName = conversation?.participant_a_name || 'Participant A';
  const participantBName = conversation?.participant_b_name || 'Participant B';

  const aConfirmed = Boolean(agreement.participant_a_confirmed);
  const bConfirmed = Boolean(agreement.participant_b_confirmed);
  const isVerified = agreement.status === 'verified' || (aConfirmed && bConfirmed);

  const confirmedCount = (aConfirmed ? 1 : 0) + (bConfirmed ? 1 : 0);

  return (
    <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-slate-900">
            Participant Confirmation
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Explicit confirmation from both parties is required.
          </p>
        </div>
        <Badge
          variant={isVerified ? 'success' : confirmedCount > 0 ? 'warning' : 'neutral'}
          size="md"
        >
          {confirmedCount} of 2 Confirmed
        </Badge>
      </div>

      {/* Confirmation Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Participant A */}
        <div
          className={`p-3 rounded-lg border flex items-center justify-between ${
            aConfirmed
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}
        >
          <div>
            <span className="text-xs font-semibold block">{participantAName}</span>
            <span className="text-[11px] text-slate-500">
              {aConfirmed
                ? `✓ Confirmed ${agreement.participant_a_confirmed_at ? new Date(agreement.participant_a_confirmed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}`
                : '○ Awaiting confirmation'}
            </span>
          </div>
          {!aConfirmed && !isVerified && (
            <Button
              variant="primary"
              size="sm"
              loading={loading}
              onClick={() => onConfirm('participant_a')}
            >
              Confirm
            </Button>
          )}
          {aConfirmed && <span className="text-base">✅</span>}
        </div>

        {/* Participant B */}
        <div
          className={`p-3 rounded-lg border flex items-center justify-between ${
            bConfirmed
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}
        >
          <div>
            <span className="text-xs font-semibold block">{participantBName}</span>
            <span className="text-[11px] text-slate-500">
              {bConfirmed
                ? `✓ Confirmed ${agreement.participant_b_confirmed_at ? new Date(agreement.participant_b_confirmed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}`
                : '○ Awaiting confirmation'}
            </span>
          </div>
          {!bConfirmed && !isVerified && (
            <Button
              variant="primary"
              size="sm"
              loading={loading}
              onClick={() => onConfirm('participant_b')}
            >
              Confirm
            </Button>
          )}
          {bConfirmed && <span className="text-base">✅</span>}
        </div>
      </div>

      {/* Verified Banner */}
      {isVerified && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-center space-y-1">
          <div className="text-lg">🎉</div>
          <h5 className="text-sm font-bold text-emerald-900">
            Agreement Mutually Verified!
          </h5>
          <p className="text-xs text-emerald-700">
            Both parties have explicitly verified the terms. This conversation record is finalized.
          </p>
        </div>
      )}

      {/* Rejection / Request Changes */}
      {!isVerified && (
        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            disabled={loading}
            onClick={() => onReject('participant_a')}
            className="text-xs text-slate-400 hover:text-rose-600 font-medium transition-colors"
          >
            Reject / Request Changes
          </button>
        </div>
      )}
    </div>
  );
}
