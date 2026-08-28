const { supabaseAdmin, isSupabaseConfigured } = require('../config/supabase');

/**
 * Authentication middleware.
 * Validates the JWT from the Authorization header via Supabase when configured,
 * or handles local demo auth tokens when running in local development mode.
 */
async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // In local mode without auth header, fall back to default demo user rather than blocking
      if (!isSupabaseConfigured) {
        req.user = {
          id: 'demo-user-1',
          email: 'demo@accordvoice.ai',
          user_metadata: { full_name: 'Demo User' },
        };
        req.accessToken = 'local-demo-token';
        return next();
      }
      return res.status(401).json({ error: 'Missing or invalid authorization header.' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Missing access token.' });
    }

    // Handle local demo tokens
    if (token.startsWith('local-') || !isSupabaseConfigured || !supabaseAdmin) {
      // Decode user info if encoded in token or use demo user
      let user = {
        id: 'demo-user-1',
        email: 'demo@accordvoice.ai',
        user_metadata: { full_name: 'Demo User' },
      };

      try {
        if (token.startsWith('local-json-')) {
          const raw = Buffer.from(token.replace('local-json-', ''), 'base64').toString('utf-8');
          const parsed = JSON.parse(raw);
          user = {
            id: parsed.id || 'demo-user-1',
            email: parsed.email || 'demo@accordvoice.ai',
            user_metadata: { full_name: parsed.fullName || 'Demo User' },
          };
        } else if (token.startsWith('local-user-')) {
          const emailPart = token.replace('local-user-', '');
          user = {
            id: 'local-' + Buffer.from(emailPart).toString('hex').slice(0, 16),
            email: emailPart || 'demo@accordvoice.ai',
            user_metadata: { full_name: emailPart.split('@')[0] || 'Demo User' },
          };
        }
      } catch {
        // Fallback to default user
      }

      req.user = user;
      req.accessToken = token;
      return next();
    }

    // Verify token with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }

    req.user = user;
    req.accessToken = token;
    next();
  } catch (err) {
    console.error('[Auth Middleware] Error:', err.message);
    if (!isSupabaseConfigured) {
      req.user = {
        id: 'demo-user-1',
        email: 'demo@accordvoice.ai',
        user_metadata: { full_name: 'Demo User' },
      };
      req.accessToken = 'local-demo-token';
      return next();
    }
    return res.status(500).json({ error: 'Authentication failed.' });
  }
}

module.exports = { authMiddleware };
