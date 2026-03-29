'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { cookbookQueryOptions, useDeleteCookbook } from '@/lib/queries/cookbooks'

export function CookbookSettingsForm({
  owner,
  repo,
}: {
  owner: string
  repo: string
}) {
  const router = useRouter()
  const { data: cookbook } = useQuery(cookbookQueryOptions(owner, repo))
  const deleteCookbook = useDeleteCookbook()
  const [confirmDelete, setConfirmDelete] = useState('')
  const [showDelete, setShowDelete] = useState(false)

  async function handleDelete() {
    if (confirmDelete !== repo) return

    try {
      await deleteCookbook.mutateAsync({ owner, repo })
      router.push('/dashboard')
    } catch {
      // Error available via deleteCookbook.error
    }
  }

  if (!cookbook) {
    return (
      <div className="text-muted-foreground text-sm">[ ... ]</div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="border border-border p-4">
        <h2 className="text-sm text-foreground mb-4">&gt; cookbook info</h2>
        <div className="space-y-2 text-sm">
          <div className="flex gap-4">
            <span className="text-muted-foreground w-24">name:</span>
            <span className="text-foreground">{cookbook.name}</span>
          </div>
          <div className="flex gap-4">
            <span className="text-muted-foreground w-24">owner:</span>
            <span className="text-foreground">{cookbook.owner.login}</span>
          </div>
          <div className="flex gap-4">
            <span className="text-muted-foreground w-24">visibility:</span>
            <span className="text-foreground">
              {cookbook.private ? 'private' : 'public'}
            </span>
          </div>
          <div className="flex gap-4">
            <span className="text-muted-foreground w-24">branch:</span>
            <span className="text-foreground">{cookbook.default_branch}</span>
          </div>
          {cookbook.description && (
            <div className="flex gap-4">
              <span className="text-muted-foreground w-24">desc:</span>
              <span className="text-foreground">{cookbook.description}</span>
            </div>
          )}
        </div>
      </div>

      <div className="border border-destructive/50 p-4">
        <h2 className="text-sm text-destructive mb-4">&gt; danger zone</h2>

        {!showDelete ? (
          <button
            onClick={() => setShowDelete(true)}
            className="border border-destructive text-destructive px-4 py-1 text-sm hover:bg-destructive hover:text-background transition-colors"
          >
            [ delete cookbook ]
          </button>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-foreground">
              This will permanently delete{' '}
              <span className="text-destructive">{owner}/{repo}</span> and all
              its recipes. This cannot be undone.
            </p>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">
                $ type &quot;{repo}&quot; to confirm:
              </label>
              <input
                type="text"
                value={confirmDelete}
                onChange={(e) => setConfirmDelete(e.target.value)}
                placeholder={repo}
                className="w-full max-w-sm bg-background border border-border px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:border-destructive"
              />
            </div>

            {deleteCookbook.isError && (
              <p className="text-destructive text-sm">
                ERR: {(deleteCookbook.error as Error).message}
              </p>
            )}

            <div className="flex gap-4">
              <button
                onClick={handleDelete}
                disabled={confirmDelete !== repo || deleteCookbook.isPending}
                className="border border-destructive text-destructive px-4 py-1 text-sm hover:bg-destructive hover:text-background transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteCookbook.isPending
                  ? '[ ... ]'
                  : '[ confirm delete ]'}
              </button>
              <button
                onClick={() => {
                  setShowDelete(false)
                  setConfirmDelete('')
                }}
                className="border border-border text-muted-foreground px-4 py-1 text-sm hover:text-foreground transition-colors"
              >
                [ cancel ]
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
