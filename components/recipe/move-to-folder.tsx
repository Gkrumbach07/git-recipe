'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { recipesQueryOptions, useMoveRecipe } from '@/lib/queries/recipes'
import type { GitHubContent } from '@/types'

export function MoveToFolder({
  owner,
  repo,
  path,
  onClose,
}: {
  owner: string
  repo: string
  path: string
  onClose: () => void
}) {
  const router = useRouter()
  const move = useMoveRecipe(owner, repo)
  const [selected, setSelected] = useState<string>('')

  const { data: rootContents } = useQuery(
    recipesQueryOptions(owner, repo, ''),
  )

  const folders = (rootContents ?? []).filter(
    (item: GitHubContent) => item.type === 'dir' && !item.name.startsWith('.'),
  )

  const currentFolder = path.includes('/') ? path.substring(0, path.lastIndexOf('/')) : ''
  const fileName = path.includes('/') ? path.substring(path.lastIndexOf('/') + 1) : path

  const handleMove = () => {
    const newPath = selected ? `${selected}/${fileName}` : fileName
    if (newPath === path) {
      onClose()
      return
    }
    move.mutate(
      { oldPath: path, newPath },
      {
        onSuccess: () => {
          router.push(`/cookbook/${owner}/${repo}/recipe/${newPath}`)
          onClose()
        },
      },
    )
  }

  return (
    <div className="fixed inset-0 bg-background/80 z-50 flex items-center justify-center p-4">
      <div className="border border-border bg-background p-6 max-w-sm w-full">
        <h2 className="text-sm text-foreground mb-4">$ mv {fileName}</h2>

        <div className="border border-border mb-4 max-h-48 overflow-y-auto">
          <button
            onClick={() => setSelected('')}
            className={`w-full text-left px-3 py-1.5 text-sm border-b border-border last:border-b-0 ${
              selected === '' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/30'
            }`}
          >
            / (root)
          </button>
          {folders.map((folder: GitHubContent) => (
            <button
              key={folder.sha}
              onClick={() => setSelected(folder.path)}
              className={`w-full text-left px-3 py-1.5 text-sm border-b border-border last:border-b-0 ${
                selected === folder.path ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/30'
              }`}
            >
              /{folder.name}/
            </button>
          ))}
        </div>

        {currentFolder === selected && (
          <p className="text-xs text-muted-foreground mb-3">already in this folder</p>
        )}

        {move.isError && (
          <p className="text-xs text-destructive mb-3">ERR: {move.error.message}</p>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleMove}
            disabled={move.isPending || currentFolder === selected}
            className="border border-border px-3 py-1 text-sm text-foreground hover:bg-muted disabled:opacity-50"
          >
            {move.isPending ? '[ ... ]' : '[ move ]'}
          </button>
          <button
            onClick={onClose}
            className="border border-border px-3 py-1 text-sm text-muted-foreground hover:bg-muted"
          >
            [ cancel ]
          </button>
        </div>
      </div>
    </div>
  )
}
