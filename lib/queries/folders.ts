'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as github from '@/lib/github'
import { fetchWithToken } from '@/lib/fetch-with-token'

export function useCreateFolder(owner: string, repo: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      name,
      parentPath = '',
      branch,
    }: {
      name: string
      parentPath?: string
      branch?: string
    }) => {
      return fetchWithToken((token) => {
        const folderPath = parentPath ? `${parentPath}/${name}` : name
        return github.createOrUpdateFile(
          token,
          owner,
          repo,
          `${folderPath}/.gitkeep`,
          '',
          undefined,
          `Create folder "${name}"`,
          branch,
        )
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [owner, repo, 'recipes'],
      })
    },
  })
}

export function useDeleteFolder(owner: string, repo: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      path,
      branch,
    }: {
      path: string
      branch?: string
    }) => {
      return fetchWithToken(async (token) => {
        // Recursively collect all files in the folder
        const files = await collectFiles(token, owner, repo, path, branch)

        await Promise.all(files.map(file =>
          github.deleteFile(
            token,
            owner,
            repo,
            file.path,
            file.sha,
            `Delete folder "${path}"`,
            branch,
          )
        ))
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [owner, repo, 'recipes'],
      })
    },
  })
}

async function collectFiles(
  token: string,
  owner: string,
  repo: string,
  path: string,
  branch?: string,
): Promise<Array<{ path: string; sha: string }>> {
  const contents = await github.listContents(token, owner, repo, path, branch)
  const files: Array<{ path: string; sha: string }> = []

  for (const item of contents) {
    if (item.type === 'file') {
      files.push({ path: item.path, sha: item.sha })
    } else if (item.type === 'dir') {
      const nested = await collectFiles(token, owner, repo, item.path, branch)
      files.push(...nested)
    }
  }

  return files
}
