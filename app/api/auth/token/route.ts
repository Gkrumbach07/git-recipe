import { NextResponse } from 'next/server'
import { getSession, refreshSessionIfNeeded } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const refreshed = await refreshSessionIfNeeded(session)
    return NextResponse.json({ token: refreshed.accessToken })
  } catch {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
  }
}
