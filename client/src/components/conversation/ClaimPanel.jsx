import React from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

export default function ClaimPanel({ claims = [], conversation }) {
  const participantAName = conversation?.participant_a_name || 'Participant A';
  const participantBName = conversation?.participant_b_name || 'Participant B';

  if (claims.length === 0) {
    return (
      <div className="p-4 text-center rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-400">
        No claims extracted yet. Run AI analysis to identify actionable commitments.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {claims.map((claim, idx) => {
          const isA = claim.speaker === 'participant_a';
          const speakerName = isA ? participantAName : participantBName;
          const displayValue = claim.value_json?.value ?? claim.value;
          const displayUnit = claim.value_json?.unit ?? claim.unit ?? '';

          return (
            <div
              key={claim.id || idx}
              className="p-3 bg-white rounded-lg border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider capitalize truncate">
                  {claim.subject} · {claim.attribute}
                </span>
                <Badge variant={isA ? 'primary' : 'purple'} size="sm">
                  {speakerName}
                </Badge>
              </div>

              <div className="text-sm font-bold text-slate-900 mt-0.5">
                {typeof displayValue === 'object' ? JSON.stringify(displayValue) : String(displayValue)}
                {displayUnit ? ` ${displayUnit}` : ''}
              </div>

              {claim.confidence && (
                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Confidence</span>
                  <span>{Math.round(claim.confidence * 100)}%</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
