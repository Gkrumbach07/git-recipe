'use client'

import { useQuery } from '@tanstack/react-query'
import { useRef, useEffect } from 'react'

interface SessionUser {
  login: string
  name: string | null
  avatarUrl: string
}

export function useSession() {
  const redirecting = useRef(false)
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

  useEffect(() => {
    if (isError && !redirecting.current) {
      redirecting.current = true
      window.location.href = '/login'
    }
  }, [isError])

  if (isError) {
    return { user: null, isLoading: true, isError: false }
  }

  return { user: data ?? null, isLoading, isError }
}
