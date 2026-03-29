---
paths:
  - "app/(auth)/**"
  - "app/api/auth/**"
  - "lib/auth.ts"
  - "middleware.ts"
description: GitHub App OAuth auth implementation rules
---

# Auth Rules

## Architecture

- Custom GitHub App OAuth — no NextAuth, no Auth.js, no third-party auth
- Use Arctic (`arctic` package) as a lightweight OAuth 2.0 helper for GitHub
- Tokens stored in encrypted HTTP-only, Secure, SameSite=Lax cookies
- Encrypt/decrypt with `jose` or Node.js `crypto`

## GitHub App Config

- Permissions: Administration (R/W), Contents (R/W), Pull Requests (R/W), Metadata (Read)
- "Expire user authorization tokens" enabled — tokens last 8h, refresh tokens provided
- OAuth callback: `/api/auth/callback`

## Route Handlers

- `app/api/auth/login/route.ts` — generate state, set state cookie, redirect to GitHub
- `app/api/auth/callback/route.ts` — validate state, exchange code via Arctic, encrypt tokens, set session cookie, redirect to dashboard
- `app/api/auth/logout/route.ts` — clear session cookie

## Token Refresh

- Check expiry on each authenticated request (middleware or lib helper)
- If expired, use refresh token to get new access token from GitHub
- Cannot set cookies from Server Components — refresh in Route Handlers, Server Actions, or Middleware only

## Security

- Always validate `state` param (CSRF protection)
- Never expose tokens client-side
- Never store tokens in localStorage
- Never include tokens in `NEXT_PUBLIC_` env vars

## Env Vars

```
GITHUB_APP_CLIENT_ID=
GITHUB_APP_CLIENT_SECRET=
SESSION_SECRET=           # For cookie encryption
NEXT_PUBLIC_APP_URL=      # For OAuth redirect URI
```
