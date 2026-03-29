'use client'

import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import * as github from '@/lib/github'
import type { Cookbook, CreateCookbookData } from '@/types'

async function fetchWithToken<T>(
  fn: (token: string) => Promise<T>,
): Promise<T> {
  const res = await fetch('/api/auth/token')
  const { token } = await res.json()
  return fn(token)
}

export function cookbooksQueryOptions(token?: string) {
  return queryOptions({
    queryKey: ['cookbooks'] as const,
    queryFn: async () => {
      const doFetch = async (t: string) => {
        const repos = await github.listRepos(t)
        const cookbooks: Cookbook[] = []
        for (const repo of repos) {
          try {
            await github.getFile(t, repo.owner.login, repo.name, '.gitrecipe')
            cookbooks.push(repo)
          } catch {
            // Not a cookbook — skip
          }
        }
        return cookbooks
      }
      return token ? doFetch(token) : fetchWithToken(doFetch)
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function cookbookQueryOptions(owner: string, repo: string, token?: string) {
  return queryOptions({
    queryKey: [owner, repo, 'cookbook'] as const,
    queryFn: () =>
      token
        ? github.getRepo(token, owner, repo)
        : fetchWithToken((t) => github.getRepo(t, owner, repo)),
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      if (error instanceof github.GitHubError && error.status === 404) return false
      return failureCount < 3
    },
  })
}

export function useCreateCookbook() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateCookbookData) => {
      const res = await fetch('/api/auth/token')
      const { token } = await res.json()

      const repo = await github.createRepo(token, {
        name: data.name,
        description: data.description,
        private: data.visibility !== 'public',
        auto_init: true,
      })

      await github.createOrUpdateFile(
        token,
        repo.owner.login,
        repo.name,
        '.gitrecipe',
        JSON.stringify({ version: 1, created: new Date().toISOString() }, null, 2),
        undefined,
        'Initialize cookbook',
      )

      return repo
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cookbooks'] })
    },
  })
}

export function useDeleteCookbook() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ owner, repo }: { owner: string; repo: string }) => {
      const res = await fetch('/api/auth/token')
      const { token } = await res.json()
      return github.deleteRepo(token, owner, repo)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cookbooks'] })
    },
  })
}

export function useForkCookbook() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ owner, repo }: { owner: string; repo: string }) => {
      const res = await fetch('/api/auth/token')
      const { token } = await res.json()
      return github.forkRepo(token, owner, repo)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cookbooks'] })
    },
  })
}
