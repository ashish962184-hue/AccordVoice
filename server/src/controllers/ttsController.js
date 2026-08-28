const { createUserClient } = require('../config/supabase');
const aiProvider = require('../providers/gemini/aiProvider');

// ─── Generate TTS ───
async function generateTTS(req, res) {
  try {
    const supabase = createUserClient(req.accessToken, req.user?.id);
    const { id } = req.params;
    const { language } = req.body;

    // Get agreement
    const { data: agreement } = await supabase
      .from('agreements')
      .select('*')
      .eq('conversation_id', id)
      .single();

    if (!agreement) {
      return res.status(404).json({ error: 'No agreement found.' });
    }

    const targetLanguage = language || 'en';
    let ttsText = agreement.summary;

    // If target language is not English, translate
    if (targetLanguage !== 'en') {
      try {
        const translated = await aiProvider.generateTTSText(agreement.summary, targetLanguage);
        ttsText = translated.text;
      } catch {
        // Fallback to original
      }
    }

    // Use browser-side Web Speech API for TTS (return text for client-side synthesis)
    // Server generates the text; client handles speech synthesis
    return res.json({
      text: ttsText,
      language: targetLanguage,
      summary: agreement.summary,
      agreement_json: agreement.agreement_json,
    });
  } catch (err) {
    console.error('[TTS] Error:', err.message);
    return res.status(500).json({ error: 'TTS generation failed.' });
  }
}

module.exports = { generateTTS };
