import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import * as github from '../github'
import { getToken } from '../auth'

export function registerCookbookTools(server: McpServer) {
  server.registerTool('list_cookbooks', {
    title: 'List Cookbooks',
    description: 'List all cookbooks the user has access to. Returns name, description, visibility, last updated.',
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false,
    },
    _meta: {
      'openai/toolInvocation/invoking': 'Listing your cookbooks...',
      'openai/toolInvocation/invoked': 'Found your cookbooks!',
    },
  }, async () => {
    const token = getToken()
    const repos = await github.listRepos(token)
    const cookbooks = []
    for (const repo of repos) {
      try {
        await github.getFile(token, repo.owner.login, repo.name, '.gitrecipe')
        cookbooks.push({
          name: repo.name,
          owner: repo.owner.login,
          description: repo.description,
          private: repo.private,
          updated_at: repo.updated_at,
        })
      } catch {
        // Not a cookbook
      }
    }
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(cookbooks, null, 2) }],
    }
  })

  server.registerTool('create_cookbook', {
    title: 'Create Cookbook',
    description: 'Create a new cookbook (GitHub repository). Initializes with README and .gitrecipe marker.',
    inputSchema: {
      name: z.string().describe('Cookbook name (becomes repo name)'),
      description: z.string().optional().describe('Cookbook description'),
      visibility: z.enum(['public', 'private']).default('private').describe('Visibility'),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      openWorldHint: false,
    },
    _meta: {
      'openai/toolInvocation/invoking': 'Creating your cookbook...',
      'openai/toolInvocation/invoked': 'Cookbook created!',
    },
  }, async ({ name, description, visibility }) => {
    const token = getToken()
    const repo = await github.createRepo(token, {
      name,
      description,
      private: visibility !== 'public',
      auto_init: true,
    })
    await github.createOrUpdateFile(
      token,
      repo.owner.login,
      repo.name,
      '.gitrecipe',
      JSON.stringify({ version: 1, created: new Date().toISOString() }, null, 2),
      undefined,
      'Initialize cookbook',
    )
    return {
      content: [{
        type: 'text' as const,
        text: `Created cookbook "${name}" at ${repo.owner.login}/${repo.name}`,
      }],
    }
  })

  server.registerTool('delete_cookbook', {
    title: 'Delete Cookbook',
    description: 'Delete a cookbook (GitHub repository). This is irreversible.',
    inputSchema: {
      owner: z.string().describe('Repository owner'),
      repo: z.string().describe('Repository name'),
      confirm: z.literal(true).describe('Must be true to confirm deletion'),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      openWorldHint: false,
    },
    _meta: {
      'openai/toolInvocation/invoking': 'Deleting cookbook...',
      'openai/toolInvocation/invoked': 'Cookbook deleted.',
    },
  }, async ({ owner, repo }) => {
    const token = getToken()
    await github.deleteRepo(token, owner, repo)
    return {
      content: [{ type: 'text' as const, text: `Deleted cookbook ${owner}/${repo}` }],
    }
  })
}
