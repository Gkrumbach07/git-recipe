import { NextResponse } from 'next/server'
import { getSession, refreshSessionIfNeeded, clearSessionAsync } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const refreshed = await refreshSessionIfNeeded(session)
    return NextResponse.json({ token: refreshed.accessToken })
  } catch {
    await clearSessionAsync()
    return NextResponse.json({ error: 'Session expired' }, { status: 401 })
  }
}
