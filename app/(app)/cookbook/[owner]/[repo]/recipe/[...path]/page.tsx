import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { getQueryClient } from '@/app/get-query-client'
import { prefetchRecipe } from '@/lib/queries/server-prefetch'
import { RecipeViewer } from '@/components/recipe/recipe-viewer'
import { RecipeAtCommit } from '@/components/recipe/recipe-at-commit'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { EditRecipeClient } from './edit-client'

export default async function RecipePage({
  params,
  searchParams,
}: {
  params: Promise<{ owner: string; repo: string; path: string[] }>
  searchParams: Promise<{ at?: string }>
}) {
  const { owner, repo, path } = await params
  const { at: atCommit } = await searchParams
  const lastSegment = path[path.length - 1]

  const isEdit = lastSegment === 'edit'
  const isHistory = lastSegment === 'history'

  const recipePath = isEdit || isHistory
    ? path.slice(0, -1).join('/')
    : path.join('/')

  if (isHistory) {
    const { prefetchHistory } = await import('@/lib/queries/server-prefetch')
    const historyQueryClient = getQueryClient()
    await prefetchHistory(historyQueryClient, owner, repo, recipePath)

    const { HistoryList } = await import('@/components/cookbook/history-list')
    return (
      <div className="p-8">
        <Breadcrumb owner={owner} repo={repo} path={recipePath} />
        <h1 className="font-mono text-lg text-foreground mb-4">[ recipe commits ]</h1>
        <HydrationBoundary state={dehydrate(historyQueryClient)}>
          <HistoryList owner={owner} repo={repo} path={recipePath} />
        </HydrationBoundary>
      </div>
    )
  }

  const queryClient = getQueryClient()

  if (isEdit) {
    void prefetchRecipe(queryClient, owner, repo, recipePath)
    return (
      <div className="p-8">
        <Breadcrumb owner={owner} repo={repo} path={recipePath} />
        <h1 className="font-mono text-lg text-foreground mb-6">[ edit recipe ]</h1>
        <HydrationBoundary state={dehydrate(queryClient)}>
          <EditRecipeClient
            owner={owner}
            repo={repo}
            recipePath={recipePath}
          />
        </HydrationBoundary>
      </div>
    )
  }

  if (atCommit) {
    return (
      <div className="p-8">
        <Breadcrumb owner={owner} repo={repo} path={recipePath} />
        <RecipeAtCommit
          owner={owner}
          repo={repo}
          path={recipePath}
          sha={atCommit}
        />
      </div>
    )
  }

  void prefetchRecipe(queryClient, owner, repo, recipePath)

  return (
    <div className="p-8">
      <Breadcrumb owner={owner} repo={repo} path={recipePath} />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <RecipeViewer owner={owner} repo={repo} path={recipePath} />
      </HydrationBoundary>
    </div>
  )
}
