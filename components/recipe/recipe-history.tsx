'use client'

import { useQuery } from '@tanstack/react-query'
import { historyQueryOptions } from '@/lib/queries/history'
import { timeAgo } from '@/lib/utils'
import type { GitHubCommit } from '@/types'

export function RecipeHistory({
  owner,
  repo,
  path,
  branch,
}: {
  owner: string
  repo: string
  path: string
  branch?: string
}) {
  const { data: commits, isLoading } = useQuery(
    historyQueryOptions(owner, repo, path, branch),
  )

  if (isLoading) {
    return (
      <div className="text-muted-foreground text-sm">
        <p>$ git log --oneline -- {path}</p>
        <p>[ ... ]</p>
      </div>
    )
  }

  if (!commits || commits.length === 0) {
    return (
      <div className="border border-border p-6">
        <p className="text-muted-foreground text-sm">
          &gt; no commits for this recipe
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="text-muted-foreground text-sm mb-2">
        $ git log --oneline -- {path}
      </div>
      <div className="border border-border">
        {commits.map((commit: GitHubCommit) => {
          const firstLine = commit.commit.message.split('\n')[0]
          return (
            <div
              key={commit.sha}
              className="flex items-center px-4 py-2 text-sm border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors"
            >
              <span className="w-20 text-accent shrink-0">
                {commit.sha.slice(0, 7)}
              </span>
              <span className="flex-1 text-foreground truncate min-w-0">
                {firstLine}
              </span>
              <span className="w-24 text-right text-muted-foreground shrink-0 ml-2">
                {commit.author?.login ?? commit.commit.author.name}
              </span>
              <span className="w-16 text-right text-muted-foreground shrink-0 ml-2">
                {timeAgo(commit.commit.author.date)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
