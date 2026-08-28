const { createUserClient } = require('../config/supabase');

// ─── Add Turn ───
async function addTurn(req, res) {
  try {
    const supabase = createUserClient(req.accessToken, req.user?.id);
    const { id } = req.params;
    const data = req.validatedBody;

    // Verify conversation exists and belongs to user (RLS handles this)
    const { data: conversation, error: convErr } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', id)
      .single();

    if (convErr || !conversation) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    const { data: turn, error } = await supabase
      .from('conversation_turns')
      .insert({
        conversation_id: id,
        speaker: data.speaker,
        original_text: data.originalText,
        language: data.language || null,
      })
      .select()
      .single();

    if (error) {
      console.error('[Turn] Create error:', error.message);
      return res.status(400).json({ error: 'Failed to add turn.' });
    }

    return res.status(201).json(turn);
  } catch (err) {
    console.error('[Turn] Unexpected error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// ─── List Turns ───
async function listTurns(req, res) {
  try {
    const supabase = createUserClient(req.accessToken, req.user?.id);
    const { id } = req.params;

    const { data: turns, error } = await supabase
      .from('conversation_turns')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[Turn] List error:', error.message);
      return res.status(400).json({ error: 'Failed to fetch turns.' });
    }

    return res.json(turns || []);
  } catch (err) {
    console.error('[Turn] Unexpected error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = { addTurn, listTurns };
