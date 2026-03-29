import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { getQueryClient } from '@/app/get-query-client'
import { prefetchCookbook } from '@/lib/queries/server-prefetch'
import { CookbookSettingsForm } from '@/components/cookbook/cookbook-settings-form'
import Link from 'next/link'

export default async function CookbookSettingsPage({
  params,
}: {
  params: Promise<{ owner: string; repo: string }>
}) {
  const { owner, repo } = await params
  const queryClient = getQueryClient()

  await prefetchCookbook(queryClient, owner, repo)

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="p-6 max-w-2xl mx-auto">
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
          <span className="text-foreground">settings</span>
        </div>
        <h1 className="text-lg text-foreground mb-6">[ settings ]</h1>
        <CookbookSettingsForm owner={owner} repo={repo} />
      </div>
    </HydrationBoundary>
  )
}
