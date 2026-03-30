'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { recipeQueryOptions, useDuplicateRecipe } from '@/lib/queries/recipes'
import { lastCommitQueryOptions } from '@/lib/queries/history'
import { timeAgo } from '@/lib/utils'
import { PROSE_CLASSES } from '@/lib/constants'
import { useClickOutside } from '@/hooks/use-click-outside'
import { AsciiHeader } from './ascii-header'
import { RecipeDelete } from './recipe-delete'
import { MoveToFolder } from './move-to-folder'

interface RecipeViewerProps {
  owner: string
  repo: string
  path: string
  branch?: string
}

function ActionsMenu({
  onDuplicate,
  onMove,
  onDelete,
  duplicating,
}: {
  onDuplicate: () => void
  onMove: () => void
  onDelete: () => void
  duplicating: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const closeMenu = useCallback(() => setOpen(false), [])
  useClickOutside(ref, closeMenu)

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="border border-border px-3 py-1 text-sm hover:bg-muted text-muted-foreground whitespace-nowrap"
      >
        [ ... ]
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-10 border border-border bg-background min-w-[140px]">
          <button
            disabled={duplicating}
            onClick={() => { onDuplicate(); setOpen(false) }}
            className="w-full text-left px-3 py-1.5 text-sm text-foreground hover:bg-muted/50 disabled:opacity-50"
          >
            {duplicating ? '...' : 'duplicate'}
          </button>
          <button
            onClick={() => { onMove(); setOpen(false) }}
            className="w-full text-left px-3 py-1.5 text-sm text-foreground hover:bg-muted/50 border-t border-border"
          >
            move
          </button>
          <button
            onClick={() => { onDelete(); setOpen(false) }}
            className="w-full text-left px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 border-t border-border"
          >
            delete
          </button>
        </div>
      )}
    </div>
  )
}

export function RecipeViewer({ owner, repo, path, branch }: RecipeViewerProps) {
  const [openDialog, setOpenDialog] = useState<'delete' | 'move' | null>(null)
  const router = useRouter()
  const duplicate = useDuplicateRecipe(owner, repo)
  const { data: commits } = useQuery(lastCommitQueryOptions(owner, repo, path, branch))
  const lastEdited = commits?.[0] ? timeAgo(commits[0].commit.author.date) : undefined
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

  const handleDuplicate = () => {
    duplicate.mutate(
      {
        sourcePath: path,
        branch,
      },
      {
        onSuccess: () => {
          const copyPath = path.replace(/\.md$/, '-copy.md')
          router.push(`/cookbook/${owner}/${repo}/recipe/${copyPath}`)
        },
      },
    )
  }

  return (
    <div className="font-mono">
      <AsciiHeader frontmatter={recipe.frontmatter} lastEdited={lastEdited} />

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
          [ Commits ]
        </Link>
        <ActionsMenu
          onDuplicate={handleDuplicate}
          onMove={() => setOpenDialog('move')}
          onDelete={() => setOpenDialog('delete')}
          duplicating={duplicate.isPending}
        />
      </div>

      <div className={PROSE_CLASSES}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {recipe.body}
        </ReactMarkdown>
      </div>

      {openDialog === 'move' && (
        <MoveToFolder
          owner={owner}
          repo={repo}
          path={path}
          onClose={() => setOpenDialog(null)}
        />
      )}

      {openDialog === 'delete' && (
        <RecipeDelete
          owner={owner}
          repo={repo}
          path={path}
          sha={recipe.sha}
          title={recipe.frontmatter.title}
          onClose={() => setOpenDialog(null)}
        />
      )}
    </div>
  )
}
