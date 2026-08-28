const { createUserClient } = require('../config/supabase');
const aiProvider = require('../providers/gemini/aiProvider');

// ─── Generate Clarification Question ───
async function createClarification(req, res) {
  try {
    const supabase = createUserClient(req.accessToken, req.user?.id);
    const { id } = req.params;
    const { conflictId } = req.body;

    // Get conversation
    const { data: conversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .single();

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    // Get conflict
    const { data: conflict } = await supabase
      .from('conflicts')
      .select('*')
      .eq('id', conflictId)
      .eq('conversation_id', id)
      .single();

    if (!conflict) {
      return res.status(404).json({ error: 'Conflict not found.' });
    }

    // Determine target language
    const targetLang = conflict.target_speaker === 'participant_b'
      ? conversation.participant_b_language
      : conversation.participant_a_language;

    // Generate clarification question via AI
    const clarification = await aiProvider.generateClarification(conflict, targetLang);

    // Store clarification
    const { data: stored, error } = await supabase
      .from('clarifications')
      .insert({
        conversation_id: id,
        conflict_id: conflictId,
        target_speaker: clarification.target_speaker || conflict.target_speaker || 'participant_a',
        language: clarification.language || targetLang,
        question: clarification.question,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('[Clarification] Create error:', error.message);
      return res.status(400).json({ error: 'Failed to create clarification.' });
    }

    return res.status(201).json(stored);
  } catch (err) {
    console.error('[Clarification] Error:', err.message);
    return res.status(500).json({ error: 'Clarification generation failed.' });
  }
}

// ─── Answer Clarification ───
async function answerClarification(req, res) {
  try {
    const supabase = createUserClient(req.accessToken, req.user?.id);
    const { id, clarificationId } = req.params;
    const data = req.validatedBody;

    // Update clarification
    const { data: clarification, error } = await supabase
      .from('clarifications')
      .update({
        answer: data.answer,
        answer_normalized: data.answer,
        status: 'answered',
        answered_at: new Date().toISOString(),
      })
      .eq('id', clarificationId)
      .eq('conversation_id', id)
      .select()
      .single();

    if (error || !clarification) {
      return res.status(404).json({ error: 'Clarification not found.' });
    }

    // Resolve the linked conflict
    if (clarification.conflict_id) {
      await supabase
        .from('conflicts')
        .update({
          status: 'resolved',
          resolution_json: { answer: data.answer, speaker: data.speaker },
          resolved_at: new Date().toISOString(),
        })
        .eq('id', clarification.conflict_id);
    }

    // Add the answer as a new conversation turn
    await supabase
      .from('conversation_turns')
      .insert({
        conversation_id: id,
        speaker: data.speaker,
        original_text: data.answer,
        language: clarification.language || 'en',
      });

    return res.json(clarification);
  } catch (err) {
    console.error('[Clarification] Answer error:', err.message);
    return res.status(500).json({ error: 'Failed to submit answer.' });
  }
}

// ─── List Clarifications ───
async function listClarifications(req, res) {
  try {
    const supabase = createUserClient(req.accessToken, req.user?.id);
    const { id } = req.params;

    const { data: clarifications } = await supabase
      .from('clarifications')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });

    return res.json(clarifications || []);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch clarifications.' });
  }
}

module.exports = { createClarification, answerClarification, listClarifications };
