import { getSession, refreshSessionIfNeeded } from './auth'

export async function getToken(): Promise<string> {
  const session = await getSession()
  if (!session) throw new Error('Not authenticated')
  const refreshed = await refreshSessionIfNeeded(session)
  return refreshed.accessToken
}
