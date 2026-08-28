import { useState } from 'react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

export default function ClarificationCard({
  clarification,
  conversation,
  onSubmitAnswer,
  loading = false,
}) {
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isA = clarification.target_speaker === 'participant_a';
  const speakerName = isA
    ? (conversation?.participant_a_name || 'Participant A')
    : (conversation?.participant_b_name || 'Participant B');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!answer.trim() || submitting || loading) return;
    setSubmitting(true);
    try {
      await onSubmitAnswer(clarification.id, answer.trim());
      setAnswer('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 bg-amber-50/80 rounded-xl border border-amber-300 shadow-sm space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5 uppercase tracking-wider">
          <span>❓</span>
          <span>Clarification Required</span>
        </span>
        <Badge variant={isA ? 'primary' : 'purple'} size="sm">
          Awaiting {speakerName}
        </Badge>
      </div>

      {/* Question */}
      <p className="text-sm font-semibold text-slate-900 leading-snug">
        {clarification.question}
      </p>

      {/* Answer Form */}
      {clarification.status === 'pending' ? (
        <form onSubmit={handleSubmit} className="space-y-2 pt-1">
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={submitting || loading}
            placeholder={`Type ${speakerName}'s clarification...`}
            className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={submitting || loading}
              disabled={!answer.trim()}
            >
              Submit Clarification
            </Button>
          </div>
        </form>
      ) : (
        <div className="p-2.5 bg-white/80 rounded-lg border border-amber-200 text-xs text-slate-700">
          <span className="font-semibold text-slate-900 block mb-0.5">Answer Recorded:</span>
          <span>{clarification.answer}</span>
        </div>
      )}
    </div>
  );
}
