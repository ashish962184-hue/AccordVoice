import React from 'react';
import Badge from '../ui/Badge';

export default function TranscriptPanel({
  turns = [],
  conversation,
  claims = [],
  activeSpeaker,
  onSpeakerChange,
  transcriptEndRef,
}) {
  const participantAName = conversation?.participant_a_name || 'Participant A';
  const participantBName = conversation?.participant_b_name || 'Participant B';

  const formatTime = (isoString) => {
    if (!isoString) return '';
    try {
      return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Find claims associated with a turn (if any)
  const getTurnClaims = (turnId, speaker) => {
    return claims.filter((c) => c.source_turn_id === turnId || c.speaker === speaker);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      {/* Speaker Selector Strip */}
      <div className="bg-white border-b border-slate-200/80 px-4 py-2.5 flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Active Speaker:
        </span>
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
          <button
            type="button"
            onClick={() => onSpeakerChange('participant_a')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeSpeaker === 'participant_a'
                ? 'bg-white text-indigo-700 font-semibold shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            👤 {participantAName} ({conversation?.participant_a_language || 'en'})
          </button>
          <button
            type="button"
            onClick={() => onSpeakerChange('participant_b')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeSpeaker === 'participant_b'
                ? 'bg-white text-purple-700 font-semibold shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            👤 {participantBName} ({conversation?.participant_b_language || 'en'})
          </button>
        </div>
      </div>

      {/* Transcript Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {turns.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 text-2xl flex items-center justify-center mx-auto mb-3">
              🎙️
            </div>
            <h4 className="text-sm font-semibold text-slate-800 mb-1">
              Conversation Ready
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Tap the microphone below to record speech or type a message as {activeSpeaker === 'participant_a' ? participantAName : participantBName}.
            </p>
          </div>
        ) : (
          turns.map((turn, index) => {
            const isA = turn.speaker === 'participant_a';
            const speakerName = isA ? participantAName : participantBName;
            const turnClaims = claims.filter((c) => c.speaker === turn.speaker);

            return (
              <div
                key={turn.id || index}
                className={`flex flex-col ${isA ? 'items-start' : 'items-end'}`}
              >
                {/* Speaker Header */}
                <div className="flex items-center gap-2 mb-1 px-1 text-xs">
                  <span className={`font-semibold ${isA ? 'text-indigo-700' : 'text-purple-700'}`}>
                    {speakerName}
                  </span>
                  {turn.language && (
                    <Badge variant={isA ? 'primary' : 'purple'} size="sm">
                      {turn.language.toUpperCase()}
                    </Badge>
                  )}
                  <span className="text-[11px] text-slate-400">
                    {formatTime(turn.created_at)}
                  </span>
                </div>

                {/* Speech Bubble */}
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm leading-relaxed ${
                    isA
                      ? 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-sm'
                      : 'bg-indigo-600 text-white rounded-tr-sm'
                  }`}
                >
                  <p>{turn.original_text}</p>
                </div>

                {/* Normalized Meaning Chips (if any) */}
                {turnClaims.length > 0 && index === turns.length - 1 && (
                  <div className={`mt-1.5 flex flex-wrap gap-1 ${isA ? 'justify-start' : 'justify-end'}`}>
                    {turnClaims.slice(-2).map((claim, ci) => (
                      <span
                        key={ci}
                        className="inline-flex items-center gap-1 text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200"
                      >
                        <span className="font-medium text-slate-500 capitalize">{claim.subject} {claim.attribute}:</span>
                        <span className="font-semibold text-slate-800">
                          {claim.value_json?.value || claim.value} {claim.value_json?.unit || claim.unit || ''}
                        </span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={transcriptEndRef} />
      </div>
    </div>
  );
}
