import { useState } from 'react';
import { useVoiceRecorder } from '../../hooks/useVoiceRecorder';
import Button from '../ui/Button';

export default function VoiceRecorder({
  conversationId,
  activeSpeaker = 'participant_a',
  speakerName = 'Participant A',
  language = 'en',
  onTurnAdded,
  onUploadAudio,
  onSubmitText,
  disabled = false,
}) {
  const [textInput, setTextInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleRecordingComplete = async (audioBlob, mimeType) => {
    if (!audioBlob || audioBlob.size === 0) return;
    setIsSubmitting(true);
    setLocalError('');
    try {
      if (onUploadAudio) {
        await onUploadAudio(audioBlob, mimeType);
      }
    } catch (err) {
      setLocalError(err.message || 'Failed to upload and transcribe audio.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleError = (err) => {
    setLocalError(err.message || 'Voice recording failed.');
  };

  const {
    state,
    duration,
    errorMessage,
    isRecording,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useVoiceRecorder({
    onRecordingComplete: handleRecordingComplete,
    onError: handleError,
  });

  const handleTextSubmit = async (e) => {
    e?.preventDefault();
    if (!textInput.trim() || isSubmitting || disabled) return;
    setIsSubmitting(true);
    setLocalError('');
    try {
      if (onSubmitText) {
        await onSubmitText(textInput.trim());
        setTextInput('');
      }
    } catch (err) {
      setLocalError(err.message || 'Failed to send text message.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayError = localError || errorMessage;

  return (
    <div className="bg-white border-t border-slate-200/80 p-4 space-y-3">
      {/* Error notification */}
      {displayError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{displayError}</span>
          </div>
          <button
            onClick={() => setLocalError('')}
            className="text-rose-400 hover:text-rose-700 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Recording in progress */}
      {isRecording ? (
        <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <span className="w-3.5 h-3.5 rounded-full bg-rose-600 animate-ping" />
            <div>
              <span className="text-sm font-semibold text-rose-900 block">
                Recording as {speakerName}...
              </span>
              <span className="text-xs text-rose-600 font-mono font-medium">
                {formatDuration(duration)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={cancelRecording}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={stopRecording}
              icon="⏹"
            >
              Done & Transcribe
            </Button>
          </div>
        </div>
      ) : isSubmitting ? (
        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-center gap-3 text-indigo-700 text-sm font-medium">
          <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Processing voice audio & transcribing via Gemini AI...</span>
        </div>
      ) : (
        /* Normal State: Voice Button + Text Input */
        <form onSubmit={handleTextSubmit} className="flex items-center gap-2">
          {/* Record Button */}
          <button
            type="button"
            disabled={disabled || isSubmitting}
            onClick={startRecording}
            title={`Record voice input as ${speakerName}`}
            className="flex-shrink-0 w-10 h-10 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white flex items-center justify-center text-lg transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🎙️
          </button>

          {/* Text Input Fallback */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              disabled={disabled || isSubmitting}
              placeholder={`Type what ${speakerName} said...`}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300/80 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all disabled:opacity-50"
            />
          </div>

          {/* Send Text Button */}
          <Button
            type="submit"
            variant="secondary"
            size="md"
            disabled={!textInput.trim() || disabled || isSubmitting}
            className="flex-shrink-0"
          >
            Send
          </Button>
        </form>
      )}
    </div>
  );
}
