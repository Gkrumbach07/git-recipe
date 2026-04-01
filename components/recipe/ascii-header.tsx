import type { RecipeFrontmatter } from '@/types'

export function AsciiHeader({
  frontmatter,
  lastEdited,
}: {
  frontmatter: RecipeFrontmatter
  lastEdited?: string
}) {
  const meta: string[] = []
  if (frontmatter.servings) meta.push(`${frontmatter.servings} srv`)
  if (frontmatter.cooked) meta.push(`cooked ${frontmatter.cooked}x`)

  return (
    <div className="border border-border p-4 mb-6 inline-block">
      <div className="text-foreground text-base font-bold">
        {frontmatter.title || 'Untitled Recipe'}
      </div>
      {meta.length > 0 && (
        <div className="text-muted-foreground text-sm mt-1">
          {meta.join(' | ')}
        </div>
      )}
      {frontmatter.tags && frontmatter.tags.length > 0 && (
        <div className="text-muted-foreground text-sm mt-1">
          tags: {frontmatter.tags.join(', ')}
        </div>
      )}
      {frontmatter.source && (
        <div className="text-muted-foreground text-sm mt-1">
          source:{' '}
          {/^https?:\/\//.test(frontmatter.source) ? (
            <a
              href={frontmatter.source}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline hover:text-foreground"
            >
              {frontmatter.source}
            </a>
          ) : (
            frontmatter.source
          )}
        </div>
      )}
      {lastEdited && (
        <div className="text-muted-foreground text-sm mt-1">
          edited: {lastEdited}
        </div>
      )}
    </div>
  )
}
