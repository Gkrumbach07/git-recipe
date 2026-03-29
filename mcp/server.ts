import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { registerCookbookTools } from './tools/cookbooks'
import { registerRecipeTools } from './tools/recipes'
import { registerHistoryTools } from './tools/history'
import { registerImportTools } from './tools/import'
import { registerResources } from './resources'
import { registerPrompts } from './prompts'

export function createServer(): McpServer {
  const server = new McpServer(
    {
      name: 'git-recipe',
      version: '1.0.0',
    },
    {
      capabilities: {
        resources: {},
        tools: {},
        prompts: {},
      },
      instructions: `git-recipe manages recipes stored as markdown files in GitHub repositories.

Capabilities:
- List, create, read, update, delete, and search recipes (markdown files with YAML frontmatter)
- List and create cookbooks (GitHub repos with a .gitrecipe marker)
- View commit history for cookbooks and individual recipes
- Import recipes from URLs

Limitations — do NOT suggest these:
- No image/photo support
- No folders or categories — recipes are a flat list, organized by tags only
- No branches or pull requests
- No meal planning, shopping lists, or cooking mode
- No social features (following, starring)

Recipe frontmatter fields: title (required), tags, servings, source. No other fields.`,
    },
  )

  registerCookbookTools(server)
  registerRecipeTools(server)
  registerHistoryTools(server)
  registerImportTools(server)
  registerResources(server)
  registerPrompts(server)

  return server
}
