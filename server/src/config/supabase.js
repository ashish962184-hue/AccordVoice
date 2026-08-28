const { createClient } = require('@supabase/supabase-js');
const config = require('./index');
const { createLocalClient } = require('./localDb');

const isSupabaseConfigured = Boolean(
  config.supabase.url &&
  config.supabase.url.trim() !== '' &&
  config.supabase.serviceRoleKey &&
  config.supabase.serviceRoleKey.trim() !== ''
);

// Admin client — uses service role key if configured, else null
const supabaseAdmin = isSupabaseConfigured
  ? createClient(config.supabase.url, config.supabase.serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

// Creates a per-request client scoped to the user
function createUserClient(accessToken, userId = null) {
  if (isSupabaseConfigured && config.supabase.anonKey) {
    return createClient(config.supabase.url, config.supabase.anonKey, {
      global: {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  // Fallback to local persistent JSON DB
  return createLocalClient(userId);
}

module.exports = {
  supabaseAdmin,
  createUserClient,
  isSupabaseConfigured,
};
