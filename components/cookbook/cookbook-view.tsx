'use client'

import { useQuery } from '@tanstack/react-query'
import { cookbookQueryOptions } from '@/lib/queries/cookbooks'
import { CookbookContents } from './cookbook-contents'
import Link from 'next/link'

export function CookbookView({
  owner,
  repo,
  branch,
}: {
  owner: string
  repo: string
  branch?: string
}) {
  const { data: cookbook, isError, error } = useQuery(cookbookQueryOptions(owner, repo))
  const currentBranch = branch ?? cookbook?.default_branch ?? 'main'

  if (isError) {
    return (
      <div className="p-8 font-mono">
        <p className="text-destructive">
          ERR: {(error as Error)?.message?.includes('404') ? 'cookbook not found' : (error as Error)?.message || 'failed to load cookbook'}
        </p>
        <p className="mt-2 text-muted-foreground">
          The cookbook <span className="text-foreground">{owner}/{repo}</span> doesn&apos;t exist or you don&apos;t have access.
        </p>
        <Link
          href="/dashboard"
          className="mt-4 inline-block border border-primary px-4 py-1 text-primary hover:bg-primary hover:text-primary-foreground"
        >
          [ back to dashboard ]
        </Link>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Link href="/dashboard" className="hover:text-foreground">
          ~/cookbooks
        </Link>
        <span>/</span>
        <Link
          href={`/cookbook/${owner}/${repo}`}
          className="hover:text-foreground"
        >
          {owner}/{repo}
        </Link>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-4 flex-nowrap overflow-x-auto">
        <Link
          href={`/cookbook/${owner}/${repo}/recipe/new`}
          className="border border-primary text-primary px-3 py-1 text-sm hover:bg-primary hover:text-primary-foreground transition-colors whitespace-nowrap"
        >
          [ + recipe ]
        </Link>
        <div className="flex-1" />
        <Link
          href={`/cookbook/${owner}/${repo}/history`}
          className="border border-border text-muted-foreground px-3 py-1 text-sm hover:text-foreground transition-colors whitespace-nowrap"
        >
          [ history ]
        </Link>
        <Link
          href={`/cookbook/${owner}/${repo}/settings`}
          className="border border-border text-muted-foreground px-3 py-1 text-sm hover:text-foreground transition-colors whitespace-nowrap"
        >
          [ settings ]
        </Link>
      </div>

      {/* Description */}
      {cookbook?.description && (
        <p className="text-sm text-muted-foreground mb-4 border-b border-border pb-4">
          -- {cookbook.description}
        </p>
      )}

      {/* Contents */}
      <CookbookContents
        owner={owner}
        repo={repo}
        branch={branch}
      />
    </div>
  )
}
