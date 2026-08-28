import { useState, useRef, useCallback } from 'react';

/**
 * useVoiceRecorder Hook
 * Robust recording state machine with dynamic format detection,
 * stream cleanup, timer, and atomic Blob generation.
 */
export function useVoiceRecorder({ onRecordingComplete, onError }) {
  const [state, setState] = useState('IDLE'); // IDLE, REQUESTING_PERMISSION, RECORDING, STOPPING, PROCESSING, ERROR
  const [duration, setDuration] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  // Dynamic MIME type selection
  const getSupportedMimeType = () => {
    if (typeof MediaRecorder === 'undefined') return '';
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
      'audio/ogg',
      'audio/wav',
    ];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return '';
  };

  const startRecording = useCallback(async () => {
    try {
      setState('REQUESTING_PERMISSION');
      setErrorMessage('');

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone recording is not supported in this browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;
      const mimeType = getSupportedMimeType();
      const options = mimeType ? { mimeType } : {};

      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      setDuration(0);

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        clearInterval(timerRef.current);
        const actualMime = recorder.mimeType || mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: actualMime });

        // Clean up stream tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        if (blob.size === 0) {
          setState('ERROR');
          setErrorMessage("We couldn't hear any speech clearly. Please try again.");
          if (onError) onError(new Error('Empty audio recording.'));
          return;
        }

        setState('IDLE');
        if (onRecordingComplete) {
          onRecordingComplete(blob, actualMime);
        }
      };

      recorder.onerror = (err) => {
        console.error('[VoiceRecorder] Error:', err);
        cleanup();
        setState('ERROR');
        setErrorMessage('Recording failed. Please try again.');
        if (onError) onError(err);
      };

      recorder.start(100); // 100ms chunk interval
      setState('RECORDING');

      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      cleanup();
      setState('ERROR');
      let msg = 'Microphone access is required for voice input.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Microphone permission was denied. Please allow microphone access in your browser settings.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No microphone was found on this device.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        msg = 'Microphone is already in use by another application.';
      }
      setErrorMessage(msg);
      if (onError) onError(err);
    }
  }, [onRecordingComplete, onError]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      setState('STOPPING');
      mediaRecorderRef.current.stop();
    }
  }, []);

  const cancelRecording = useCallback(() => {
    cleanup();
    setState('IDLE');
    setDuration(0);
    setErrorMessage('');
  }, []);

  const cleanup = () => {
    clearInterval(timerRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
  };

  return {
    state,
    duration,
    errorMessage,
    isRecording: state === 'RECORDING',
    isProcessing: state === 'PROCESSING' || state === 'STOPPING',
    startRecording,
    stopRecording,
    cancelRecording,
  };
}
