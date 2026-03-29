import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import * as github from '../github'
import { getToken } from '../auth'
import matter from 'gray-matter'

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .concat('.md')
}

export function registerImportTools(server: McpServer) {
  server.registerTool('import_from_url', {
    title: 'Import Recipe from URL',
    description: 'Fetch a recipe from a URL, extract content, and create a recipe file in a cookbook.',
    inputSchema: {
      owner: z.string().describe('Repository owner'),
      repo: z.string().describe('Repository name'),
      url: z.string().url().describe('URL to import recipe from'),
      path: z.string().optional().describe('Target file path (auto-generated if omitted)'),
      branch: z.string().optional().describe('Branch name'),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      openWorldHint: true,
    },
    _meta: {
      'openai/toolInvocation/invoking': 'Importing recipe from URL...',
      'openai/toolInvocation/invoked': 'Recipe imported!',
    },
  }, async ({ owner, repo, url, path, branch }) => {
    const token = getToken()

    // Fetch the URL content
    const res = await fetch(url)
    if (!res.ok) {
      return {
        content: [{ type: 'text' as const, text: `Failed to fetch URL: ${res.status} ${res.statusText}` }],
        isError: true,
      }
    }

    const html = await res.text()

    // Basic extraction: try to get title from <title> tag
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const title = titleMatch
      ? titleMatch[1].trim().replace(/\s*[-|].*$/, '')
      : 'Imported Recipe'

    // Strip HTML tags for a basic text extraction
    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()

    const frontmatter: Record<string, unknown> = {
      title,
      source: url,
    }

    const body = `## Imported Content\n\n${textContent.substring(0, 5000)}`
    const content = matter.stringify(body, frontmatter)
    const filePath = path ?? slugify(title)

    await github.createOrUpdateFile(
      token, owner, repo, filePath, content, undefined,
      `Import "${title}" from ${url}`, branch,
    )

    return {
      content: [{
        type: 'text' as const,
        text: `Imported recipe "${title}" from ${url} to ${filePath}. Note: the imported content is a basic text extraction and may need manual cleanup.`,
      }],
    }
  })
}
