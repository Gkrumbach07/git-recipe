import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { getQueryClient } from '@/app/get-query-client'
import { prefetchCookbooks } from '@/lib/queries/server-prefetch'
import { CookbookList } from '@/components/cookbook/cookbook-list'
import Link from 'next/link'

export default async function DashboardPage() {
  const queryClient = getQueryClient()
  await prefetchCookbooks(queryClient)

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg text-foreground">~/cookbooks</h1>
          <Link
            href="/cookbook/new"
            className="border border-primary text-primary px-4 py-1 text-sm hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            [ + new ]
          </Link>
        </div>
        <CookbookList />
      </div>
    </HydrationBoundary>
  )
}
