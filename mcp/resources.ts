import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import * as github from './github'
import { getToken } from './auth'
import matter from 'gray-matter'

export function registerResources(server: McpServer) {
  // List of all user's cookbooks
  server.registerResource(
    'cookbooks',
    'gitrecipe://cookbooks',
    {
      description: 'List of all user\'s cookbooks',
      mimeType: 'application/json',
    },
    async () => {
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
        contents: [{
          uri: 'gitrecipe://cookbooks',
          mimeType: 'application/json',
          text: JSON.stringify(cookbooks, null, 2),
        }],
      }
    },
  )

  // Cookbook metadata + recipe listing
  server.registerResource(
    'cookbook',
    new ResourceTemplate('gitrecipe://cookbook/{owner}/{repo}', { list: undefined }),
    {
      description: 'Cookbook metadata and full recipe listing',
      mimeType: 'application/json',
    },
    async (_uri, variables) => {
      const token = getToken()
      const owner = variables.owner as string
      const repo = variables.repo as string
      const repoData = await github.getRepo(token, owner, repo)
      const contents = await github.listContents(token, owner, repo)
      const recipes = contents
        .filter((item) => item.type === 'file' && item.name.endsWith('.md') && item.name !== 'README.md')
        .map((item) => ({ name: item.name, path: item.path }))
      return {
        contents: [{
          uri: `gitrecipe://cookbook/${owner}/${repo}`,
          mimeType: 'application/json',
          text: JSON.stringify({
            name: repoData.name,
            owner: repoData.owner.login,
            description: repoData.description,
            private: repoData.private,
            default_branch: repoData.default_branch,
            recipes,
          }, null, 2),
        }],
      }
    },
  )

  // Single recipe content
  server.registerResource(
    'recipe',
    new ResourceTemplate('gitrecipe://cookbook/{owner}/{repo}/{+path}', { list: undefined }),
    {
      description: 'A single recipe\'s full content',
      mimeType: 'application/json',
    },
    async (_uri, variables) => {
      const token = getToken()
      const owner = variables.owner as string
      const repo = variables.repo as string
      const path = variables.path as string
      const file = await github.getFile(token, owner, repo, path)
      const decoded = Buffer.from(file.content!, 'base64').toString('utf-8')
      const { data, content } = matter(decoded)

      return {
        contents: [{
          uri: `gitrecipe://cookbook/${owner}/${repo}/${path}`,
          mimeType: 'application/json',
          text: JSON.stringify({
            path,
            frontmatter: data,
            body: content.trim(),
            sha: file.sha,
          }, null, 2),
        }],
      }
    },
  )

}
