// Shared bearer-token check for api/*.js endpoints. This site has exactly
// one owner — not a multi-user product — so a single long-lived secret per
// endpoint (set in Vercel's env vars) is enough; there's no session/user
// system to build here. Every new api/*.js endpoint should call this first,
// before doing anything else, rather than reinventing a header check.
export function requireSecret(req, res, envVarName) {
  const expected = process.env[envVarName];
  if (!expected) {
    res.status(500).json({ error: `Server misconfigured — ${envVarName} is not set` });
    return false;
  }
  const header = req.headers.authorization || '';
  const got = header.replace(/^Bearer\s+/i, '');
  if (got !== expected) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}
