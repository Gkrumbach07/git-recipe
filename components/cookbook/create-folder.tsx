'use client'

import { useState } from 'react'
import { useCreateFolder } from '@/lib/queries/folders'

export function CreateFolder({
  owner,
  repo,
  path = '',
  branch,
  open,
  onClose,
}: {
  owner: string
  repo: string
  path?: string
  branch?: string
  open: boolean
  onClose: () => void
}) {
  const [name, setName] = useState('')
  const createFolder = useCreateFolder(owner, repo)

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return

    createFolder.mutate(
      { name: trimmed, parentPath: path, branch },
      {
        onSuccess: () => {
          setName('')
          onClose()
        },
      },
    )
  }

  return (
    <div className="fixed inset-0 bg-background/80 z-50 flex items-center justify-center p-4">
      <div className="border border-border bg-background p-6 max-w-sm w-full">
        <h2 className="text-sm text-foreground mb-4">$ mkdir{path ? ` ${path}/` : ' '}</h2>
        <form onSubmit={handleSubmit}>
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="folder-name"
            className="w-full bg-transparent border border-border px-3 py-1.5 text-sm text-foreground mb-4 focus:outline-none focus:border-primary placeholder:text-muted-foreground/50"
          />
          {createFolder.isError && (
            <p className="text-xs text-destructive mb-3">ERR: {createFolder.error.message}</p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createFolder.isPending || !name.trim()}
              className="border border-border px-3 py-1 text-sm text-foreground hover:bg-muted disabled:opacity-50"
            >
              {createFolder.isPending ? '[ ... ]' : '[ create ]'}
            </button>
            <button
              type="button"
              onClick={() => { setName(''); onClose() }}
              className="border border-border px-3 py-1 text-sm text-muted-foreground hover:bg-muted"
            >
              [ cancel ]
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
