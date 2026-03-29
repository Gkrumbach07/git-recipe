'use client'

import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import * as github from '@/lib/github'
import { parseRecipe, serializeRecipe } from '@/lib/recipe'
import type {
  ParsedRecipe,
  CreateRecipeData,
  UpdateRecipeData,
} from '@/types'

async function fetchWithToken<T>(
  fn: (token: string) => Promise<T>,
): Promise<T> {
  const res = await fetch('/api/auth/token')
  const { token } = await res.json()
  return fn(token)
}

export function recipesQueryOptions(
  owner: string,
  repo: string,
  path = '',
  branch?: string,
  token?: string,
) {
  return queryOptions({
    queryKey: [owner, repo, 'recipes', path, branch].filter(Boolean) as string[],
    queryFn: () => {
      const doFetch = (t: string) => github.listContents(t, owner, repo, path, branch)
      return token ? doFetch(token) : fetchWithToken(doFetch)
    },
    staleTime: 2 * 60 * 1000,
  })
}

export function recipeQueryOptions(
  owner: string,
  repo: string,
  path: string,
  branch?: string,
  token?: string,
) {
  return queryOptions({
    queryKey: [owner, repo, 'recipe', path, branch].filter(Boolean) as string[],
    queryFn: (): Promise<ParsedRecipe> => {
      const doFetch = async (t: string) => {
        const file = await github.getFile(t, owner, repo, path, branch)
        return parseRecipe(file.content!, file.sha)
      }
      return token ? doFetch(token) : fetchWithToken(doFetch)
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateRecipe(owner: string, repo: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateRecipeData) => {
      const res = await fetch('/api/auth/token')
      const { token } = await res.json()

      const content = serializeRecipe(data.frontmatter, data.body)
      const message =
        data.message ?? `Add "${data.frontmatter.title}"`

      return github.createOrUpdateFile(
        token,
        owner,
        repo,
        data.path,
        content,
        undefined,
        message,
        data.branch,
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [owner, repo, 'recipes'],
      })
    },
  })
}

export function useUpdateRecipe(owner: string, repo: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdateRecipeData) => {
      const res = await fetch('/api/auth/token')
      const { token } = await res.json()

      const content = serializeRecipe(
        data.frontmatter,
        data.body,
      )
      const message =
        data.message ?? `Update "${data.frontmatter.title}"`

      return github.createOrUpdateFile(
        token,
        owner,
        repo,
        data.path,
        content,
        data.sha,
        message,
        data.branch,
      )
    },
    onMutate: async (newData) => {
      await queryClient.cancelQueries({
        queryKey: [owner, repo, 'recipe', newData.path],
      })
      const previous = queryClient.getQueryData<ParsedRecipe>([
        owner,
        repo,
        'recipe',
        newData.path,
      ])
      queryClient.setQueryData(
        [owner, repo, 'recipe', newData.path],
        {
          frontmatter: newData.frontmatter,
          body: newData.body,
          sha: newData.sha,
        } satisfies ParsedRecipe,
      )
      return { previous }
    },
    onError: (_err, vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          [owner, repo, 'recipe', vars.path],
          context.previous,
        )
      }
    },
    onSettled: (_data, _err, vars) => {
      queryClient.invalidateQueries({
        queryKey: [owner, repo, 'recipe', vars.path],
      })
      queryClient.invalidateQueries({
        queryKey: [owner, repo, 'recipes'],
      })
    },
  })
}

export function useDeleteRecipe(owner: string, repo: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      path,
      sha,
      title,
      branch,
    }: {
      path: string
      sha: string
      title: string
      branch?: string
    }) => {
      const res = await fetch('/api/auth/token')
      const { token } = await res.json()
      return github.deleteFile(
        token,
        owner,
        repo,
        path,
        sha,
        `Delete "${title}"`,
        branch,
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [owner, repo, 'recipes'],
      })
    },
  })
}

export function useMoveRecipe(owner: string, repo: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      oldPath,
      newPath,
      branch,
    }: {
      oldPath: string
      newPath: string
      branch?: string
    }) => {
      const res = await fetch('/api/auth/token')
      const { token } = await res.json()

      // Read old file
      const file = await github.getFile(token, owner, repo, oldPath, branch)
      const content = Buffer.from(file.content!, 'base64').toString('utf-8')

      // Create new file
      await github.createOrUpdateFile(
        token,
        owner,
        repo,
        newPath,
        content,
        undefined,
        `Move ${oldPath} to ${newPath}`,
        branch,
      )

      // Delete old file
      await github.deleteFile(
        token,
        owner,
        repo,
        oldPath,
        file.sha,
        `Move ${oldPath} to ${newPath}`,
        branch,
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [owner, repo, 'recipes'],
      })
    },
  })
}
