# Git Recipe

A recipe management app using GitHub repos as storage. See @SPEC.md for full specification.

## Stack

- **Framework:** Next.js 15 (App Router, server components by default)
- **UI:** shadcn/ui + Tailwind CSS v4 — terminal/Linux aesthetic theme
- **Data fetching:** TanStack Query (React Query)
- **Auth:** Custom GitHub App OAuth (no NextAuth) — Arctic for OAuth helpers, encrypted HTTP-only cookies
- **Storage:** GitHub API only — no database
- **MCP:** `@modelcontextprotocol/sdk` + `@modelcontextprotocol/ext-apps`

## Project Structure

```
app/                    # Routes only — no shared logic here
  (auth)/               # Auth route group (login, callback, logout)
  (app)/                # Authenticated app routes (dashboard, cookbook, recipe)
  api/                  # Route handlers
components/
  ui/                   # shadcn primitives (button, dialog, etc.)
  cookbook/              # Cookbook-specific components
  recipe/               # Recipe-specific components
  layout/               # Shell, nav, sidebar components
lib/
  github.ts             # GitHub API client wrapper
  auth.ts               # Token encrypt/decrypt, session helpers
  utils.ts              # cn() and general utilities
  queries/              # React Query query/mutation factories
hooks/                  # Custom React hooks
types/                  # Shared TypeScript types
mcp/                    # MCP server source
public/                 # Static assets
```

## Commands

```bash
npm run dev             # Start dev server
npm run build           # Production build
npm run lint            # ESLint
npm run typecheck       # TypeScript check
```

## Key Decisions

- **No database.** All state lives in GitHub repos. Cookbooks are repos with a `.gitrecipe` marker file.
- **GitHub App (not OAuth App).** Fine-grained permissions: Administration (R/W), Contents (R/W), Pull Requests (R/W), Metadata (Read). User access tokens via OAuth web flow, expire after 8h with refresh.
- **Server components by default.** Only add `'use client'` for interactive leaves (editors, dropdowns, forms).
- **Terminal theme.** Dark monospace UI — no rounded corners, no gradients, no shadows. ASCII-style borders. See `.claude/rules/theme.md`.
- **Recipe format.** Markdown files with YAML frontmatter. Freeform body. See SPEC.md for schema.
- **Flat recipe list.** No folders/sections. Recipes are organized by tags only.
- **Domain vocabulary.** Cookbook = repo, Recipe = .md file. Use git terms directly in UI for everything else: branch, pull request (PR), commit.
