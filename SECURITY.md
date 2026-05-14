# Security Notes

Southern Ledger handles sensitive financial data. Treat every real deployment as private infrastructure.

## Default Boundary

- Local development uses Wrangler local D1.
- `wrangler.jsonc` contains only a placeholder D1 database ID.
- Generated deployment config is ignored by git.
- The public `workers.dev` route is disabled by default.
- The app does not yet include internal user accounts or password authentication.

## Data Rules

- Do not commit real bank exports.
- Do not commit Cloudflare credentials, API tokens, D1 database IDs, `.env.local`, `.dev.vars`, or generated Wrangler configs.
- Keep raw imported transaction rows immutable for auditability.
- Use least-privilege deployment tokens.
- Review exports before sharing them with accountants or other third parties.

## Access Rules

Before using real data in production:

- Require an authentication layer on the dashboard hostname.
- Allow only trusted identities.
- Test access in a private browser session before importing real statements.
- Treat any unprotected deployment as unsuitable for real financial data.
- Keep local database files and backups out of public repositories.

## Future Hardening

- Add request-level identity checks in the Worker if multiple users are ever allowed.
- Add explicit export audit logs before accountant workflows handle real data.
- Add encrypted backup and restore procedures for D1.
