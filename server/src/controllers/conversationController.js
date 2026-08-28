const { createUserClient } = require('../config/supabase');

// ─── Create Conversation ───
async function createConversation(req, res) {
  try {
    const supabase = createUserClient(req.accessToken, req.user?.id);
    const data = req.validatedBody;

    const { data: conversation, error } = await supabase
      .from('conversations')
      .insert({
        user_id: req.user.id,
        title: data.title,
        category: data.category,
        purpose: data.purpose || '',
        participant_a_name: data.participantA.name,
        participant_a_language: data.participantA.language,
        participant_a_role: data.participantA.role || '',
        participant_b_name: data.participantB.name,
        participant_b_language: data.participantB.language,
        participant_b_role: data.participantB.role || '',
        expected_fields: data.expectedFields || [],
        status: 'active',
        agreement_status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('[Conversation] Create error:', error.message);
      return res.status(400).json({ error: 'Failed to create conversation.' });
    }

    return res.status(201).json(conversation);
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

    return res.json(conversations || []);
  } catch (err) {
    console.error('[Conversation] Unexpected error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// ─── Get Conversation ───
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

    return res.json(conversation);
  } catch (err) {
    console.error('[Conversation] Unexpected error:', err.message);
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
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error || !conversation) {
      return res.status(404).json({ error: 'Conversation not found or update failed.' });
    }

    return res.json(conversation);
  } catch (err) {
    console.error('[Conversation] Unexpected error:', err.message);
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
      return res.status(400).json({ error: 'Failed to delete conversation.' });
    }

    return res.json({ message: 'Conversation deleted.' });
  } catch (err) {
    console.error('[Conversation] Unexpected error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// ─── Get Dashboard Stats ───
async function getDashboardStats(req, res) {
  try {
    const supabase = createUserClient(req.accessToken, req.user?.id);

    const { data: conversations } = await supabase
      .from('conversations')
      .select('id, status, agreement_status')
      .eq('user_id', req.user.id);

    const convos = conversations || [];
    const stats = {
      totalConversations: convos.length,
      verifiedAgreements: convos.filter((c) => c.agreement_status === 'verified').length,
      pendingClarifications: convos.filter((c) => c.status === 'active' && c.agreement_status !== 'verified').length,
      unresolved: convos.filter((c) => c.agreement_status === 'rejected').length,
    };

    return res.json(stats);
  } catch (err) {
    console.error('[Dashboard] Stats error:', err.message);
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
