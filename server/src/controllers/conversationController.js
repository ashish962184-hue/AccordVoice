const { createUserClient } = require('../config/supabase');

// ─── Create Conversation ───
async function createConversation(req, res) {
  try {
    const supabase = createUserClient(req.accessToken, req.user?.id);
    const data = req.validatedBody;

    const nameA = data.participantA?.name || data.participantAName || 'Participant A';
    const langA = data.participantA?.language || data.participantALanguage || 'en';
    const roleA = data.participantA?.role || data.participantARole || '';

    const nameB = data.participantB?.name || data.participantBName || 'Participant B';
    const langB = data.participantB?.language || data.participantBLanguage || 'en';
    const roleB = data.participantB?.role || data.participantBRole || '';

    const expectedFields = data.expectedFields?.length ? data.expectedFields : (data.agreementFields || []);

    const { data: conversation, error } = await supabase
      .from('conversations')
      .insert({
        user_id: req.user.id,
        title: data.title,
        category: data.category || 'General',
        purpose: data.purpose || data.description || '',
        participant_a_name: nameA,
        participant_a_language: langA,
        participant_a_role: roleA,
        participant_b_name: nameB,
        participant_b_language: langB,
        participant_b_role: roleB,
        expected_fields: expectedFields,
        status: 'active',
        state: 'LISTENING',
        agreement_status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('[Conversation] Create error:', error.message);
      return res.status(400).json({ error: 'Failed to create conversation.' });
    }

    return res.status(201).json({ conversation });
  } catch (err) {
    console.error('[Conversation] Unexpected error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// ─── List Conversations ───
async function listConversations(req, res) {
  try {
    const supabase = createUserClient(req.accessToken, req.user?.id);

    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Conversation] List error:', error.message);
      return res.status(400).json({ error: 'Failed to fetch conversations.' });
    }

    return res.json({ conversations: conversations || [] });
  } catch (err) {
    console.error('[Conversation] Unexpected error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// ─── Get Conversation by ID ───
async function getConversation(req, res) {
  try {
    const supabase = createUserClient(req.accessToken, req.user?.id);
    const { id } = req.params;

    const { data: conversation, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !conversation) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    return res.json({ conversation });
  } catch (err) {
    console.error('[Conversation] Get error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// ─── Update Conversation ───
async function updateConversation(req, res) {
  try {
    const supabase = createUserClient(req.accessToken, req.user?.id);
    const { id } = req.params;
    const updates = req.validatedBody;

    const { data: conversation, error } = await supabase
      .from('conversations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error || !conversation) {
      console.error('[Conversation] Update error:', error?.message);
      return res.status(400).json({ error: 'Failed to update conversation.' });
    }

    return res.json({ conversation });
  } catch (err) {
    console.error('[Conversation] Update error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// ─── Delete Conversation ───
async function deleteConversation(req, res) {
  try {
    const supabase = createUserClient(req.accessToken, req.user?.id);
    const { id } = req.params;

    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[Conversation] Delete error:', error.message);
      return res.status(400).json({ error: 'Failed to delete conversation.' });
    }

    return res.json({ message: 'Conversation deleted.' });
  } catch (err) {
    console.error('[Conversation] Delete error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// ─── Get Dashboard Stats ───
async function getDashboardStats(req, res) {
  try {
    const supabase = createUserClient(req.accessToken, req.user?.id);

    const { data: convs, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', req.user.id);

    if (error) {
      return res.status(400).json({ error: 'Failed to fetch stats.' });
    }

    const conversations = convs || [];
    const stats = {
      total: conversations.length,
      active: conversations.filter((c) => !['VERIFIED', 'REJECTED'].includes(c.state)).length,
      conflicts: conversations.filter((c) => c.state === 'CONFLICT_DETECTED').length,
      clarifications: conversations.filter((c) => c.state === 'CLARIFICATION_REQUIRED').length,
      verified: conversations.filter((c) => c.state === 'VERIFIED').length,
    };

    return res.json(stats);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = {
  createConversation,
  listConversations,
  getConversation,
  updateConversation,
  deleteConversation,
  getDashboardStats,
};
