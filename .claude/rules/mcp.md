---
paths:
  - "mcp/**"
description: MCP server implementation rules
---

# MCP Server Rules

## Packages

- `@modelcontextprotocol/sdk` — core MCP server
- `@modelcontextprotocol/ext-apps` — OpenAI Apps SDK extensions
- `zod` — tool input schema validation

## Dual Transport

- Streamable HTTP for ChatGPT App (`https://mcp.gitrecipe.app/mcp`)
- stdio for local clients (Claude Desktop, Cursor, Claude Code) via `npx @git-recipe/mcp`
- Single codebase supports both

## Auth Modes

- ChatGPT: OAuth 2.0 + PKCE, server publishes discovery at `/.well-known/oauth-protected-resource`
- Local: `GITHUB_TOKEN` env var passed at startup

## Tool Annotations

- Every tool must declare `readOnlyHint`, `destructiveHint`, `openWorldHint`
- Destructive tools (delete_cookbook, delete_recipe, delete_branch) require `destructiveHint: true`
- All input schemas defined with Zod

## Security

- Stateless — no credentials or data persisted
- Never include tokens in tool responses
- Token-scoped — operates within GitHub token permissions only
