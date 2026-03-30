import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { getQueryClient } from '@/app/get-query-client'
import {
  prefetchCookbook,
  prefetchRecipes,
} from '@/lib/queries/server-prefetch'
import { CookbookView } from '@/components/cookbook/cookbook-view'

export default async function CookbookPage({
  params,
}: {
  params: Promise<{ owner: string; repo: string; path?: string[] }>
}) {
  const { owner, repo, path } = await params
  const folderPath = path?.join('/') ?? ''
  const queryClient = getQueryClient()

  await Promise.all([
    prefetchCookbook(queryClient, owner, repo),
    prefetchRecipes(queryClient, owner, repo, folderPath),
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CookbookView owner={owner} repo={repo} path={folderPath} />
    </HydrationBoundary>
  )
}
