import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { registerCookbookTools } from './tools/cookbooks'
import { registerRecipeTools } from './tools/recipes'
import { registerHistoryTools } from './tools/history'
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
      instructions: `git-recipe stores recipes as markdown files in GitHub repos. Each cookbook is a repo with a .gitrecipe marker. Recipes can be organized in folders or kept flat at the root. Frontmatter fields: title (required), tags, servings, source.`,
    },
  )

  registerCookbookTools(server)
  registerRecipeTools(server)
  registerHistoryTools(server)
  registerResources(server)
  registerPrompts(server)

  return server
}
