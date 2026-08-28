import React from 'react';

export default function VerificationTimeline({
  turnsCount = 0,
  claimsCount = 0,
  conflictsCount = 0,
  clarificationsCount = 0,
  agreement = null,
}) {
  const isDrafted = Boolean(agreement);
  const aConfirmed = Boolean(agreement?.participant_a_confirmed);
  const bConfirmed = Boolean(agreement?.participant_b_confirmed);
  const isVerified = agreement?.status === 'verified' || (aConfirmed && bConfirmed);

  const timelineSteps = [
    { label: 'Conversation Started', done: turnsCount > 0 },
    { label: 'Claims Extracted', done: claimsCount > 0 },
    { label: 'Conflict Analysis', done: conflictsCount > 0 || claimsCount >= 2 },
    { label: 'Clarifications Resolved', done: clarificationsCount > 0 || conflictsCount === 0 },
    { label: 'Agreement Drafted', done: isDrafted },
    { label: 'Participant A Confirmed', done: aConfirmed },
    { label: 'Participant B Confirmed', done: bConfirmed },
    { label: 'Agreement Verified', done: isVerified },
  ];

  return (
    <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80">
      <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
        Mediation & Verification Audit Trail
      </h5>
      <div className="space-y-2">
        {timelineSteps.map((step, idx) => (
          <div key={idx} className="flex items-center gap-2.5 text-xs">
            <span
              className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step.done
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-200 text-slate-400'
              }`}
            >
              {step.done ? '✓' : '○'}
            </span>
            <span className={step.done ? 'font-medium text-slate-800' : 'text-slate-400'}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
