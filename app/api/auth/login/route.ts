import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { generateState } from 'arctic'
import { getGitHub } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const state = generateState()

  const cookieStore = await cookies()
  cookieStore.set('github_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 10, // 10 minutes
  })

  // ?install=1 sends new users to the GitHub App installation page.
  // Since "Request user authorization during installation" is enabled,
  // GitHub chains OAuth after installation automatically.
  const install = request.nextUrl.searchParams.get('install') === '1'

  if (install) {
    const appSlug = process.env.GITHUB_APP_SLUG || 'git-recipe'
    const installUrl = new URL(`https://github.com/apps/${appSlug}/installations/new`)
    installUrl.searchParams.set('state', state)
    return NextResponse.redirect(installUrl.toString())
  }

  // Default: standard OAuth flow for users who already have the app installed
  const github = getGitHub()
  const url = github.createAuthorizationURL(state, ['user'])
  return NextResponse.redirect(url)
}
