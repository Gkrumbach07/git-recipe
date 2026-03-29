import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import * as github from '../github'
import { getToken, type McpAuthInfo } from '../auth'
import matter from 'gray-matter'

function parseRecipeContent(base64: string) {
  const decoded = Buffer.from(base64, 'base64').toString('utf-8')
  const { data, content } = matter(decoded)
  return { frontmatter: data, body: content.trim() }
}

function serializeRecipe(frontmatter: Record<string, unknown>, body: string): string {
  return matter.stringify(body, frontmatter)
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .concat('.md')
}

export function registerRecipeTools(server: McpServer) {
  server.registerTool('list_recipes', {
    title: 'List Recipes',
    description: 'List recipes in a cookbook. Returns titles, paths, and frontmatter summaries.',
    inputSchema: {
      owner: z.string().describe('Repository owner'),
      repo: z.string().describe('Repository name'),
      path: z.string().optional().describe('Path to list (empty for root)'),
      branch: z.string().optional().describe('Branch name (default: main)'),
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false,
    },
    _meta: {
      'openai/toolInvocation/invoking': 'Listing recipes...',
      'openai/toolInvocation/invoked': 'Found recipes!',
    },
  }, async ({ owner, repo, path, branch }, extra) => {
    const token = getToken(extra.authInfo as McpAuthInfo | undefined)
    const contents = await github.listContents(token, owner, repo, path ?? '', branch)
    const recipes = contents
      .filter((item) => item.type === 'file' && item.name.endsWith('.md') && item.name !== 'README.md')
      .map((item) => ({
        name: item.name,
        path: item.path,
        size: item.size,
      }))
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({ recipes }, null, 2),
      }],
    }
  })

  server.registerTool('read_recipe', {
    title: 'Read Recipe',
    description: 'Read a full recipe including frontmatter metadata and markdown body.',
    inputSchema: {
      owner: z.string().describe('Repository owner'),
      repo: z.string().describe('Repository name'),
      path: z.string().describe('File path of the recipe'),
      branch: z.string().optional().describe('Branch name'),
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false,
    },
    _meta: {
      'openai/toolInvocation/invoking': 'Reading recipe...',
      'openai/toolInvocation/invoked': 'Recipe loaded!',
    },
  }, async ({ owner, repo, path, branch }, extra) => {
    const token = getToken(extra.authInfo as McpAuthInfo | undefined)
    const file = await github.getFile(token, owner, repo, path, branch)
    const { frontmatter, body } = parseRecipeContent(file.content!)
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({ path, frontmatter, body, sha: file.sha }, null, 2),
      }],
    }
  })

  server.registerTool('create_recipe', {
    title: 'Create Recipe',
    description: 'Create a new recipe in a cookbook. Commits the file to the repository.',
    inputSchema: {
      owner: z.string().describe('Repository owner'),
      repo: z.string().describe('Repository name'),
      path: z.string().optional().describe('File path (auto-generated from title if omitted)'),
      title: z.string().describe('Recipe title'),
      tags: z.array(z.string()).optional().describe('Categorization tags'),
      servings: z.number().optional().describe('Number of servings'),
      source: z.string().optional().describe('Attribution'),
      body: z.string().describe('Recipe body in markdown'),
      branch: z.string().optional().describe('Branch name'),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      openWorldHint: false,
    },
    _meta: {
      'openai/toolInvocation/invoking': 'Adding recipe to your cookbook...',
      'openai/toolInvocation/invoked': 'Recipe added!',
    },
  }, async ({ owner, repo, path, title, tags, servings, source, body, branch }, extra) => {
    const token = getToken(extra.authInfo as McpAuthInfo | undefined)
    const filePath = path ?? slugify(title)
    const frontmatter: Record<string, unknown> = {
      title,
    }
    if (tags) frontmatter.tags = tags
    if (servings) frontmatter.servings = servings
    if (source) frontmatter.source = source

    const content = serializeRecipe(frontmatter, body)
    await github.createOrUpdateFile(
      token, owner, repo, filePath, content, undefined,
      `Add "${title}"`, branch,
    )
    return {
      content: [{
        type: 'text' as const,
        text: `Created recipe "${title}" at ${filePath}`,
      }],
    }
  })

  server.registerTool('update_recipe', {
    title: 'Update Recipe',
    description: 'Update an existing recipe. Partial frontmatter updates are supported.',
    inputSchema: {
      owner: z.string().describe('Repository owner'),
      repo: z.string().describe('Repository name'),
      path: z.string().describe('File path of the recipe'),
      title: z.string().optional().describe('New title'),
      tags: z.array(z.string()).optional().describe('New tags'),
      servings: z.number().optional().describe('New servings'),
      source: z.string().optional().describe('New source'),
      body: z.string().optional().describe('New body markdown'),
      branch: z.string().optional().describe('Branch name'),
      message: z.string().optional().describe('Custom commit message'),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      openWorldHint: false,
    },
    _meta: {
      'openai/toolInvocation/invoking': 'Updating recipe...',
      'openai/toolInvocation/invoked': 'Recipe updated!',
    },
  }, async ({ owner, repo, path, title, tags, servings, source, body, branch, message }, extra) => {
    const token = getToken(extra.authInfo as McpAuthInfo | undefined)
    const file = await github.getFile(token, owner, repo, path, branch)
    const existing = parseRecipeContent(file.content!)

    const frontmatter = { ...existing.frontmatter }
    if (title !== undefined) frontmatter.title = title
    if (tags !== undefined) frontmatter.tags = tags
    if (servings !== undefined) frontmatter.servings = servings
    if (source !== undefined) frontmatter.source = source

    const newBody = body ?? existing.body
    const content = serializeRecipe(frontmatter, newBody)
    const commitMsg = message ?? `Update "${frontmatter.title}"`

    await github.createOrUpdateFile(
      token, owner, repo, path, content, file.sha,
      commitMsg, branch,
    )
    return {
      content: [{
        type: 'text' as const,
        text: `Updated recipe "${frontmatter.title}" at ${path}`,
      }],
    }
  })

  server.registerTool('delete_recipe', {
    title: 'Delete Recipe',
    description: 'Delete a recipe from a cookbook. Creates a deletion commit.',
    inputSchema: {
      owner: z.string().describe('Repository owner'),
      repo: z.string().describe('Repository name'),
      path: z.string().describe('File path of the recipe'),
      branch: z.string().optional().describe('Branch name'),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      openWorldHint: false,
    },
    _meta: {
      'openai/toolInvocation/invoking': 'Deleting recipe...',
      'openai/toolInvocation/invoked': 'Recipe deleted.',
    },
  }, async ({ owner, repo, path, branch }, extra) => {
    const token = getToken(extra.authInfo as McpAuthInfo | undefined)
    const file = await github.getFile(token, owner, repo, path, branch)
    const { frontmatter } = parseRecipeContent(file.content!)
    await github.deleteFile(
      token, owner, repo, path, file.sha,
      `Delete "${frontmatter.title ?? path}"`, branch,
    )
    return {
      content: [{ type: 'text' as const, text: `Deleted recipe at ${path}` }],
    }
  })

  server.registerTool('search_recipes', {
    title: 'Search Recipes',
    description: 'Search recipe titles, tags, and content within a cookbook.',
    inputSchema: {
      owner: z.string().describe('Repository owner'),
      repo: z.string().describe('Repository name'),
      query: z.string().describe('Search query'),
      branch: z.string().optional().describe('Branch name'),
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false,
    },
    _meta: {
      'openai/toolInvocation/invoking': 'Searching recipes...',
      'openai/toolInvocation/invoked': 'Search complete!',
    },
  }, async ({ owner, repo, query, branch }, extra) => {
    const token = getToken(extra.authInfo as McpAuthInfo | undefined)
    const q = query.toLowerCase()

    const contents = await github.listContents(token, owner, repo, '', branch)
    const results: Array<{ path: string; title: string; match: string }> = []

    for (const item of contents) {
      if (item.type === 'file' && item.name.endsWith('.md') && item.name !== 'README.md') {
        try {
          const file = await github.getFile(token, owner, repo, item.path, branch)
          const { frontmatter, body } = parseRecipeContent(file.content!)
          const title = (frontmatter.title as string) ?? item.name
          const tags = (frontmatter.tags as string[]) ?? []

          if (
            title.toLowerCase().includes(q) ||
            tags.some((t: string) => t.toLowerCase().includes(q)) ||
            body.toLowerCase().includes(q)
          ) {
            let match = 'content'
            if (title.toLowerCase().includes(q)) match = 'title'
            else if (tags.some((t: string) => t.toLowerCase().includes(q))) match = 'tag'
            results.push({ path: item.path, title, match })
          }
        } catch {
          // Skip files that can't be read
        }
      }
    }
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(results, null, 2),
      }],
    }
  })
}
