import React from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

export default function ConflictPanel({
  conflicts = [],
  claims = [],
  conversation,
  onResolveConflict,
}) {
  const participantAName = conversation?.participant_a_name || 'Participant A';
  const participantBName = conversation?.participant_b_name || 'Participant B';

  const openConflicts = conflicts.filter((c) => c.status === 'open');
  const resolvedConflicts = conflicts.filter((c) => c.status === 'resolved');

  if (conflicts.length === 0) {
    return (
      <div className="p-4 text-center rounded-lg bg-emerald-50/60 border border-emerald-100 text-xs text-emerald-700">
        ✅ No semantic conflicts detected. Both participants are aligned.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Neutral Mediation Banner */}
      {openConflicts.length > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200/90 rounded-xl flex items-start gap-2.5">
          <span className="text-base flex-shrink-0">⚖️</span>
          <div>
            <h5 className="text-xs font-bold text-amber-900">
              AccordVoice Will Not Choose For You
            </h5>
            <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
              We identified {openConflicts.length} disagreement{openConflicts.length > 1 ? 's' : ''} in commitments. Both parties must clarify to reach mutual agreement.
            </p>
          </div>
        </div>
      )}

      {/* Open Conflicts List */}
      {openConflicts.map((conflict, idx) => {
        const claimA = claims.find((c) => c.id === conflict.claim_a_id) || claims.find((c) => c.speaker === 'participant_a');
        const claimB = claims.find((c) => c.id === conflict.claim_b_id) || claims.find((c) => c.speaker === 'participant_b');

        const valA = claimA ? (claimA.value_json?.value ?? claimA.value) : 'Term A';
        const valB = claimB ? (claimB.value_json?.value ?? claimB.value) : 'Term B';

        return (
          <div
            key={conflict.id || idx}
            className="p-4 bg-white rounded-xl border-2 border-rose-200 shadow-sm"
          >
            {/* Conflict Header */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold text-rose-700 flex items-center gap-1.5 uppercase tracking-wider">
                <span>⚠️</span>
                <span>{conflict.conflict_type ? conflict.conflict_type.replace(/_/g, ' ') : 'Disagreement'}</span>
              </span>
              <Badge variant="danger" size="sm">
                Unresolved
              </Badge>
            </div>

            <p className="text-xs text-slate-700 mb-3 leading-relaxed">
              {conflict.description}
            </p>

            {/* Comparison Box (50 != 20) */}
            <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 mb-3">
              <div className="text-center p-2 bg-white rounded border border-slate-200">
                <span className="text-[10px] font-semibold text-indigo-700 block uppercase">
                  {participantAName}
                </span>
                <span className="text-sm font-extrabold text-slate-900 block mt-0.5">
                  {String(valA)}
                </span>
              </div>

              <div className="text-center p-2 bg-white rounded border border-slate-200">
                <span className="text-[10px] font-semibold text-purple-700 block uppercase">
                  {participantBName}
                </span>
                <span className="text-sm font-extrabold text-slate-900 block mt-0.5">
                  {String(valB)}
                </span>
              </div>
            </div>

            {/* Clarification Prompt */}
            {conflict.clarification_question && (
              <div className="p-2.5 bg-indigo-50/60 rounded-lg border border-indigo-100 text-xs text-indigo-900">
                <span className="font-semibold block text-[10px] text-indigo-600 uppercase tracking-wider mb-0.5">
                  Clarification Required:
                </span>
                {conflict.clarification_question}
              </div>
            )}
          </div>
        );
      })}

      {/* Resolved Conflicts Summary */}
      {resolvedConflicts.length > 0 && (
        <div className="pt-2 border-t border-slate-200 space-y-1.5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Resolved Disagreements ({resolvedConflicts.length})
          </span>
          {resolvedConflicts.map((c, i) => (
            <div
              key={c.id || i}
              className="p-2.5 bg-emerald-50/70 border border-emerald-200/70 rounded-lg flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2">
                <span>✅</span>
                <span className="font-medium text-emerald-900">{c.description}</span>
              </div>
              <span className="text-[10px] text-emerald-600 font-semibold uppercase">Resolved</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
