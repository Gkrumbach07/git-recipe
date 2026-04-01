import matter from 'gray-matter'
import type { RecipeFrontmatter, ParsedRecipe } from '@/types'

export function parseRecipe(
  base64Content: string,
  sha: string,
): ParsedRecipe {
  const decoded = Buffer.from(base64Content, 'base64').toString('utf-8')
  const { data, content } = matter(decoded)
  return {
    frontmatter: data as RecipeFrontmatter,
    body: content.trim(),
    sha,
  }
}

export function serializeRecipe(
  frontmatter: RecipeFrontmatter | Record<string, unknown>,
  body: string,
): string {
  return matter.stringify(body, frontmatter)
}

export function buildCookUpdate(
  frontmatter: RecipeFrontmatter,
  body: string,
  note?: string,
): { content: string; message: string; cookedCount: number } {
  const updated = { ...frontmatter, cooked: (frontmatter.cooked ?? 0) + 1 }
  const content = serializeRecipe(updated, body)
  const parts = [`Cooked "${frontmatter.title}"`]
  if (note) parts.push('', note)
  return { content, message: parts.join('\n'), cookedCount: updated.cooked }
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .concat('.md')
}
