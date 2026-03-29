'use client'

import { useQuery } from '@tanstack/react-query'
import { recipesQueryOptions } from '@/lib/queries/recipes'
import Link from 'next/link'
import type { GitHubContent } from '@/types'

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}K`
  return `${(bytes / (1024 * 1024)).toFixed(1)}M`
}

export function CookbookContents({
  owner,
  repo,
  branch,
}: {
  owner: string
  repo: string
  branch?: string
}) {
  const { data: contents, isLoading, isError } = useQuery(
    recipesQueryOptions(owner, repo, '', branch),
  )

  if (isLoading) {
    return (
      <div className="text-muted-foreground text-sm">
        <p>$ ls -la</p>
        <p>[ ... ]</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="text-destructive text-sm">
        <p>ERR: failed to load contents</p>
      </div>
    )
  }

  // Filter to only .md recipe files, exclude hidden files and README
  const recipes = (contents ?? []).filter(
    (item: GitHubContent) =>
      item.type === 'file' &&
      item.name.endsWith('.md') &&
      !item.name.startsWith('.') &&
      item.name !== 'README.md',
  )

  const sorted = [...recipes].sort((a: GitHubContent, b: GitHubContent) =>
    a.name.localeCompare(b.name),
  )

  if (sorted.length === 0) {
    return (
      <div className="border border-border p-6">
        <p className="text-muted-foreground text-sm mb-2">$ ls -la</p>
        <p className="text-muted-foreground text-sm mb-4">total 0</p>
        <p className="text-foreground text-sm mb-4">
          &gt; this cookbook is empty. add your first recipe.
        </p>
        <Link
          href={`/cookbook/${owner}/${repo}/recipe/new`}
          className="border border-primary text-primary px-4 py-1 text-sm hover:bg-primary hover:text-primary-foreground transition-colors inline-block"
        >
          [ + new recipe ]
        </Link>
      </div>
    )
  }

  return (
    <div className="border border-border">
      <div className="border-b border-border px-4 py-2 text-xs text-muted-foreground flex">
        <span className="w-8">t</span>
        <span className="flex-1">name</span>
        <span className="w-16 text-right">size</span>
      </div>
      {sorted.map((item: GitHubContent) => (
        <Link
          key={item.sha}
          href={`/cookbook/${owner}/${repo}/recipe/${item.name}`}
          className="flex px-4 py-2 text-sm hover:bg-muted/30 transition-colors border-b border-border last:border-b-0"
        >
          <span className="w-8">
            <span className="text-muted-foreground">-</span>
          </span>
          <span className="flex-1 text-primary">
            {item.name}
          </span>
          <span className="w-16 text-right text-muted-foreground">
            {formatSize(item.size)}
          </span>
        </Link>
      ))}
    </div>
  )
}
