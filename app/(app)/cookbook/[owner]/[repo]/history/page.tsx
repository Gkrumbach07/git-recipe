import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { getQueryClient } from '@/app/get-query-client'
import { prefetchHistory } from '@/lib/queries/server-prefetch'
import { HistoryList } from '@/components/cookbook/history-list'
import Link from 'next/link'

export default async function CookbookHistoryPage({
  params,
}: {
  params: Promise<{ owner: string; repo: string }>
}) {
  const { owner, repo } = await params
  const queryClient = getQueryClient()

  await prefetchHistory(queryClient, owner, repo)

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/dashboard" className="hover:text-foreground">
            ~/cookbooks
          </Link>
          <span>/</span>
          <Link
            href={`/cookbook/${owner}/${repo}`}
            className="hover:text-foreground"
          >
            {owner}/{repo}
          </Link>
          <span>/</span>
          <span className="text-foreground">commits</span>
        </div>
        <h1 className="text-lg text-foreground mb-4">[ commits ]</h1>
        <HistoryList owner={owner} repo={repo} />
      </div>
    </HydrationBoundary>
  )
}
