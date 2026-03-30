'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useInfiniteQuery } from '@tanstack/react-query'
import { historyInfiniteQueryOptions } from '@/lib/queries/history'
import { useRevertRecipe } from '@/lib/queries/history'
import { CommitDetail } from './commit-detail'
import type { GitHubCommit } from '@/types'

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const mon = d.toLocaleString('en', { month: 'short' })
  const day = String(d.getDate()).padStart(2, ' ')
  return `${mon} ${day}`
}

export function HistoryList({
  owner,
  repo,
  path,
  branch,
}: {
  owner: string
  repo: string
  path?: string
  branch?: string
}) {
  const [expandedSha, setExpandedSha] = useState<string | null>(null)
  const [revertConfirm, setRevertConfirm] = useState<string | null>(null)
  const revert = useRevertRecipe(owner, repo)

  const {
    data,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery(
    historyInfiniteQueryOptions(owner, repo, path, branch),
  )

  const commits = data?.pages.flat() ?? []

  if (isLoading) {
    return (
      <div className="text-muted-foreground text-sm">
        <p>$ git log --oneline{path ? ` -- ${path}` : ''}</p>
        <p>[ ... ]</p>
      </div>
    )
  }

  if (commits.length === 0) {
    return (
      <div className="border border-border p-6">
        <p className="text-muted-foreground text-sm">
          &gt; no commits found
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="text-muted-foreground text-sm mb-2">
        $ git log --oneline{path ? ` -- ${path}` : ''}
      </div>
      <div className="border border-border">
        {commits.map((commit: GitHubCommit) => {
          const firstLine = commit.commit.message.split('\n')[0]
          const isExpanded = expandedSha === commit.sha
          const isConfirming = revertConfirm === commit.sha

          return (
            <div
              key={commit.sha}
              className="border-b border-border last:border-b-0"
            >
              <div
                className="flex items-center px-4 py-2 text-sm hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() =>
                  setExpandedSha(isExpanded ? null : commit.sha)
                }
              >
                <span className="w-6 text-muted-foreground shrink-0">
                  {isExpanded ? 'v' : '>'}
                </span>
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
                  {formatDate(commit.commit.author.date)}
                </span>
              </div>

              {isExpanded && (
                <div className="px-4 pb-3 border-t border-border/50 bg-muted/10">
                  <div className="flex gap-2 py-2">
                    {path && (
                      <>
                        <Link
                          href={`/cookbook/${owner}/${repo}/recipe/${path}?at=${commit.sha}`}
                          className="border border-border px-2 py-0.5 text-xs hover:bg-muted text-foreground"
                        >
                          [ view at commit ]
                        </Link>
                        {!isConfirming ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setRevertConfirm(commit.sha)
                            }}
                            className="border border-border px-2 py-0.5 text-xs hover:bg-muted text-foreground"
                          >
                            [ revert to this ]
                          </button>
                        ) : (
                          <span className="flex gap-1 items-center text-xs">
                            <span className="text-muted-foreground">revert?</span>
                            <button
                              disabled={revert.isPending}
                              onClick={(e) => {
                                e.stopPropagation()
                                const title = firstLine.replace(/^(Update|Add|Delete) "(.+)"$/, '$2') || path
                                revert.mutate(
                                  { path, sha: commit.sha, title },
                                  {
                                    onSuccess: () => setRevertConfirm(null),
                                  },
                                )
                              }}
                              className="border border-border px-2 py-0.5 hover:bg-destructive/20 text-destructive"
                            >
                              {revert.isPending ? '[ ... ]' : '[ yes ]'}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setRevertConfirm(null)
                              }}
                              className="border border-border px-2 py-0.5 hover:bg-muted text-muted-foreground"
                            >
                              [ no ]
                            </button>
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  {revert.isError && revertConfirm === commit.sha && (
                    <div className="text-destructive text-xs mb-2">
                      ERR: {revert.error.message}
                    </div>
                  )}
                  <CommitDetail owner={owner} repo={repo} sha={commit.sha} />
                </div>
              )}
            </div>
          )
        })}
      </div>
      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="w-full border border-border border-t-0 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
        >
          {isFetchingNextPage ? '[ ... ]' : '[ load more ]'}
        </button>
      )}
    </div>
  )
}
