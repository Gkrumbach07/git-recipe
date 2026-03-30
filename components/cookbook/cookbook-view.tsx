'use client'

import { useState, useRef, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { cookbookQueryOptions } from '@/lib/queries/cookbooks'
import { useClickOutside } from '@/hooks/use-click-outside'
import { CookbookContents } from './cookbook-contents'
import { RecipeSearch } from './recipe-search'
import { CreateFolder } from './create-folder'
import Link from 'next/link'

function CookbookMenu({
  basePath,
  owner,
  repo,
  path,
  branch,
}: {
  basePath: string
  owner: string
  repo: string
  path: string
  branch?: string
}) {
  const [open, setOpen] = useState(false)
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const closeMenu = useCallback(() => setOpen(false), [])
  useClickOutside(ref, closeMenu)

  return (
    <>
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(!open)}
          className="border border-border text-muted-foreground px-3 py-1 text-sm hover:text-foreground transition-colors whitespace-nowrap"
        >
          [ ... ]
        </button>
        {open && (
          <div className="absolute top-full left-0 mt-1 z-10 border border-border bg-background min-w-[140px]">
            <button
              onClick={() => { setShowCreateFolder(true); setOpen(false) }}
              className="w-full text-left px-3 py-1.5 text-sm text-foreground hover:bg-muted/50"
            >
              new folder
            </button>
            {!path && (
              <>
                <Link
                  href={`${basePath}/history`}
                  onClick={() => setOpen(false)}
                  className="block w-full text-left px-3 py-1.5 text-sm text-foreground hover:bg-muted/50 border-t border-border"
                >
                  commits
                </Link>
                <Link
                  href={`${basePath}/settings`}
                  onClick={() => setOpen(false)}
                  className="block w-full text-left px-3 py-1.5 text-sm text-foreground hover:bg-muted/50 border-t border-border"
                >
                  settings
                </Link>
              </>
            )}
          </div>
        )}
      </div>
      <CreateFolder
        owner={owner}
        repo={repo}
        path={path}
        branch={branch}
        open={showCreateFolder}
        onClose={() => setShowCreateFolder(false)}
      />
    </>
  )
}

export function CookbookView({
  owner,
  repo,
  path = '',
  branch,
}: {
  owner: string
  repo: string
  path?: string
  branch?: string
}) {
  const { data: cookbook, isError, error } = useQuery(cookbookQueryOptions(owner, repo))

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

  const basePath = `/cookbook/${owner}/${repo}`
  const segments = path ? path.split('/').filter(Boolean) : []

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 overflow-x-auto">
        <Link href="/dashboard" className="hover:text-foreground whitespace-nowrap">
          ~/cookbooks
        </Link>
        <span>/</span>
        <Link
          href={basePath}
          className="hover:text-foreground whitespace-nowrap"
        >
          {repo}
        </Link>
        {segments.map((segment, i) => {
          const segmentPath = segments.slice(0, i + 1).join('/')
          const isLast = i === segments.length - 1
          return (
            <span key={i} className="flex items-center gap-2">
              <span>/</span>
              {isLast ? (
                <span className="text-foreground whitespace-nowrap">{segment}</span>
              ) : (
                <Link
                  href={`${basePath}/${segmentPath}`}
                  className="hover:text-foreground whitespace-nowrap"
                >
                  {segment}
                </Link>
              )}
            </span>
          )
        })}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Link
          href={`${basePath}/recipe/new${path ? `?folder=${encodeURIComponent(path)}` : ''}`}
          className="border border-primary text-primary px-3 py-1 text-sm hover:bg-primary hover:text-primary-foreground transition-colors whitespace-nowrap"
        >
          [ + recipe ]
        </Link>
        <CookbookMenu basePath={basePath} owner={owner} repo={repo} path={path} branch={branch} />
        <RecipeSearch owner={owner} repo={repo} />
      </div>

      {/* Description */}
      {!path && cookbook?.description && (
        <p className="text-sm text-muted-foreground mb-4 border-b border-border pb-4">
          -- {cookbook.description}
        </p>
      )}

      {/* Contents */}
      <CookbookContents
        owner={owner}
        repo={repo}
        path={path}
        branch={branch}
      />
    </div>
  )
}
