import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getGitHub, setSession, type SessionPayload } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')

  const cookieStore = await cookies()
  const storedState = cookieStore.get('github_oauth_state')?.value

  if (!code || !state || !storedState || state !== storedState) {
    return NextResponse.redirect(new URL('/login?error=invalid_state', request.url))
  }

  try {
    const github = getGitHub()
    const tokens = await github.validateAuthorizationCode(code)

    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokens.accessToken()}`,
        Accept: 'application/vnd.github+json',
      },
    })

    if (!userResponse.ok) {
      return NextResponse.redirect(new URL('/login?error=user_fetch_failed', request.url))
    }

    const githubUser = await userResponse.json()

    const session: SessionPayload = {
      accessToken: tokens.accessToken(),
      refreshToken: tokens.hasRefreshToken() ? tokens.refreshToken() : '',
      expiresAt: Math.floor(tokens.accessTokenExpiresAt().getTime() / 1000),
      user: {
        id: githubUser.id,
        login: githubUser.login,
        name: githubUser.name ?? null,
        avatarUrl: githubUser.avatar_url,
      },
    }

    await setSession(session)
    cookieStore.delete('github_oauth_state')

    return NextResponse.redirect(new URL('/dashboard', request.url))
  } catch {
    return NextResponse.redirect(new URL('/login?error=callback_failed', request.url))
  }
}
