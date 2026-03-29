import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import * as github from '../github'
import { getToken, type McpAuthInfo } from '../auth'

export function registerHistoryTools(server: McpServer) {
  server.registerTool('get_history', {
    title: 'Get History',
    description: 'Get commit history for a cookbook or specific recipe.',
    inputSchema: {
      owner: z.string().describe('Repository owner'),
      repo: z.string().describe('Repository name'),
      path: z.string().optional().describe('File path (omit for full cookbook history)'),
      branch: z.string().optional().describe('Branch name'),
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false,
    },
  }, async ({ owner, repo, path, branch }, extra) => {
    const token = getToken(extra.authInfo as McpAuthInfo | undefined)
    const commits = await github.listCommits(token, owner, repo, path, branch)
    const result = commits.map((c) => ({
      sha: c.sha.substring(0, 7),
      message: c.commit.message,
      author: c.commit.author.name,
      date: c.commit.author.date,
    }))
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
    }
  })
}
