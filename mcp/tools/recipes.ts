import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import * as github from '../github'
import { getToken, type McpAuthInfo } from '../auth'
import { parseRecipe, serializeRecipe, slugify, buildCookUpdate } from '../../lib/recipe'

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
    const folders = contents
      .filter((item) => item.type === 'dir' && !item.name.startsWith('.'))
      .map((item) => ({ name: item.name, path: item.path }))
    const recipes = contents
      .filter((item) => item.type === 'file' && item.name.endsWith('.md') && !item.name.startsWith('.') && item.name !== 'README.md')
      .map((item) => ({ name: item.name, path: item.path, size: item.size }))
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({ folders, recipes }, null, 2),
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
    const { frontmatter, body } = parseRecipe(file.content!, file.sha)
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
    const existing = parseRecipe(file.content!, file.sha)

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
    const { frontmatter } = parseRecipe(file.content!, file.sha)
    await github.deleteFile(
      token, owner, repo, path, file.sha,
      `Delete "${frontmatter.title ?? path}"`, branch,
    )
    return {
      content: [{ type: 'text' as const, text: `Deleted recipe at ${path}` }],
    }
  })

  server.registerTool('duplicate_recipe', {
    title: 'Duplicate Recipe',
    description: 'Duplicate an existing recipe with a new filename and "(copy)" appended to the title.',
    inputSchema: {
      owner: z.string().describe('Repository owner'),
      repo: z.string().describe('Repository name'),
      path: z.string().describe('File path of the recipe to duplicate'),
      branch: z.string().optional().describe('Branch name'),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      openWorldHint: false,
    },
  }, async ({ owner, repo, path, branch }, extra) => {
    const token = getToken(extra.authInfo as McpAuthInfo | undefined)
    const file = await github.getFile(token, owner, repo, path, branch)
    const { frontmatter, body } = parseRecipe(file.content!, file.sha)
    const newFrontmatter = { ...frontmatter, title: `${frontmatter.title} (copy)` }
    const newPath = path.replace(/\.md$/, '-copy.md')
    const content = serializeRecipe(newFrontmatter, body)
    await github.createOrUpdateFile(
      token, owner, repo, newPath, content, undefined,
      `Duplicate "${frontmatter.title}"`, branch,
    )
    return {
      content: [{ type: 'text' as const, text: `Duplicated "${frontmatter.title}" to ${newPath}` }],
    }
  })

  server.registerTool('move_recipe', {
    title: 'Move Recipe',
    description: 'Move a recipe to a different folder or the root.',
    inputSchema: {
      owner: z.string().describe('Repository owner'),
      repo: z.string().describe('Repository name'),
      old_path: z.string().describe('Current file path'),
      new_path: z.string().describe('New file path'),
      branch: z.string().optional().describe('Branch name'),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      openWorldHint: false,
    },
  }, async ({ owner, repo, old_path, new_path, branch }, extra) => {
    const token = getToken(extra.authInfo as McpAuthInfo | undefined)
    const file = await github.getFile(token, owner, repo, old_path, branch)
    const content = Buffer.from(file.content!, 'base64').toString('utf-8')
    await github.createOrUpdateFile(
      token, owner, repo, new_path, content, undefined,
      `Move ${old_path} to ${new_path}`, branch,
    )
    await github.deleteFile(
      token, owner, repo, old_path, file.sha,
      `Move ${old_path} to ${new_path}`, branch,
    )
    return {
      content: [{ type: 'text' as const, text: `Moved ${old_path} to ${new_path}` }],
    }
  })

  server.registerTool('create_folder', {
    title: 'Create Folder',
    description: 'Create a folder in a cookbook to organize recipes.',
    inputSchema: {
      owner: z.string().describe('Repository owner'),
      repo: z.string().describe('Repository name'),
      name: z.string().describe('Folder name'),
      parent_path: z.string().optional().describe('Parent folder path (empty for root)'),
      branch: z.string().optional().describe('Branch name'),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      openWorldHint: false,
    },
  }, async ({ owner, repo, name, parent_path, branch }, extra) => {
    const token = getToken(extra.authInfo as McpAuthInfo | undefined)
    const folderPath = parent_path ? `${parent_path}/${name}` : name
    await github.createOrUpdateFile(
      token, owner, repo, `${folderPath}/.gitkeep`, '', undefined,
      `Create folder "${name}"`, branch,
    )
    return {
      content: [{ type: 'text' as const, text: `Created folder "${name}" at ${folderPath}` }],
    }
  })

  server.registerTool('delete_folder', {
    title: 'Delete Folder',
    description: 'Delete a folder and all its contents from a cookbook.',
    inputSchema: {
      owner: z.string().describe('Repository owner'),
      repo: z.string().describe('Repository name'),
      path: z.string().describe('Folder path to delete'),
      branch: z.string().optional().describe('Branch name'),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      openWorldHint: false,
    },
  }, async ({ owner, repo, path, branch }, extra) => {
    const token = getToken(extra.authInfo as McpAuthInfo | undefined)

    async function collectFiles(dirPath: string): Promise<Array<{ path: string; sha: string }>> {
      const items = await github.listContents(token, owner, repo, dirPath, branch)
      const files: Array<{ path: string; sha: string }> = []
      for (const item of items) {
        if (item.type === 'file') {
          files.push({ path: item.path, sha: item.sha })
        } else if (item.type === 'dir') {
          files.push(...await collectFiles(item.path))
        }
      }
      return files
    }

    const files = await collectFiles(path)
    for (const file of files) {
      await github.deleteFile(
        token, owner, repo, file.path, file.sha,
        `Delete folder "${path}"`, branch,
      )
    }
    return {
      content: [{ type: 'text' as const, text: `Deleted folder "${path}" (${files.length} files)` }],
    }
  })

  server.registerTool('cook_recipe', {
    title: 'Mark Recipe as Cooked',
    description: 'Log that you cooked a recipe. Increments the cooked count and creates a commit in the history.',
    inputSchema: {
      owner: z.string().describe('Repository owner'),
      repo: z.string().describe('Repository name'),
      path: z.string().describe('File path of the recipe'),
      note: z.string().optional().describe('Optional note about this cook (e.g., "doubled the garlic")'),
      branch: z.string().optional().describe('Branch name'),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      openWorldHint: false,
    },
    _meta: {
      'openai/toolInvocation/invoking': 'Logging your cook...',
      'openai/toolInvocation/invoked': 'Logged!',
    },
  }, async ({ owner, repo, path, note, branch }, extra) => {
    const token = getToken(extra.authInfo as McpAuthInfo | undefined)
    const file = await github.getFile(token, owner, repo, path, branch)
    const { frontmatter, body } = parseRecipe(file.content!, file.sha)
    const { content, message, cookedCount } = buildCookUpdate(frontmatter, body, note)

    await github.createOrUpdateFile(
      token, owner, repo, path, content, file.sha,
      message, branch,
    )
    return {
      content: [{
        type: 'text' as const,
        text: `Logged cook #${cookedCount} for "${frontmatter.title}"${note ? ` — ${note}` : ''}`,
      }],
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
  }, async ({ owner, repo, query }, extra) => {
    const token = getToken(extra.authInfo as McpAuthInfo | undefined)
    const searchResult = await github.searchCode(token, owner, repo, query)
    const results = searchResult.items
      .filter(item => item.name.endsWith('.md') && !item.name.startsWith('.') && item.name !== 'README.md')
      .map(item => ({
        name: item.name,
        path: item.path,
        fragment: item.text_matches?.[0]?.fragment?.slice(0, 120),
      }))
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({ total: searchResult.total_count, results }, null, 2),
      }],
    }
  })
}
