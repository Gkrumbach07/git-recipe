---
paths:
  - "app/**"
  - "components/**"
  - "middleware.ts"
description: Next.js App Router conventions, file conventions, and project organization
---

# Next.js Rules

## Project Organization Strategy

Keep `app/` purely for routing. All shared application code lives in top-level folders:

```
app/                        # Routing only — no shared logic here
  layout.tsx                # Root layout (required) — defines <html> and <body>
  page.tsx                  # Landing page (/)
  globals.css               # Global styles + CSS variables
  (auth)/                   # Route group — public auth pages, no URL prefix
    login/page.tsx          # /login
  (app)/                    # Route group — authenticated pages, no URL prefix
    layout.tsx              # Shared app shell (nav, sidebar) for all authed pages
    dashboard/page.tsx      # /dashboard
    cookbook/
      new/page.tsx          # /cookbook/new
      [owner]/[repo]/
        page.tsx            # /cookbook/[owner]/[repo]
        settings/page.tsx   # /cookbook/[owner]/[repo]/settings
        recipe/
          new/page.tsx
          [...path]/
            page.tsx        # View recipe
            edit/page.tsx   # Edit recipe
            history/page.tsx
            blame/page.tsx
        branches/page.tsx
        suggestions/
          page.tsx
          [number]/page.tsx
        history/page.tsx
        tree/[branch]/[...path]/page.tsx
  api/                      # Route handlers (REST endpoints)
    auth/
      login/route.ts
      callback/route.ts
      logout/route.ts
components/                 # Shared React components
  ui/                       # shadcn primitives (button, dialog, card, etc.)
  cookbook/                  # Cookbook-specific components
  recipe/                   # Recipe-specific components
  layout/                   # Shell, nav, sidebar
lib/                        # Utilities, clients, helpers
hooks/                      # Custom React hooks
types/                      # Shared TypeScript types
```

## File Conventions (inside `app/`)

| File | Purpose |
|---|---|
| `page.tsx` | Makes a route segment publicly accessible |
| `layout.tsx` | Shared UI that wraps child routes — persists across navigation, does not re-render |
| `loading.tsx` | Suspense fallback UI (loading skeleton/spinner) |
| `error.tsx` | Error boundary UI |
| `not-found.tsx` | 404 UI |
| `route.ts` | API route handler — cannot coexist with `page.tsx` in the same segment |

## Route Groups `(folder)`

- Parenthesized folder names are **omitted from the URL**
- Use for logical grouping: `(auth)` for public pages, `(app)` for authenticated pages
- Each group can have its own `layout.tsx` — separate shells for auth vs app
- Does not affect URL structure: `app/(app)/dashboard/page.tsx` → `/dashboard`

## Private Folders `_folder`

- Underscore-prefixed folders are **excluded from routing entirely**
- Use for colocating helper components, utilities, or test files next to routes
- Example: `app/(app)/dashboard/_components/stats-card.tsx`

## Dynamic Routes

- `[param]` — single dynamic segment (`[owner]`, `[repo]`)
- `[...param]` — catch-all segment (`[...path]` matches `a/b/c`)
- `[[...param]]` — optional catch-all

## Server vs Client Components

- **All components are Server Components by default.** No directive needed.
- Add `'use client'` only when you need: `useState`, `useEffect`, event handlers (`onClick`), browser APIs, or third-party hooks.
- Push the `'use client'` boundary as far down the tree as possible — wrap interactive leaves, not entire pages.
- Server Components can fetch data directly, access server-only resources, and reduce client JS bundle.

## Route Handlers (`route.ts`)

- Use standard Web Request/Response APIs
- Support `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `OPTIONS` exports
- Run on the server — no client JS shipped
- Cannot coexist with `page.tsx` in the same route segment

## Middleware

- `middleware.ts` at project root (or `src/` if using src directory)
- Runs at the Edge before every matched request
- Use `matcher` config to scope — avoid running on static assets:
  ```ts
  export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
  }
  ```
- Use for: auth checks, redirects, header injection

## Root Layout Requirements

- Must exist at `app/layout.tsx`
- Must define `<html>` and `<body>` tags
- Must accept and render `children`
- Only the root layout can contain these tags

## Env Vars

- Server-only: no prefix (`GITHUB_APP_CLIENT_SECRET`, `SESSION_SECRET`)
- Client-exposed: `NEXT_PUBLIC_` prefix (`NEXT_PUBLIC_APP_URL`)
- `.env.local` for local secrets (gitignored), `.env` for non-sensitive defaults
