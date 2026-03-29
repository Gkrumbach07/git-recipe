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
  params: Promise<{ owner: string; repo: string }>
}) {
  const { owner, repo } = await params
  const queryClient = getQueryClient()

  await Promise.all([
    prefetchCookbook(queryClient, owner, repo),
    prefetchRecipes(queryClient, owner, repo),
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CookbookView owner={owner} repo={repo} />
    </HydrationBoundary>
  )
}
