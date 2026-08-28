const { createUserClient } = require('../config/supabase');
const aiProvider = require('../providers/gemini/aiProvider');

// ─── Generate Agreement ───
async function generateAgreement(req, res) {
  try {
    const supabase = createUserClient(req.accessToken, req.user?.id);
    const { id } = req.params;

    // Get conversation
    const { data: conversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .single();

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    // Get active claims
    const { data: claims } = await supabase
      .from('claims')
      .select('*')
      .eq('conversation_id', id)
      .eq('status', 'active');

    // Check for unresolved conflicts
    const { data: openConflicts } = await supabase
      .from('conflicts')
      .select('*')
      .eq('conversation_id', id)
      .eq('status', 'open');

    if (openConflicts && openConflicts.length > 0) {
      return res.status(400).json({
        error: 'Cannot generate agreement while conflicts remain unresolved.',
        openConflicts: openConflicts.length,
      });
    }

    // Get resolved conflicts
    const { data: resolvedConflicts } = await supabase
      .from('conflicts')
      .select('*')
      .eq('conversation_id', id)
      .eq('status', 'resolved');

    // Generate agreement via AI
    const conversationContext = `${conversation.category}: ${conversation.purpose || conversation.title}`;
    const agreementResult = await aiProvider.generateAgreement(
      (claims || []).map((c) => ({
        speaker: c.speaker,
        subject: c.subject,
        attribute: c.attribute,
        value: c.value_json?.value,
        unit: c.value_json?.unit || '',
      })),
      resolvedConflicts || [],
      conversationContext
    );

    // Check if agreement already exists for this conversation
    const { data: existing } = await supabase
      .from('agreements')
      .select('id, version')
      .eq('conversation_id', id)
      .single();

    let agreement;
    if (existing) {
      // Update existing — increment version, reset confirmations
      const { data: updated, error } = await supabase
        .from('agreements')
        .update({
          version: existing.version + 1,
          agreement_json: agreementResult.agreement,
          summary: agreementResult.summary,
          status: 'draft',
          participant_a_confirmed: false,
          participant_b_confirmed: false,
          participant_a_confirmed_at: null,
          participant_b_confirmed_at: null,
          verified_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('[Agreement] Update error:', error.message);
        return res.status(400).json({ error: 'Failed to update agreement.' });
      }
      agreement = updated;

      // Log event
      await supabase.from('agreement_events').insert({
        agreement_id: existing.id,
        event_type: 'regenerated',
        actor: 'system',
        metadata: { version: existing.version + 1 },
      });
    } else {
      // Create new
      const { data: created, error } = await supabase
        .from('agreements')
        .insert({
          conversation_id: id,
          version: 1,
          agreement_json: agreementResult.agreement,
          summary: agreementResult.summary,
          status: 'draft',
        })
        .select()
        .single();

      if (error) {
        console.error('[Agreement] Create error:', error.message);
        return res.status(400).json({ error: 'Failed to create agreement.' });
      }
      agreement = created;

      // Log event
      await supabase.from('agreement_events').insert({
        agreement_id: created.id,
        event_type: 'drafted',
        actor: 'system',
        metadata: { version: 1 },
      });
    }

    // Update conversation
    await supabase
      .from('conversations')
      .update({ agreement_status: 'draft', updated_at: new Date().toISOString() })
      .eq('id', id);

    return res.json(agreement);
  } catch (err) {
    console.error('[Agreement] Generate error:', err.message);
    return res.status(500).json({ error: 'Agreement generation failed: ' + err.message });
  }
}

// ─── Get Agreement ───
async function getAgreement(req, res) {
  try {
    const supabase = createUserClient(req.accessToken, req.user?.id);
    const { id } = req.params;

    const { data: agreement } = await supabase
      .from('agreements')
      .select('*')
      .eq('conversation_id', id)
      .single();

    if (!agreement) {
      return res.status(404).json({ error: 'No agreement found for this conversation.' });
    }

    // Get events
    const { data: events } = await supabase
      .from('agreement_events')
      .select('*')
      .eq('agreement_id', agreement.id)
      .order('created_at', { ascending: true });

    return res.json({ ...agreement, events: events || [] });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch agreement.' });
  }
}

// ─── Confirm Agreement ───
async function confirmAgreement(req, res) {
  try {
    const supabase = createUserClient(req.accessToken, req.user?.id);
    const { id } = req.params;
    const { participant } = req.validatedBody;

    // Get agreement
    const { data: agreement } = await supabase
      .from('agreements')
      .select('*')
      .eq('conversation_id', id)
      .single();

    if (!agreement) {
      return res.status(404).json({ error: 'No agreement found.' });
    }

    if (agreement.status === 'verified') {
      return res.status(400).json({ error: 'Agreement is already verified.' });
    }

    // Update confirmation
    const updates = { updated_at: new Date().toISOString() };
    if (participant === 'participant_a') {
      updates.participant_a_confirmed = true;
      updates.participant_a_confirmed_at = new Date().toISOString();
    } else {
      updates.participant_b_confirmed = true;
      updates.participant_b_confirmed_at = new Date().toISOString();
    }

    // Check if both confirmed
    const aConfirmed = participant === 'participant_a' ? true : agreement.participant_a_confirmed;
    const bConfirmed = participant === 'participant_b' ? true : agreement.participant_b_confirmed;

    if (aConfirmed && bConfirmed) {
      updates.status = 'verified';
      updates.verified_at = new Date().toISOString();
    } else {
      updates.status = 'awaiting_confirmation';
    }

    const { data: updated, error } = await supabase
      .from('agreements')
      .update(updates)
      .eq('id', agreement.id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: 'Failed to confirm agreement.' });
    }

    // Log event
    await supabase.from('agreement_events').insert({
      agreement_id: agreement.id,
      event_type: 'confirmed',
      actor: participant,
      metadata: { version: agreement.version },
    });

    // Update conversation status
    await supabase
      .from('conversations')
      .update({
        agreement_status: updated.status === 'verified' ? 'verified' : 'awaiting_confirmation',
        status: updated.status === 'verified' ? 'completed' : 'active',
        completed_at: updated.status === 'verified' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updated.status === 'verified') {
      await supabase.from('agreement_events').insert({
        agreement_id: agreement.id,
        event_type: 'verified',
        actor: 'system',
        metadata: { version: agreement.version },
      });
    }

    return res.json(updated);
  } catch (err) {
    console.error('[Agreement] Confirm error:', err.message);
    return res.status(500).json({ error: 'Confirmation failed.' });
  }
}

// ─── Reject Agreement ───
async function rejectAgreement(req, res) {
  try {
    const supabase = createUserClient(req.accessToken, req.user?.id);
    const { id } = req.params;
    const { participant } = req.validatedBody;

    const { data: agreement } = await supabase
      .from('agreements')
      .select('*')
      .eq('conversation_id', id)
      .single();

    if (!agreement) {
      return res.status(404).json({ error: 'No agreement found.' });
    }

    // Reset to draft, clear confirmations
    const { data: updated, error } = await supabase
      .from('agreements')
      .update({
        status: 'rejected',
        participant_a_confirmed: false,
        participant_b_confirmed: false,
        participant_a_confirmed_at: null,
        participant_b_confirmed_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', agreement.id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: 'Failed to reject agreement.' });
    }

    // Log event
    await supabase.from('agreement_events').insert({
      agreement_id: agreement.id,
      event_type: 'rejected',
      actor: participant,
      metadata: { version: agreement.version },
    });

    // Update conversation
    await supabase
      .from('conversations')
      .update({ agreement_status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', id);

    return res.json(updated);
  } catch (err) {
    console.error('[Agreement] Reject error:', err.message);
    return res.status(500).json({ error: 'Rejection failed.' });
  }
}

module.exports = { generateAgreement, getAgreement, confirmAgreement, rejectAgreement };
