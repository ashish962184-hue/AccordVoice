const { createUserClient } = require('../config/supabase');
const aiProvider = require('../providers/gemini/aiProvider');

// ─── Analyze Conversation ───
async function analyzeConversation(req, res) {
  try {
    const supabase = createUserClient(req.accessToken, req.user?.id);
    const { id } = req.params;

    // 1. Get conversation
    const { data: conversation, error: convErr } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .single();

    if (convErr || !conversation) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    // 2. Get all turns in order
    const { data: turns, error: turnsErr } = await supabase
      .from('conversation_turns')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });

    if (turnsErr || !turns || turns.length === 0) {
      return res.status(400).json({ error: 'No turns to analyze.' });
    }

    const conversationContext = `${conversation.title} (${conversation.category}): ${conversation.purpose || conversation.description || ''}`;

    // 3. Extract claims from all turns
    const claimResult = await aiProvider.extractClaims(
      turns.map((t) => ({
        speaker: t.speaker,
        text: t.original_text,
        turnId: t.id,
      })),
      conversationContext
    );

    // 4. Store/upsert claims
    const claimRecords = [];
    for (const claim of claimResult.claims) {
      const valueJson = typeof claim.value === 'object' ? claim.value : { value: claim.value, unit: claim.unit || '' };
      const { data: stored } = await supabase
        .from('claims')
        .insert({
          conversation_id: id,
          source_turn_id: claim.source_turn_id || null,
          speaker: claim.speaker,
          subject: claim.subject,
          attribute: claim.attribute,
          value: String(claim.value ?? ''),
          value_json: valueJson,
          confidence: claim.confidence || 0.9,
          status: 'active',
        })
        .select()
        .single();
      if (stored) claimRecords.push(stored);
    }

    // 5. Detect semantic conflicts
    const allClaims = claimRecords.length > 0 ? claimRecords : claimResult.claims;
    const conflictResult = await aiProvider.detectConflicts(
      allClaims.map((c) => ({
        speaker: c.speaker,
        subject: c.subject,
        attribute: c.attribute,
        value: c.value_json ? c.value_json.value : c.value,
        unit: c.value_json ? c.value_json.unit : (c.unit || ''),
      })),
      conversationContext
    );

    // 6. Store conflicts
    const conflictRecords = [];
    for (const conflict of conflictResult.conflicts) {
      const claimAId = conflict.claim_a_index !== undefined && claimRecords[conflict.claim_a_index]
        ? claimRecords[conflict.claim_a_index].id : null;
      const claimBId = conflict.claim_b_index !== undefined && claimRecords[conflict.claim_b_index]
        ? claimRecords[conflict.claim_b_index].id : null;

      const { data: stored } = await supabase
        .from('conflicts')
        .insert({
          conversation_id: id,
          conflict_type: conflict.type,
          description: conflict.description,
          claim_a_id: claimAId,
          claim_b_id: claimBId,
          severity: conflict.severity || 'medium',
          status: 'open',
          clarification_question: conflict.clarification_question,
          clarification_language: 'en',
        })
        .select()
        .single();
      if (stored) conflictRecords.push(stored);
    }

    // 7. Auto-create pending clarifications for open conflicts
    for (const conf of conflictRecords) {
      if (conf.clarification_question) {
        await supabase
          .from('clarifications')
          .insert({
            conversation_id: id,
            conflict_id: conf.id,
            question: conf.clarification_question,
            language: conf.clarification_language || 'en',
            target_speaker: conf.target_speaker || 'participant_a',
            status: 'pending',
          });
      }
    }

    // 8. Get all clarifications
    const { data: clarifications } = await supabase
      .from('clarifications')
      .select('*')
      .eq('conversation_id', id);

    // 9. Update conversation state
    const stateResult = await aiProvider.getConversationState(
      turns, claimRecords, conflictRecords, clarifications || []
    );

    const calculatedState = stateResult.state ||
      (conflictRecords.length > 0 ? 'CONFLICT_DETECTED' : 'UNDERSTANDING');

    let agreementStatus = conversation.agreement_status;
    if (calculatedState === 'CONFLICT_DETECTED' || calculatedState === 'CLARIFICATION_REQUIRED') {
      agreementStatus = 'pending';
    }

    await supabase
      .from('conversations')
      .update({
        status: conflictRecords.length > 0 ? 'active' : conversation.status,
        state: calculatedState,
        agreement_status: agreementStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    return res.json({
      claims: claimRecords,
      conflicts: conflictRecords,
      clarifications: clarifications || [],
      conversationState: calculatedState,
      state: calculatedState,
    });
  } catch (err) {
    console.error('[Analysis] Error:', err.message);
    return res.status(500).json({ error: 'Analysis failed: ' + err.message });
  }
}

// ─── Get claims for a conversation ───
async function getClaims(req, res) {
  try {
    const supabase = createUserClient(req.accessToken, req.user?.id);
    const { id } = req.params;

    const { data: claims, error } = await supabase
      .from('claims')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Claims] List error:', error.message);
      return res.status(400).json({ error: 'Failed to fetch claims.' });
    }

    return res.json({ claims: claims || [] });
  } catch (err) {
    console.error('[Claims] Error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// ─── Get conflicts for a conversation ───
async function getConflicts(req, res) {
  try {
    const supabase = createUserClient(req.accessToken, req.user?.id);
    const { id } = req.params;

    const { data: conflicts, error } = await supabase
      .from('conflicts')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Conflicts] List error:', error.message);
      return res.status(400).json({ error: 'Failed to fetch conflicts.' });
    }

    return res.json({ conflicts: conflicts || [] });
  } catch (err) {
    console.error('[Conflicts] Error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = {
  analyzeConversation,
  getClaims,
  getConflicts,
};
