'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { recipeQueryOptions } from '@/lib/queries/recipes'
import { RecipeDelete } from './recipe-delete'
import type { RecipeFrontmatter } from '@/types'

interface RecipeViewerProps {
  owner: string
  repo: string
  path: string
  branch?: string
}

function AsciiHeader({ frontmatter }: { frontmatter: RecipeFrontmatter }) {
  const meta: string[] = []
  if (frontmatter.servings) meta.push(`${frontmatter.servings} srv`)

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
          source: {frontmatter.source}
        </div>
      )}
    </div>
  )
}

export function RecipeViewer({ owner, repo, path, branch }: RecipeViewerProps) {
  const [showDelete, setShowDelete] = useState(false)
  const { data: recipe, isLoading, error } = useQuery(
    recipeQueryOptions(owner, repo, path, branch)
  )

  if (isLoading) {
    return <div className="p-8 font-mono text-muted-foreground">[ ... ]</div>
  }

  if (error) {
    return (
      <div className="p-8 font-mono text-destructive">
        ERR: {error.message}
      </div>
    )
  }

  if (!recipe) {
    return (
      <div className="p-8 font-mono text-muted-foreground">
        recipe not found
      </div>
    )
  }

  const editPath = `/cookbook/${owner}/${repo}/recipe/${path}/edit`
  const historyPath = `/cookbook/${owner}/${repo}/recipe/${path}/history`

  return (
    <div className="font-mono">
      <AsciiHeader frontmatter={recipe.frontmatter} />

      <div className="flex flex-wrap gap-2 mb-6">
        <Link
          href={editPath}
          className="border border-border px-3 py-1 text-sm hover:bg-muted text-foreground whitespace-nowrap"
        >
          [ Edit ]
        </Link>
        <Link
          href={historyPath}
          className="border border-border px-3 py-1 text-sm hover:bg-muted text-foreground whitespace-nowrap"
        >
          [ History ]
        </Link>
        <button
          onClick={() => setShowDelete(true)}
          className="border border-border px-3 py-1 text-sm hover:bg-destructive/20 text-destructive whitespace-nowrap"
        >
          [ Delete ]
        </button>
      </div>

      <div className="prose prose-invert max-w-none text-foreground [&_h1]:text-foreground [&_h2]:text-foreground [&_h3]:text-foreground [&_h4]:text-foreground [&_p]:text-foreground [&_li]:text-foreground [&_a]:text-primary [&_strong]:text-foreground [&_code]:text-secondary [&_code]:bg-muted [&_code]:px-1 [&_pre]:bg-card [&_pre]:border [&_pre]:border-border [&_blockquote]:border-primary [&_blockquote]:text-muted-foreground [&_table]:border-border [&_th]:border-border [&_td]:border-border">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {recipe.body}
        </ReactMarkdown>
      </div>

      {showDelete && (
        <RecipeDelete
          owner={owner}
          repo={repo}
          path={path}
          sha={recipe.sha}
          title={recipe.frontmatter.title}
          onClose={() => setShowDelete(false)}
        />
      )}
    </div>
  )
}
