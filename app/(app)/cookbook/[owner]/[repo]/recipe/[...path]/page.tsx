import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { getQueryClient } from '@/app/get-query-client'
import { prefetchRecipe } from '@/lib/queries/server-prefetch'
import { RecipeViewer } from '@/components/recipe/recipe-viewer'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { EditRecipeClient } from './edit-client'

export default async function RecipePage({
  params,
}: {
  params: Promise<{ owner: string; repo: string; path: string[] }>
}) {
  const { owner, repo, path } = await params
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
        <h1 className="font-mono text-lg text-foreground mb-4">[ recipe history ]</h1>
        <HydrationBoundary state={dehydrate(historyQueryClient)}>
          <HistoryList owner={owner} repo={repo} path={recipePath} />
        </HydrationBoundary>
      </div>
    )
  }

  const queryClient = getQueryClient()

  void prefetchRecipe(queryClient, owner, repo, recipePath)

  if (isEdit) {
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

  return (
    <div className="p-8">
      <Breadcrumb owner={owner} repo={repo} path={recipePath} />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <RecipeViewer owner={owner} repo={repo} path={recipePath} />
      </HydrationBoundary>
    </div>
  )
}
