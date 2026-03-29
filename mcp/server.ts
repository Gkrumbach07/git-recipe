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
