const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:5000/api';

async function testAudioUpload() {
  console.log('Testing Audio Upload & Gemini Transcription Pipeline...');

  // 1. Create a test conversation
  const convRes = await fetch(`${API_BASE}/conversations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer demo_user_token_golden',
    },
    body: JSON.stringify({
      title: 'Voice Recording Test',
      participantAName: 'Alice',
      participantBName: 'Bob',
      participantALanguage: 'en',
      participantBLanguage: 'en',
    }),
  });
  const { conversation } = await convRes.json();
  console.log(`Created test conversation ID: ${conversation.id}`);

  // 2. Create a dummy webm audio buffer (RIFF header / dummy opus audio chunk)
  const dummyAudio = Buffer.from('RIFF....WAVEfmt ....data....');

  const formData = new FormData();
  const blob = new Blob([dummyAudio], { type: 'audio/webm' });
  formData.append('audio', blob, 'test_speech.webm');
  formData.append('speaker', 'participant_a');
  formData.append('language', 'en');

  const uploadRes = await fetch(`${API_BASE}/conversations/${conversation.id}/audio`, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer demo_user_token_golden',
      // DO NOT set Content-Type header so fetch/browser sets boundary
    },
    body: formData,
  });

  const uploadData = await uploadRes.json();
  console.log('Upload response status:', uploadRes.status);
  console.log('Upload response body:', uploadData);

  if (uploadRes.status === 201) {
    console.log('✅ Voice Upload & Processing PASSED!');
  } else {
    console.error('❌ Voice Upload FAILED');
  }
}

testAudioUpload();
