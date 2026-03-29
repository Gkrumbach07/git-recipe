# Git Recipe - Specification

A recipe management app that uses GitHub repositories as the storage backend. Each cookbook is a repo, each recipe is a markdown file. The app is a purpose-built skin over GitHub's git primitives, giving users version history, branching, pull requests, forks, and collaboration — all in the context of cooking.

---

## Core Concepts

| Domain Term | GitHub Equivalent |
|-------------|-------------------|
| Cookbook     | Repository        |
| Recipe      | Markdown file     |
| Section     | Folder/directory  |
| Revision    | Commit            |
| Draft       | Branch            |
| Suggestion  | Pull Request      |
| Fork        | Fork              |

---

## Tech Stack

- **Framework:** Next.js (App Router)
- **UI:** shadcn/ui + Tailwind CSS
- **Data fetching:** React Query (TanStack Query)
- **Auth:** GitHub OAuth (via GitHub App)
- **Storage:** GitHub API (repos, contents, git data)
- **AI integration:** MCP server via OpenAI Apps SDK (`@modelcontextprotocol/sdk` + `@modelcontextprotocol/ext-apps`). Published as a ChatGPT App and usable by any MCP client (Claude Desktop, Cursor, etc.)
- **No database.** All state lives in GitHub.

---

## Authentication

- GitHub App installation + OAuth flow.
- On sign-in, the app requests permissions to manage repositories on behalf of the user.
- The GitHub App token is used for all API calls (repo creation, file CRUD, branch management, PRs).
- Session managed via Next.js (cookie-based, server-side token refresh).

---

## Cookbooks (Repositories)

### Creating a Cookbook

- User provides a name (becomes the repo name) and optional description.
- App creates an empty GitHub repo under the user's account (or a selected org).
- Initializes with a `README.md` and a `.gitrecipe` marker file (contains cookbook-level config/metadata as JSON or YAML).

### Listing Cookbooks

- Lists all repos the authenticated user owns/has access to that contain a `.gitrecipe` marker file.
- Display: name, description, recipe count, last updated, visibility (public/private).

### Forking a Cookbook

- Standard GitHub fork. User gets a full copy of someone else's cookbook.
- Forked cookbooks are displayed with a "forked from" attribution.

### Deleting a Cookbook

- Deletes the underlying GitHub repo (with confirmation).

---

## Recipes (Markdown Files)

### File Format

Recipes are `.md` files with YAML frontmatter followed by freeform markdown body.

```markdown
---
title: "Grandma's Tomato Sauce"
tags: [italian, sauce, family]
servings: 6
prep_time: 15
cook_time: 45
difficulty: easy
image: ./images/tomato-sauce.jpg
source: "Grandma Rose"
created: 2025-03-15
updated: 2025-06-01
---

## Ingredients

- 2 cans (28 oz) whole peeled tomatoes
- 4 cloves garlic, minced
- 1/4 cup olive oil
- Fresh basil
- Salt and pepper to taste

## Instructions

1. Heat olive oil in a large pot over medium heat.
2. Add garlic and cook until fragrant, about 1 minute.
3. Crush tomatoes by hand and add to the pot.
4. Simmer on low for 45 minutes, stirring occasionally.
5. Season with salt, pepper, and torn basil leaves.

## Notes

This freezes well for up to 3 months.
```

### Frontmatter Schema

| Field        | Type       | Required | Description                              |
|--------------|------------|----------|------------------------------------------|
| `title`      | string     | yes      | Display name of the recipe               |
| `tags`       | string[]   | no       | Categorization tags                      |
| `servings`   | number     | no       | Number of servings                       |
| `prep_time`  | number     | no       | Prep time in minutes                     |
| `cook_time`  | number     | no       | Cook time in minutes                     |
| `difficulty` | enum       | no       | `easy`, `medium`, `hard`                 |
| `image`      | string     | no       | Relative path to an image in the repo    |
| `source`     | string     | no       | Attribution (person, URL, book)          |
| `created`    | date       | no       | ISO date string                          |
| `updated`    | date       | no       | ISO date string, set on each edit        |

The body is freeform markdown. No enforced structure — users write however they want.

### CRUD Operations

All operations go through the GitHub Contents API (or Git Data API for batch ops).

- **Browse:** List files/folders in the repo. Render markdown with parsed frontmatter for the UI.
- **Create:** New `.md` file via the Contents API. App provides a form/editor that outputs frontmatter + markdown.
- **Edit:** Update file contents. Each save is a commit. Commit message auto-generated (e.g., `Update "Grandma's Tomato Sauce"`) but can be customized.
- **Delete:** Remove file via Contents API (creates a deletion commit).
- **Move/Rename:** Delete + create (or use Git Data API for a tree-level rename within a single commit).

### Sections (Folders)

- Users can organize recipes into folders (e.g., `desserts/`, `weeknight-dinners/`).
- Sections are plain directories in the repo.
- Nested sections are supported.
- UI provides breadcrumb navigation.
- Creating a section creates the folder with a `.keep` or optional `_index.md` for section metadata (description, cover image).

### Images

- Images are committed to the repo alongside recipes (e.g., in an `images/` folder or co-located).
- Referenced via relative paths in frontmatter or inline markdown.
- The app handles upload by committing the binary file to the repo.

---

## Git Features

These are first-class features, not hidden. The app surfaces git workflows in a recipe-friendly vocabulary.

### History (Commits)

- View the full commit history of a recipe (file-level log).
- View the full commit history of a cookbook (repo-level log).
- Each history entry shows: date, author, message, diff summary.
- "Blame" view: see who last edited each line/section of a recipe.

### Drafts (Branches)

- Users can create a draft (branch) to experiment with recipe changes without affecting the main cookbook.
- Branch list shown in the UI with a branch switcher.
- Default branch is `main`.
- Users can view, switch between, and delete drafts.
- Merge a draft back into main via the Suggestions (PR) flow or direct merge.

### Suggestions (Pull Requests)

- A user can open a suggestion (PR) to propose changes.
- Useful for:
  - Merging a draft back into main.
  - Proposing changes to a forked cookbook back to the original.
  - Collaborators suggesting recipe edits.
- PR view shows: title, description, diff of changed recipes, conversation/comments.
- List open and closed suggestions.
- Merge, close, or comment on suggestions.

### Forks

- Fork any public cookbook to your own account.
- Make changes independently.
- Open a suggestion (PR) back to the original.

---

## Pages & Routes

```
/                           Landing / marketing page
/login                      GitHub OAuth login
/dashboard                  List of user's cookbooks

/cookbook/new                Create a new cookbook
/cookbook/[owner]/[repo]     Cookbook home — recipe listing (file tree)
/cookbook/[owner]/[repo]/settings   Cookbook settings (rename, delete, visibility)

/cookbook/[owner]/[repo]/tree/[branch]/[...path]
                            Browse folders/files on a specific branch

/cookbook/[owner]/[repo]/recipe/new?path=[folder]
                            Create a new recipe (optional target folder)
/cookbook/[owner]/[repo]/recipe/[...path]
                            View a recipe (rendered markdown)
/cookbook/[owner]/[repo]/recipe/[...path]/edit
                            Edit a recipe
/cookbook/[owner]/[repo]/recipe/[...path]/history
                            Commit history for a single recipe
/cookbook/[owner]/[repo]/recipe/[...path]/blame
                            Blame view for a recipe

/cookbook/[owner]/[repo]/branches
                            List all branches (drafts)
/cookbook/[owner]/[repo]/suggestions
                            List all PRs (open + closed)
/cookbook/[owner]/[repo]/suggestions/[number]
                            View a single PR — diff, comments, merge controls

/cookbook/[owner]/[repo]/history
                            Full commit log for the cookbook

```

---

## Design Theme: Linux Terminal Aesthetic

The app uses a retro Linux/terminal-inspired visual style. It should feel like a TUI (terminal user interface) running in a browser — functional, hacker-friendly, and nostalgic.

### Visual Direction

- **Color palette:** Dark background (near-black), green/amber/white text. Accent colors drawn from classic terminal palettes (Solarized Dark, Gruvbox, Dracula, or Nord — pick one and commit).
- **Typography:** Monospace fonts throughout — JetBrains Mono, Fira Code, or IBM Plex Mono. Proportional fonts only where readability demands it (long-form recipe body text, optionally).
- **Borders & containers:** ASCII-style box-drawing characters (`┌─┐│└─┘`) or simple 1px solid borders. No rounded corners, no shadows, no gradients.
- **Buttons & inputs:** Styled to look like terminal prompts. Buttons render as `[ Save ]` or `> Submit`. Inputs look like command-line fields with a blinking cursor.
- **Icons:** Minimal. Prefer text labels or ASCII symbols (`[+]`, `[x]`, `>>`, `--`) over icon libraries.
- **Cursor & interaction:** Block cursor animations on focused elements. Hover states use underline or inverse colors (text becomes background, background becomes text).
- **Status & feedback:** Messages styled like stdout/stderr output. Errors prefixed with `ERR:` or displayed in red. Success messages in green. Loading states show a spinner like `[  ⠋  ]` or `...`.
- **Navigation:** Breadcrumbs styled as a file path (`~/cookbooks/italian/mains/`). Menus feel like `man` pages or `ls` output.
- **Tables & lists:** Recipe listings rendered as columnar terminal output, similar to `ls -la` or `df -h`. Monospace-aligned columns.
- **ASCII art:** Optional ASCII art on the landing page and empty states (e.g., a pot, a chef's hat, or the app logo in figlet-style text).

### Component Styling Notes

- **Recipe cards** should resemble file entries in a terminal listing — filename, size (word count), date, permissions-style metadata.
- **Diff viewer** should look like `git diff` output — green/red lines, `@@` hunk headers, monospace.
- **History timeline** should resemble `git log --oneline` output.
- **The editor** should feel like editing in `vim` or `nano` — minimal chrome, prominent cursor, mode indicator.
- **Branch switcher** styled as a dropdown that looks like `git branch` output, with `*` marking the current branch.

---

## Key UI Components

### Cookbook Card
Shown on the dashboard. Displays name, description, recipe count, last updated, fork badge.

### Recipe Card
Shown when browsing a cookbook. Displays title, tags, difficulty badge, prep+cook time, thumbnail image.

### Recipe Viewer
Full rendered markdown with parsed frontmatter displayed as a structured header (title, metadata chips, image).

### Recipe Editor
Split or tabbed view: form fields for frontmatter + markdown editor for the body. Live preview optional.

### Diff Viewer
Side-by-side or unified diff of markdown changes. Used in history detail and suggestion (PR) views.

### Branch Switcher
Dropdown to switch between branches. Shown in the cookbook and recipe views.

### History Timeline
Vertical list of commits with author avatar, message, date, and link to the diff.

---

## API Layer

All data access goes through GitHub's API. The app has no backend database.

### GitHub APIs Used

| Operation                 | GitHub API                                      |
|---------------------------|--------------------------------------------------|
| Auth                      | OAuth / GitHub App installation token            |
| Create repo               | `POST /user/repos`                               |
| List repos                | `GET /user/repos` (filtered by `.gitrecipe`)     |
| Delete repo               | `DELETE /repos/{owner}/{repo}`                   |
| List files                | `GET /repos/{owner}/{repo}/contents/{path}`      |
| Read file                 | `GET /repos/{owner}/{repo}/contents/{path}`      |
| Create/update file        | `PUT /repos/{owner}/{repo}/contents/{path}`      |
| Delete file               | `DELETE /repos/{owner}/{repo}/contents/{path}`   |
| List commits              | `GET /repos/{owner}/{repo}/commits`              |
| File commit history       | `GET /repos/{owner}/{repo}/commits?path={path}`  |
| Blame                     | GraphQL API (`blame` field on `Repository`)      |
| List branches             | `GET /repos/{owner}/{repo}/branches`             |
| Create branch             | `POST /repos/{owner}/{repo}/git/refs`            |
| Delete branch             | `DELETE /repos/{owner}/{repo}/git/refs/{ref}`    |
| List PRs                  | `GET /repos/{owner}/{repo}/pulls`                |
| Create PR                 | `POST /repos/{owner}/{repo}/pulls`               |
| Merge PR                  | `PUT /repos/{owner}/{repo}/pulls/{number}/merge` |
| PR comments               | `GET/POST /repos/{owner}/{repo}/issues/{number}/comments` |
| Fork repo                 | `POST /repos/{owner}/{repo}/forks`               |

### React Query Structure

- Query keys namespaced by `[owner, repo, ...resource]`.
- Mutations invalidate relevant queries on success.
- Optimistic updates for file edits where appropriate.
- Stale time tuned per resource (branches/PRs: short, file content: longer).

---

## User Flows

### Onboarding (First-Time User)

```
Landing Page → Sign In → Install GitHub App → Create First Cookbook → Empty Cookbook View
```

1. **Landing page (`/`).** User sees what Git Recipe is — "Your recipes, version-controlled." Brief explanation of the concept, screenshots, a "Sign in with GitHub" CTA.

2. **GitHub OAuth (`/login`).** User clicks sign in. Redirected to GitHub to authorize the Git Recipe GitHub App. The app requests:
   - Read/write access to repositories (to create/manage cookbooks)
   - Read access to user profile (display name, avatar)

3. **GitHub App installation.** If the user hasn't installed the GitHub App yet, they're prompted to install it on their account (or select specific orgs). This grants the app permission to create and manage repos on their behalf. This step may be combined with the OAuth flow depending on the GitHub App configuration.

4. **Dashboard (`/dashboard`).** First visit: empty state. No cookbooks yet. The page shows:
   - A prominent "Create your first cookbook" CTA.
   - A secondary "Fork a cookbook" option (if they want to start from someone else's recipes).

5. **Create cookbook (`/cookbook/new`).** User enters:
   - Cookbook name (e.g., "family-recipes") — validated as a valid GitHub repo name.
   - Description (optional).
   - Visibility: public or private.
   - The app creates the repo, initializes it with `README.md` and `.gitrecipe`, and redirects to the cookbook.

6. **Empty cookbook view (`/cookbook/[owner]/[repo]`).** Shows an empty state with:
   - "Add your first recipe" button.
   - A brief guide: "Recipes are markdown files. Add ingredients, instructions, and notes — we'll version-control everything."

### Daily Use: Adding a Recipe

```
Dashboard → Cookbook → New Recipe → Fill Form → Save (commit) → View Recipe
```

1. User opens their dashboard, clicks into a cookbook.
2. Clicks "New recipe" (or navigates into a section first, then clicks "New recipe").
3. The recipe editor opens with:
   - Frontmatter form fields (title, tags, servings, times, difficulty, source).
   - Markdown editor for the body (ingredients, instructions, notes — freeform).
4. User fills it out and hits "Save."
5. The app commits the `.md` file to the repo on the current branch (default: `main`). Auto-generated commit message: `Add "Garlic Butter Shrimp"`.
6. Redirects to the recipe view — rendered markdown with metadata displayed as a structured header.

### Daily Use: Editing a Recipe

```
View Recipe → Edit → Modify → Save (commit) → View Updated Recipe
```

1. User views a recipe, clicks "Edit."
2. The editor loads with the current frontmatter fields and markdown body pre-filled.
3. User makes changes.
4. Hits "Save." The app commits the updated file. Commit message: `Update "Garlic Butter Shrimp"`. The `updated` frontmatter field is set automatically.
5. Returns to the recipe view with changes reflected.

### Daily Use: Browsing & Organizing

```
Cookbook → Browse Sections → View Recipes → Create/Rename/Move Sections
```

1. The cookbook view shows the file tree — sections (folders) and recipes (files).
2. User can click into sections to browse, use breadcrumbs to navigate back up.
3. User can create new sections, move recipes between sections, rename sections.
4. Each structural change is a commit.

### Collaboration: Forking & Suggesting

```
Discover Cookbook → Fork → Edit → Open Suggestion (PR) → Original Owner Reviews → Merge
```

1. User finds a public cookbook (via direct link — there's no discovery/search in v1).
2. Clicks "Fork." The app forks the repo to the user's account.
3. The forked cookbook appears on their dashboard with a "forked from" badge.
4. User edits recipes in their fork.
5. User opens a "Suggestion" (PR) back to the original cookbook.
6. The original owner reviews the suggestion — sees the diff, comments, and merges or closes.

### Experimentation: Drafting

```
Cookbook → New Draft (branch) → Edit Recipes → Review Changes → Merge or Discard
```

1. User is in a cookbook and wants to try something without touching the main recipes.
2. Clicks "New draft" — enters a name (e.g., `vegan-week`). The app creates a branch.
3. The branch switcher updates. User is now working on the draft branch.
4. User edits/adds/deletes recipes. All commits go to the draft branch.
5. When satisfied, user opens a Suggestion (PR) from the draft to `main`, reviews the diff, and merges.
6. Or discards the draft by deleting the branch.

### Viewing History

```
Recipe → History → View Commit List → Click Commit → See Diff
```

1. User views a recipe and clicks "History."
2. Sees a timeline of all commits that touched this file — date, author, commit message.
3. Clicks a commit to see the diff — what changed in the recipe at that point.
4. Blame view: see who last edited each line of the recipe, line by line.

### AI Workflow (via MCP)

```
User opens ChatGPT/Claude → MCP server connected → "Add my pasta recipe to my Italian cookbook" → AI calls tools → Recipe appears in cookbook
```

1. User has Git Recipe's MCP server configured in their AI client (ChatGPT, Claude Desktop, etc.).
2. The MCP server authenticates using the user's GitHub token.
3. User talks to the AI naturally: "Add a recipe for spaghetti carbonara to my family-recipes cookbook."
4. The AI calls `list_cookbooks` to find the cookbook, then `create_recipe` with structured frontmatter + body.
5. The recipe is committed to the repo. User can see it in the Git Recipe web UI.
6. Multi-step operations work the same way: "Organize all my pasta recipes into a section" → the AI lists recipes, creates a folder, moves files — all through MCP tool calls.

---

## MCP Server (ChatGPT App + Multi-Client)

The app exposes a **Model Context Protocol (MCP) server** so that external AI clients can interact with the user's cookbooks agentically. There is no chat UI built into Git Recipe. The web app is the visual interface; AI interaction happens in whatever client the user already uses — ChatGPT, Claude Desktop, Cursor, etc.

The **primary integration** is a published ChatGPT App via the OpenAI Apps SDK, which uses the MCP server as its backend. The same server also works as a standalone MCP server for other clients.

### Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        AI Clients                                │
│                                                                  │
│  ┌─────────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │  ChatGPT App    │  │ Claude       │  │ Cursor / other     │  │
│  │  (Apps SDK)     │  │ Desktop      │  │ MCP clients        │  │
│  │                 │  │              │  │                    │  │
│  │  OAuth 2.0 +    │  │ stdio        │  │ stdio              │  │
│  │  Streamable HTTP│  │ transport    │  │ transport          │  │
│  └────────┬────────┘  └──────┬───────┘  └─────────┬──────────┘  │
│           │                  │                    │              │
└───────────┼──────────────────┼────────────────────┼──────────────┘
            │                  │                    │
            ▼                  ▼                    ▼
┌──────────────────────────────────────────────────────────────────┐
│  Git Recipe MCP Server                                           │
│                                                                  │
│  @modelcontextprotocol/sdk  +  @modelcontextprotocol/ext-apps    │
│                                                                  │
│  Transport: Streamable HTTP (ChatGPT) / stdio (local clients)   │
│  Auth: OAuth 2.0 w/ PKCE (ChatGPT) / env token (local)          │
│  Tools: recipe CRUD, sections, branches, PRs, import             │
│  Resources: cookbook listings, recipe content                     │
│  Prompts: add-recipe, organize, import, search                   │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│  GitHub API                                                      │
└──────────────────────────────────────────────────────────────────┘
```

### npm Packages

| Package                             | Purpose                                     |
|--------------------------------------|---------------------------------------------|
| `@modelcontextprotocol/sdk`          | Core MCP server (tools, resources, prompts) |
| `@modelcontextprotocol/ext-apps`     | OpenAI Apps SDK extensions (widget registration, structured content) |
| `zod`                                | Tool input schema validation                |

### Authentication

The MCP server supports two auth modes depending on the client:

#### ChatGPT (OAuth 2.0 with PKCE)

ChatGPT uses the standard MCP OAuth flow. The server publishes discovery metadata and handles token exchange:

1. Server hosts `/.well-known/oauth-protected-resource` returning:
   ```json
   {
     "resource": "https://mcp.gitrecipe.app",
     "authorization_servers": ["https://github.com/login/oauth"],
     "scopes_supported": ["repo", "read:user"]
   }
   ```
2. Tools that require auth declare `securitySchemes: [{ type: "oauth2", scopes: ["repo"] }]`.
3. When ChatGPT calls a tool without a valid token, the server returns `_meta["mcp/www_authenticate"]` with the challenge — ChatGPT then surfaces its OAuth linking UI.
4. After the user authorizes, ChatGPT passes the GitHub OAuth token on subsequent tool calls.

#### Local Clients (Claude Desktop, Cursor, etc.)

Local clients pass the GitHub token via environment variable at startup:

```json
{
  "mcpServers": {
    "git-recipe": {
      "command": "npx",
      "args": ["-y", "@git-recipe/mcp"],
      "env": {
        "GITHUB_TOKEN": "<personal access token>"
      }
    }
  }
}
```

The web app's settings page provides a guided setup: generate a token, copy the config snippet for each supported client.

### Transport

| Client          | Transport        | Endpoint                               |
|-----------------|------------------|-----------------------------------------|
| ChatGPT         | Streamable HTTP  | `https://mcp.gitrecipe.app/mcp`        |
| Claude Desktop  | stdio            | `npx @git-recipe/mcp`                  |
| Cursor          | stdio            | `npx @git-recipe/mcp`                  |
| Claude Code     | stdio            | `npx @git-recipe/mcp`                  |
| Other (remote)  | Streamable HTTP  | `https://mcp.gitrecipe.app/mcp`        |

The server is a single codebase that supports both transports. Streamable HTTP is used for the deployed ChatGPT App. stdio is used when users run it locally via npx.

### Tools

Each tool declares MCP annotations for safety hints. All tool input schemas use Zod.

#### Cookbook Management

| Tool               | Annotations | Description |
|--------------------|-------------|-------------|
| `list_cookbooks`   | `readOnlyHint: true` | List all cookbooks the user has access to. Returns name, description, visibility, recipe count, last updated. |
| `create_cookbook`   | `destructiveHint: false` | Create a new cookbook (repo). Params: `name`, `description?`, `visibility?` (default: private). |
| `delete_cookbook`   | `destructiveHint: true` | Delete a cookbook. Params: `owner`, `repo`, `confirm` (must be `true`). |
| `fork_cookbook`     | `destructiveHint: false` | Fork a public cookbook. Params: `owner`, `repo`. |

#### Recipe CRUD

| Tool               | Annotations | Description |
|--------------------|-------------|-------------|
| `list_recipes`     | `readOnlyHint: true` | List recipes in a cookbook or section. Returns titles, paths, frontmatter summaries. Params: `owner`, `repo`, `path?`, `branch?`. |
| `read_recipe`      | `readOnlyHint: true` | Read full recipe (frontmatter + markdown body). Params: `owner`, `repo`, `path`, `branch?`. |
| `create_recipe`    | `destructiveHint: false` | Create a new recipe. Params: `owner`, `repo`, `path`, `title`, `tags?`, `servings?`, `prep_time?`, `cook_time?`, `difficulty?`, `source?`, `body`, `branch?`. Commits to the repo. |
| `update_recipe`    | `destructiveHint: false` | Update an existing recipe (partial frontmatter + body). Params: `owner`, `repo`, `path`, `title?`, `tags?`, `servings?`, `prep_time?`, `cook_time?`, `difficulty?`, `source?`, `body?`, `branch?`, `message?`. |
| `delete_recipe`    | `destructiveHint: true` | Delete a recipe. Params: `owner`, `repo`, `path`, `branch?`. |
| `move_recipe`      | `destructiveHint: false` | Move/rename a recipe. Params: `owner`, `repo`, `old_path`, `new_path`, `branch?`. |
| `search_recipes`   | `readOnlyHint: true` | Search recipe titles, tags, and content. Params: `owner`, `repo`, `query`, `branch?`. |

#### Sections

| Tool               | Annotations | Description |
|--------------------|-------------|-------------|
| `list_sections`    | `readOnlyHint: true` | List all sections (folders). Params: `owner`, `repo`, `branch?`. |
| `create_section`   | `destructiveHint: false` | Create a section. Params: `owner`, `repo`, `path`, `branch?`. |

#### Git Operations

| Tool                | Annotations | Description |
|---------------------|-------------|-------------|
| `list_branches`     | `readOnlyHint: true` | List all branches. Params: `owner`, `repo`. |
| `create_branch`     | `destructiveHint: false` | Create a branch. Params: `owner`, `repo`, `name`, `from_branch?`. |
| `delete_branch`     | `destructiveHint: true` | Delete a branch. Params: `owner`, `repo`, `name`. |
| `list_suggestions`  | `readOnlyHint: true` | List PRs. Params: `owner`, `repo`, `state?`. |
| `create_suggestion` | `destructiveHint: false` | Open a PR. Params: `owner`, `repo`, `title`, `body?`, `head`, `base?`. |
| `merge_suggestion`  | `destructiveHint: false` | Merge a PR. Params: `owner`, `repo`, `number`. |
| `get_history`       | `readOnlyHint: true` | Commit history. Params: `owner`, `repo`, `path?`, `branch?`. |

#### Import

| Tool               | Annotations | Description |
|--------------------|-------------|-------------|
| `import_from_url`  | `destructiveHint: false`, `openWorldHint: true` | Fetch a recipe URL, extract content, create a recipe. Params: `owner`, `repo`, `url`, `path?`, `branch?`. |

### Resources

Read-only data the AI client can inspect before calling tools:

| Resource URI                                     | Description                              |
|--------------------------------------------------|------------------------------------------|
| `gitrecipe://cookbooks`                          | List of all user's cookbooks             |
| `gitrecipe://cookbook/{owner}/{repo}`             | Cookbook metadata + full recipe listing   |
| `gitrecipe://cookbook/{owner}/{repo}/{path}`      | A single recipe's full content           |
| `gitrecipe://cookbook/{owner}/{repo}/branches`    | List of branches                         |
| `gitrecipe://cookbook/{owner}/{repo}/suggestions` | List of open PRs                         |

### Prompts

Prompt templates that AI clients can surface to users as quick actions:

| Prompt               | Description                                                    |
|----------------------|----------------------------------------------------------------|
| `add-recipe`         | "Tell me about a recipe and I'll add it to your cookbook."     |
| `organize-cookbook`   | "I'll review your cookbook and suggest how to organize it."    |
| `import-recipe`      | "Give me a URL and I'll import the recipe."                    |
| `weekly-meal-plan`   | "I'll look at your recipes and suggest a meal plan."           |
| `find-recipe`        | "Describe what you're in the mood for and I'll search."        |

### ChatGPT App Specifics

The MCP server doubles as an **OpenAI ChatGPT App** via the Apps SDK. This means it is listed in the ChatGPT App Store and users can enable it directly from ChatGPT without any local setup.

#### Widget UI (optional, future)

The Apps SDK supports rendering custom UI widgets inside ChatGPT via an iframe. For v1, the server returns plain `structuredContent` and `content` text — no custom widgets. ChatGPT renders the results as text in the conversation.

Future versions could register widget resources (`text/html;profile=mcp-app`) to render recipe cards, diff views, or cookbook browsers inline in ChatGPT.

#### Tool Invocation Metadata

Tools include ChatGPT-specific UX metadata for loading states:

```typescript
registerAppTool(server, "create_recipe", {
  title: "Create Recipe",
  inputSchema: { /* ... */ },
  _meta: {
    "openai/toolInvocation/invoking": "Adding recipe to your cookbook...",
    "openai/toolInvocation/invoked": "Recipe added!",
  },
}, handler);
```

#### Submission

The ChatGPT App is submitted through OpenAI's review process. Requirements:
- HTTPS endpoint for the MCP server.
- OAuth metadata published at well-known URLs.
- Tool annotations (`readOnlyHint`, `destructiveHint`, `openWorldHint`) on every tool.
- Compliance with OpenAI's app quality and safety guidelines.

### Example AI Interactions

These happen entirely in the user's AI client, not in the Git Recipe web app.

**Adding a recipe (ChatGPT):**
> **User:** I just made garlic butter shrimp. 1 lb shrimp, 4 cloves garlic, 3 tbsp butter, lemon juice, parsley. Sauté garlic in butter, add shrimp, cook 3 min per side, finish with lemon and parsley. Serves 2, takes 15 min.
>
> **ChatGPT:** *(calls `list_cookbooks` → finds "family-recipes" → calls `create_recipe` with structured frontmatter + body)*
> Done — I've committed "Garlic Butter Shrimp" to your family-recipes cookbook at `garlic-butter-shrimp.md`.

**Organizing (Claude):**
> **User:** Can you organize my Italian cookbook? Group things by course.
>
> **Claude:** *(calls `list_recipes` → analyzes tags/titles → calls `create_section` for appetizers/, mains/, desserts/ → calls `move_recipe` for each)*
> I've reorganized your cookbook into 3 sections and moved 12 recipes.

**Batch import (any client):**
> **User:** Import these recipes: [url1] [url2] [url3]
>
> **AI:** *(calls `import_from_url` three times)*
> Imported all 3. Here's what I added: ...

**Drafting (Claude Code):**
> **User:** Create a vegan version of my chocolate cake on a new branch.
>
> **AI:** *(calls `read_recipe` → `create_branch` "vegan-chocolate-cake" → `update_recipe` with substitutions on that branch → `create_suggestion`)*
> Done. I've created a draft branch with the vegan version and opened a suggestion so you can review the diff in the app.

### Security

- **Token-scoped:** The MCP server operates with whatever permissions the GitHub token grants. No escalation.
- **OAuth for ChatGPT:** Standard OAuth 2.0 + PKCE. The server never sees the user's GitHub password. Tokens are scoped to `repo` + `read:user`.
- **No stored state:** The server is stateless. No credentials, conversations, or data are persisted.
- **Destructive tool annotations:** Tools that delete or overwrite are annotated with `destructiveHint: true`. ChatGPT and other clients can use this to add confirmation steps.
- **No secrets in responses:** GitHub tokens are never included in `structuredContent`, `content`, or `_meta` returned to the AI client.

---

## Rate Limiting & Caveats

- GitHub API rate limit: 5,000 req/hr for authenticated users. The app should display rate limit status and degrade gracefully.
- Large files (images): GitHub Contents API has a 100 MB limit per file. Images should be reasonably sized.
- Repo size: GitHub warns at 1 GB. Not a practical concern for text + photos.
- Binary diffs: Image changes won't render meaningful diffs. Show "binary file changed" with before/after thumbnails.

---

## Future Considerations (Out of Scope for v1)

- **Search:** Full-text search across recipes (would require indexing outside GitHub, or use GitHub Code Search API).
- **Meal planning:** Calendar view to plan weekly meals from your cookbook.
- **Shopping lists:** Aggregate ingredients from selected recipes.
- **Import/export:** Import recipes from URLs or other formats.
- **Cooking mode:** Distraction-free step-by-step view for use in the kitchen.
- **Social features:** Follow users, star cookbooks, activity feed.
- **Custom domains:** Publish a cookbook as a static site.
