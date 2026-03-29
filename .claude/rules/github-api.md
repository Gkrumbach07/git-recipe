---
paths:
  - "lib/github.ts"
  - "lib/queries/**"
  - "app/api/**"
description: GitHub API client and data fetching patterns
---

# GitHub API Rules

## Client

- Wrap GitHub REST API calls in `lib/github.ts` using `fetch` or Octokit
- All calls use the user's access token from the session cookie
- Handle rate limits (5,000 req/hr) — surface remaining quota, degrade gracefully

## React Query

- Query keys namespaced: `[owner, repo, ...resource]`
- Mutations invalidate relevant queries on success
- Optimistic updates for file edits where appropriate
- Stale time: branches/PRs short (~30s), file content longer (~5m)
- Query/mutation factories live in `lib/queries/`

## Cookbook Detection

- A repo is a cookbook only if it contains a `.gitrecipe` marker file at the root
- When listing cookbooks, filter repos by checking for this marker

## File Operations

- Recipe CRUD via Contents API (`/repos/{owner}/{repo}/contents/{path}`)
- Move/rename via Git Data API for single-commit tree operations
- Each save = a commit. Auto-generate commit messages (e.g., `Add "Recipe Title"`)
- `updated` frontmatter field set automatically on edit

## Domain Vocabulary in Code

Use domain terms in variable/function names:
- `cookbook` not `repo/repository`
- `recipe` not `file/document`
- `section` not `folder/directory`
- `draft` not `branch`
- `suggestion` not `pullRequest/pr`
- `revision` not `commit`
