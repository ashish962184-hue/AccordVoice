const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const { createUserClient } = require('../config/supabase');
const { transcribeAudio } = require('../providers/gemini/aiProvider');

// Ensure uploads directory exists
const uploadsDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer config
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: config.upload.maxFileSize },
  fileFilter: (req, file, cb) => {
    if (config.upload.allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported audio format: ${file.mimetype}`));
    }
  },
});

// ─── Process Audio ───
async function processAudio(req, res) {
  try {
    const supabase = createUserClient(req.accessToken, req.user?.id);
    const { id } = req.params;
    const speaker = req.body.speaker || 'participant_a';
    const expectedLanguage = req.body.language || 'en';

    // Verify conversation exists
    const { data: conversation, error: convErr } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .single();

    if (convErr || !conversation) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided.' });
    }

    // Transcribe using Gemini
    const transcription = await transcribeAudio(
      req.file.buffer,
      req.file.mimetype,
      expectedLanguage
    );

    if (!transcription.text || transcription.text.trim() === '') {
      return res.status(400).json({ error: 'Could not transcribe audio. No speech detected.' });
    }

    // Save as conversation turn
    const { data: turn, error: turnErr } = await supabase
      .from('conversation_turns')
      .insert({
        conversation_id: id,
        speaker,
        language: transcription.language || expectedLanguage,
        original_text: transcription.text,
        confidence: transcription.confidence || null,
      })
      .select()
      .single();

    if (turnErr) {
      console.error('[Audio] Turn save error:', turnErr.message);
      return res.status(400).json({ error: 'Failed to save transcription.' });
    }

    return res.status(201).json({
      turn,
      transcription: {
        text: transcription.text,
        language: transcription.language,
        speaker,
        confidence: transcription.confidence,
      },
    });
  } catch (err) {
    console.error('[Audio] Processing error:', err.message);
    return res.status(500).json({ error: err.message || 'Audio processing failed.' });
  }
}

module.exports = { upload, processAudio };
