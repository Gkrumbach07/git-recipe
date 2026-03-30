'use client'

import { queryOptions, infiniteQueryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import * as github from '@/lib/github'
import { parseRecipe } from '@/lib/recipe'
import { fetchWithToken } from '@/lib/fetch-with-token'

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

export function lastCommitQueryOptions(
  owner: string,
  repo: string,
  path: string,
  branch?: string,
  token?: string,
) {
  return queryOptions({
    queryKey: [owner, repo, 'last-commit', path, branch].filter(Boolean) as string[],
    queryFn: () => {
      const doFetch = (t: string) =>
        github.listCommits(t, owner, repo, path, branch, 1, 1)
      return token ? doFetch(token) : fetchWithToken(doFetch)
    },
    staleTime: 5 * 60 * 1000,
  })
}

const COMMITS_PER_PAGE = 30

export function historyInfiniteQueryOptions(
  owner: string,
  repo: string,
  path?: string,
  branch?: string,
  token?: string,
) {
  return infiniteQueryOptions({
    queryKey: [owner, repo, 'history', path, branch].filter(Boolean) as string[],
    queryFn: ({ pageParam = 1 }) => {
      const doFetch = (t: string) =>
        github.listCommits(t, owner, repo, path, branch, pageParam, COMMITS_PER_PAGE)
      return token ? doFetch(token) : fetchWithToken(doFetch)
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage.length === COMMITS_PER_PAGE ? lastPageParam + 1 : undefined,
    staleTime: 5 * 60 * 1000,
  })
}

export function commitQueryOptions(
  owner: string,
  repo: string,
  sha: string,
  token?: string,
) {
  return queryOptions({
    queryKey: [owner, repo, 'commit', sha],
    queryFn: () =>
      token
        ? github.getCommit(token, owner, repo, sha)
        : fetchWithToken((t) => github.getCommit(t, owner, repo, sha)),
    staleTime: 10 * 60 * 1000,
  })
}

export function fileAtCommitQueryOptions(
  owner: string,
  repo: string,
  path: string,
  sha: string,
  token?: string,
) {
  return queryOptions({
    queryKey: [owner, repo, 'recipe-at', path, sha],
    queryFn: async () => {
      const doFetch = async (t: string) => {
        const file = await github.getFile(t, owner, repo, path, sha)
        return parseRecipe(file.content!, file.sha)
      }
      return token ? doFetch(token) : fetchWithToken(doFetch)
    },
    staleTime: Infinity,
  })
}

export function useRevertRecipe(owner: string, repo: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      path,
      sha,
      title,
    }: {
      path: string
      sha: string
      title: string
    }) => {
      const res = await fetch('/api/auth/token')
      const { token } = await res.json()

      const file = await github.getFile(token, owner, repo, path, sha)
      const oldContent = Buffer.from(file.content!, 'base64').toString('utf-8')

      const current = await github.getFile(token, owner, repo, path)

      return github.createOrUpdateFile(
        token,
        owner,
        repo,
        path,
        oldContent,
        current.sha,
        `Revert "${title}" to ${sha.slice(0, 7)}`,
      )
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: [owner, repo, 'recipe', vars.path],
      })
      queryClient.invalidateQueries({
        queryKey: [owner, repo, 'recipes'],
      })
      queryClient.invalidateQueries({
        queryKey: [owner, repo, 'history'],
      })
    },
  })
}
