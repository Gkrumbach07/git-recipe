'use client'

import { useQuery } from '@tanstack/react-query'

interface SessionUser {
  login: string
  name: string | null
  avatarUrl: string
}

export function useSession() {
  const { data, isLoading, isError } = useQuery<SessionUser>({
    queryKey: ['session'],
    queryFn: async () => {
      const res = await fetch('/api/auth/me')
      if (!res.ok) throw new Error('Not authenticated')
      return res.json()
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  })

  return { user: data ?? null, isLoading, isError }
}
