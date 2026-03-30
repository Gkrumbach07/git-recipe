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

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .concat('.md')
}
