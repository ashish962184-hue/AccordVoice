const { createUserClient } = require('../config/supabase');
const aiProvider = require('../providers/gemini/aiProvider');

// ─── Analyze Conversation (full pipeline) ───
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

    // 2. Get all turns
    const { data: turns } = await supabase
      .from('conversation_turns')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });

    if (!turns || turns.length === 0) {
      return res.json({
        claims: [],
        conflicts: [],
        state: { state: 'LISTENING', open_conflict_count: 0, missing_information: [], reason: 'No conversation turns yet.' },
      });
    }

    // 3. Extract claims
    const conversationContext = `${conversation.category}: ${conversation.purpose || conversation.title}`;
    const claimResult = await aiProvider.extractClaims(turns, conversationContext);

    // 4. Store claims
    const claimRecords = [];
    for (const claim of claimResult.claims) {
      const { data: stored } = await supabase
        .from('claims')
        .insert({
          conversation_id: id,
          speaker: claim.speaker,
          subject: claim.subject,
          attribute: claim.attribute,
          value_json: { value: claim.value, unit: claim.unit || '' },
          confidence: claim.confidence || 0.9,
          status: 'active',
        })
        .select()
        .single();
      if (stored) claimRecords.push(stored);
    }

    // 5. Detect conflicts
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

    // 7. Get existing clarifications
    const { data: clarifications } = await supabase
      .from('clarifications')
      .select('*')
      .eq('conversation_id', id);

    // 8. Update conversation state
    const stateResult = await aiProvider.getConversationState(
      turns, claimRecords, conflictRecords, clarifications || []
    );

    // 9. Update conversation status
    let agreementStatus = conversation.agreement_status;
    if (stateResult.state === 'CONFLICT_DETECTED' || stateResult.state === 'CLARIFICATION_REQUIRED') {
      agreementStatus = 'pending';
    }

    await supabase
      .from('conversations')
      .update({
        status: conflictRecords.length > 0 ? 'active' : conversation.status,
        agreement_status: agreementStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    return res.json({
      claims: claimRecords,
      conflicts: conflictRecords,
      state: stateResult,
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

    const { data: claims } = await supabase
      .from('claims')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });

    return res.json(claims || []);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch claims.' });
  }
}

// ─── Get conflicts for a conversation ───
async function getConflicts(req, res) {
  try {
    const supabase = createUserClient(req.accessToken, req.user?.id);
    const { id } = req.params;

    const { data: conflicts } = await supabase
      .from('conflicts')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });

    return res.json(conflicts || []);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch conflicts.' });
  }
}

module.exports = { analyzeConversation, getClaims, getConflicts };
