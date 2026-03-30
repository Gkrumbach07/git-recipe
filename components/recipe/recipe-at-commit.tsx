'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { fileAtCommitQueryOptions } from '@/lib/queries/history'
import { PROSE_CLASSES } from '@/lib/constants'
import { AsciiHeader } from './ascii-header'

export function RecipeAtCommit({
  owner,
  repo,
  path,
  sha,
}: {
  owner: string
  repo: string
  path: string
  sha: string
}) {
  const { data: recipe, isLoading, error } = useQuery(
    fileAtCommitQueryOptions(owner, repo, path, sha),
  )

  if (isLoading) {
    return <div className="font-mono text-muted-foreground">[ ... ]</div>
  }

  if (error) {
    return (
      <div className="font-mono text-destructive">
        ERR: {error.message}
      </div>
    )
  }

  if (!recipe) {
    return (
      <div className="font-mono text-muted-foreground">
        recipe not found at this commit
      </div>
    )
  }

  return (
    <div className="font-mono">
      <div className="border border-accent/50 bg-accent/5 px-3 py-2 mb-4 text-sm text-accent">
        viewing at commit {sha.slice(0, 7)} (read-only)
      </div>

      <AsciiHeader frontmatter={recipe.frontmatter} />

      <div className="flex gap-2 mb-6">
        <Link
          href={`/cookbook/${owner}/${repo}/recipe/${path}`}
          className="border border-border px-3 py-1 text-sm hover:bg-muted text-foreground"
        >
          [ back to latest ]
        </Link>
        <Link
          href={`/cookbook/${owner}/${repo}/recipe/${path}/history`}
          className="border border-border px-3 py-1 text-sm hover:bg-muted text-foreground"
        >
          [ commits ]
        </Link>
      </div>

      <div className={PROSE_CLASSES}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {recipe.body}
        </ReactMarkdown>
      </div>
    </div>
  )
}
