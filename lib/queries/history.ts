'use client'

import { queryOptions } from '@tanstack/react-query'
import * as github from '@/lib/github'

async function fetchWithToken<T>(
  fn: (token: string) => Promise<T>,
): Promise<T> {
  const res = await fetch('/api/auth/token')
  const { token } = await res.json()
  return fn(token)
}

export function historyQueryOptions(
  owner: string,
  repo: string,
  path?: string,
  branch?: string,
  token?: string,
) {
  return queryOptions({
    queryKey: [owner, repo, 'history', path, branch].filter(Boolean) as string[],
    queryFn: () =>
      token
        ? github.listCommits(token, owner, repo, path, branch)
        : fetchWithToken((t) => github.listCommits(t, owner, repo, path, branch)),
    staleTime: 5 * 60 * 1000,
  })
}
