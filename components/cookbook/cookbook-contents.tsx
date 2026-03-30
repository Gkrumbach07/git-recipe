'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { recipesQueryOptions, useMoveRecipe, useDeleteRecipe } from '@/lib/queries/recipes'
import { useDeleteFolder } from '@/lib/queries/folders'
import Link from 'next/link'
import type { GitHubContent } from '@/types'

function FolderCount({
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
  const { data } = useQuery({
    ...recipesQueryOptions(owner, repo, path, branch),
    staleTime: 5 * 60 * 1000,
  })

  if (!data) return null

  const count = data.filter(
    (i: GitHubContent) =>
      (i.type === 'file' && i.name.endsWith('.md') && !i.name.startsWith('.') && i.name !== 'README.md') ||
      i.type === 'dir',
  ).length

  return <span className="text-muted-foreground">{count} items</span>
}

function SelectionBar({
  count,
  folders,
  currentPath,
  onMove,
  onDelete,
  onClear,
  busy,
}: {
  count: number
  folders: GitHubContent[]
  currentPath: string
  onMove: (target: string) => void
  onDelete: () => void
  onClear: () => void
  busy: boolean
}) {
  const [showTargets, setShowTargets] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div className="border-b border-border px-4 py-2 flex items-center gap-2 bg-muted/20 text-sm">
      <span className="text-foreground">{count} selected</span>
      <div className="relative">
        <button
          onClick={() => { setShowTargets(!showTargets); setConfirmDelete(false) }}
          disabled={busy}
          className="border border-border px-2 py-0.5 text-xs text-foreground hover:bg-muted disabled:opacity-50"
        >
          {busy ? '[ ... ]' : '[ move to ]'}
        </button>
        {showTargets && (
          <div className="absolute top-full left-0 mt-1 z-10 border border-border bg-background min-w-[160px]">
            {currentPath && (
              <button
                onClick={() => { onMove(''); setShowTargets(false) }}
                className="w-full text-left px-3 py-1.5 text-sm text-foreground hover:bg-muted/50"
              >
                / (root)
              </button>
            )}
            {folders
              .filter((f) => f.path !== currentPath)
              .map((folder) => (
                <button
                  key={folder.sha}
                  onClick={() => { onMove(folder.path); setShowTargets(false) }}
                  className="w-full text-left px-3 py-1.5 text-sm text-foreground hover:bg-muted/50 border-t border-border"
                >
                  /{folder.name}/
                </button>
              ))}
            {folders.filter((f) => f.path !== currentPath).length === 0 && !currentPath && (
              <div className="px-3 py-1.5 text-xs text-muted-foreground">
                no folders
              </div>
            )}
          </div>
        )}
      </div>
      {!confirmDelete ? (
        <button
          onClick={() => { setConfirmDelete(true); setShowTargets(false) }}
          disabled={busy}
          className="border border-border px-2 py-0.5 text-xs text-destructive hover:bg-destructive/10 disabled:opacity-50"
        >
          [ delete ]
        </button>
      ) : (
        <span className="flex gap-1 items-center text-xs">
          <span className="text-muted-foreground">delete {count}?</span>
          <button
            onClick={() => { onDelete(); setConfirmDelete(false) }}
            disabled={busy}
            className="border border-border px-2 py-0.5 text-destructive hover:bg-destructive/10 disabled:opacity-50"
          >
            {busy ? '...' : '[ yes ]'}
          </button>
          <button
            onClick={() => setConfirmDelete(false)}
            className="border border-border px-2 py-0.5 text-muted-foreground hover:bg-muted"
          >
            [ no ]
          </button>
        </span>
      )}
      <button
        onClick={onClear}
        className="text-xs text-muted-foreground hover:text-foreground"
      >
        [x] clear
      </button>
    </div>
  )
}

export function CookbookContents({
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
  const [deletingFolder, setDeletingFolder] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const queryClient = useQueryClient()
  const deleteFolder = useDeleteFolder(owner, repo)
  const moveRecipe = useMoveRecipe(owner, repo)
  const deleteRecipe = useDeleteRecipe(owner, repo)

  const { data: contents, isLoading, isError } = useQuery(
    recipesQueryOptions(owner, repo, path, branch),
  )

  // Also fetch root contents to get all folders for move targets
  const { data: rootContents } = useQuery(
    recipesQueryOptions(owner, repo, '', branch),
  )

  const allFolders = (rootContents ?? []).filter(
    (item: GitHubContent) => item.type === 'dir' && !item.name.startsWith('.'),
  )

  if (isLoading) {
    return (
      <div className="text-muted-foreground text-sm">
        <p>$ ls -la{path ? ` ${path}/` : ''}</p>
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

  const items = (contents ?? []).filter(
    (item: GitHubContent) =>
      !item.name.startsWith('.') &&
      item.name !== 'README.md',
  )

  const folders = items
    .filter((item: GitHubContent) => item.type === 'dir')
    .sort((a: GitHubContent, b: GitHubContent) => a.name.localeCompare(b.name))

  const recipes = items
    .filter(
      (item: GitHubContent) =>
        item.type === 'file' && item.name.endsWith('.md'),
    )
    .sort((a: GitHubContent, b: GitHubContent) => a.name.localeCompare(b.name))

  const sorted = [...folders, ...recipes]

  if (sorted.length === 0) {
    return (
      <div className="border border-border p-6">
        <p className="text-muted-foreground text-sm mb-2">$ ls -la{path ? ` ${path}/` : ''}</p>
        <p className="text-muted-foreground text-sm mb-4">total 0</p>
        <p className="text-foreground text-sm mb-4">
          &gt; {path ? 'this folder is empty.' : 'this cookbook is empty. add your first recipe.'}
        </p>
        <Link
          href={`/cookbook/${owner}/${repo}/recipe/new${path ? `?folder=${encodeURIComponent(path)}` : ''}`}
          className="border border-primary text-primary px-4 py-1 text-sm hover:bg-primary hover:text-primary-foreground transition-colors inline-block"
        >
          [ + new recipe ]
        </Link>
      </div>
    )
  }

  const basePath = `/cookbook/${owner}/${repo}`

  const toggleSelect = (filePath: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(filePath)) {
        next.delete(filePath)
      } else {
        next.add(filePath)
      }
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === recipes.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(recipes.map((r) => r.path)))
    }
  }

  const handleBatchMove = async (targetFolder: string) => {
    const paths = Array.from(selected)
    for (const oldPath of paths) {
      const fileName = oldPath.split('/').pop()!
      const newPath = targetFolder ? `${targetFolder}/${fileName}` : fileName
      if (newPath !== oldPath) {
        await moveRecipe.mutateAsync({ oldPath, newPath, branch })
      }
    }
    setSelected(new Set())
    await queryClient.invalidateQueries({ queryKey: [owner, repo, 'recipes'] })
  }

  const handleBatchDelete = async () => {
    const paths = Array.from(selected)
    const allItems = [...folders, ...recipes]
    await Promise.all(paths.map(async (filePath) => {
      const item = allItems.find((i) => i.path === filePath)
      if (item) {
        const title = item.name.replace(/\.md$/, '')
        await deleteRecipe.mutateAsync({ path: filePath, sha: item.sha, title, branch })
      }
    }))
    setSelected(new Set())
    await queryClient.invalidateQueries({ queryKey: [owner, repo, 'recipes'] })
  }

  return (
    <div className="border border-border">
      {selected.size > 0 && (
        <SelectionBar
          count={selected.size}
          folders={allFolders}
          currentPath={path}
          onMove={handleBatchMove}
          onDelete={handleBatchDelete}
          onClear={() => setSelected(new Set())}
          busy={moveRecipe.isPending || deleteRecipe.isPending}
        />
      )}
      <div className="border-b border-border px-4 py-2 text-xs text-muted-foreground flex items-center">
        {recipes.length > 0 && (
          <span className="w-7 shrink-0">
            <button
              onClick={toggleAll}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {selected.size === recipes.length && recipes.length > 0 ? '[x]' : '[ ]'}
            </button>
          </span>
        )}
        <span className="flex-1">name</span>
      </div>
      {sorted.map((item: GitHubContent) => {
        if (item.type === 'dir') {
          return (
            <div
              key={item.sha}
              className="flex items-center px-4 py-2 text-sm border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors"
            >
              <span className="w-7 shrink-0"></span>
              <Link href={`${basePath}/${item.path}`} className="flex-1 min-w-0 truncate">
                <span className="text-accent">{item.name}/</span>
              </Link>
              <span className="text-xs text-muted-foreground ml-2 shrink-0">
                <FolderCount owner={owner} repo={repo} path={item.path} branch={branch} />
              </span>
              <span className="shrink-0 whitespace-nowrap text-right">
                {deletingFolder === item.path ? (
                  <span className="inline-flex gap-1">
                    <button
                      disabled={deleteFolder.isPending}
                      onClick={() => {
                        deleteFolder.mutate(
                          { path: item.path, branch },
                          { onSuccess: () => setDeletingFolder(null) },
                        )
                      }}
                      className="border border-border px-2 py-0.5 text-xs text-destructive hover:bg-destructive/10"
                    >
                      {deleteFolder.isPending ? '[ ... ]' : '[ yes ]'}
                    </button>
                    <button
                      onClick={() => setDeletingFolder(null)}
                      className="border border-border px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted"
                    >
                      [ no ]
                    </button>
                  </span>
                ) : (
                  <button
                    onClick={() => setDeletingFolder(item.path)}
                    className="text-xs text-muted-foreground hover:text-destructive"
                    title="Delete folder"
                  >
                    [x]
                  </button>
                )}
              </span>
            </div>
          )
        }

        return (
          <div
            key={item.sha}
            className={`flex items-center px-4 py-2 text-sm border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors ${selected.has(item.path) ? 'bg-muted/20' : ''}`}
          >
            <span className="w-7 shrink-0">
              <button
                onClick={() => toggleSelect(item.path)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                {selected.has(item.path) ? '[x]' : '[ ]'}
              </button>
            </span>
            <Link href={`${basePath}/recipe/${item.path}`} className="flex-1 min-w-0 truncate">
              <span className="text-primary">{item.name}</span>
            </Link>
          </div>
        )
      })}
    </div>
  )
}
