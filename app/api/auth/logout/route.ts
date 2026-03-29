import { NextResponse } from 'next/server'
import { clearSessionAsync } from '@/lib/auth'

export async function GET(request: Request) {
  await clearSessionAsync()
  return NextResponse.redirect(new URL('/', request.url))
}

export async function POST(request: Request) {
  await clearSessionAsync()
  return NextResponse.redirect(new URL('/', request.url))
}
