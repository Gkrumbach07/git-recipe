import { QueryClient } from '@tanstack/react-query'
import { getToken } from '@/lib/get-token'
import * as github from '@/lib/github'
import { parseRecipe } from '@/lib/recipe'

export async function prefetchCookbooks(queryClient: QueryClient) {
  const token = await getToken()
  await queryClient.prefetchQuery({
    queryKey: ['cookbooks'],
    queryFn: async () => {
      const repos = await github.listRepos(token)
      const cookbooks = []
      for (const repo of repos) {
        try {
          await github.getFile(token, repo.owner.login, repo.name, '.gitrecipe')
          cookbooks.push(repo)
        } catch {
          // Not a cookbook
        }
      }
      return cookbooks
    },
    staleTime: 5 * 60 * 1000,
  })
}

export async function prefetchCookbook(
  queryClient: QueryClient,
  owner: string,
  repo: string,
) {
  const token = await getToken()
  await queryClient.prefetchQuery({
    queryKey: [owner, repo, 'cookbook'],
    queryFn: () => github.getRepo(token, owner, repo),
    staleTime: 5 * 60 * 1000,
  })
}

export async function prefetchRecipes(
  queryClient: QueryClient,
  owner: string,
  repo: string,
  path = '',
  branch?: string,
) {
  const token = await getToken()
  await queryClient.prefetchQuery({
    queryKey: [owner, repo, 'recipes', path, branch].filter(Boolean) as string[],
    queryFn: () => github.listContents(token, owner, repo, path, branch),
    staleTime: 2 * 60 * 1000,
  })
}

export async function prefetchRecipe(
  queryClient: QueryClient,
  owner: string,
  repo: string,
  path: string,
  branch?: string,
) {
  const token = await getToken()
  await queryClient.prefetchQuery({
    queryKey: [owner, repo, 'recipe', path, branch].filter(Boolean) as string[],
    queryFn: async () => {
      const file = await github.getFile(token, owner, repo, path, branch)
      return parseRecipe(file.content!, file.sha)
    },
    staleTime: 5 * 60 * 1000,
  })
}

export async function prefetchHistory(
  queryClient: QueryClient,
  owner: string,
  repo: string,
  path?: string,
  branch?: string,
) {
  const token = await getToken()
  await queryClient.prefetchQuery({
    queryKey: [owner, repo, 'history', path, branch].filter(Boolean) as string[],
    queryFn: () => github.listCommits(token, owner, repo, path, branch),
    staleTime: 5 * 60 * 1000,
  })
}

