import { redirect } from 'next/navigation'
import { getSession, refreshSessionIfNeeded, clearSessionAsync } from './auth'

export async function getToken(): Promise<string> {
  const session = await getSession()
  if (!session) redirect('/login')

  try {
    const refreshed = await refreshSessionIfNeeded(session)
    return refreshed.accessToken
  } catch {
    await clearSessionAsync()
    redirect('/login')
  }
}
