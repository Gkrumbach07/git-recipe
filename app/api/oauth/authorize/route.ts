import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { generateState } from 'arctic'
import { GitHub } from 'arctic'
import { verifyClientId, encryptOAuthParams } from '@/lib/mcp-oauth'

function getMcpGitHub(): GitHub {
  return new GitHub(
    process.env.GITHUB_APP_CLIENT_ID!,
    process.env.GITHUB_APP_CLIENT_SECRET!,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/callback`,
  )
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const clientId = url.searchParams.get('client_id')
  const redirectUri = url.searchParams.get('redirect_uri')
  const responseType = url.searchParams.get('response_type')
  const state = url.searchParams.get('state')
  const codeChallenge = url.searchParams.get('code_challenge')
  const codeChallengeMethod = url.searchParams.get('code_challenge_method')

  // Validate required parameters
  if (!clientId || !redirectUri || !state || !codeChallenge) {
    return Response.json(
      { error: 'invalid_request', error_description: 'Missing required parameters: client_id, redirect_uri, state, code_challenge' },
      { status: 400 },
    )
  }

  if (responseType && responseType !== 'code') {
    return Response.json(
      { error: 'unsupported_response_type', error_description: 'Only response_type=code is supported' },
      { status: 400 },
    )
  }

  if (codeChallengeMethod && codeChallengeMethod !== 'S256') {
    return Response.json(
      { error: 'invalid_request', error_description: 'Only S256 code_challenge_method is supported' },
      { status: 400 },
    )
  }

  // Verify client_id JWT and check redirect_uri
  try {
    const client = await verifyClientId(clientId)
    if (!client.redirectUris.includes(redirectUri)) {
      return Response.json(
        { error: 'invalid_request', error_description: 'redirect_uri does not match registered URIs' },
        { status: 400 },
      )
    }
  } catch {
    return Response.json(
      { error: 'invalid_client', error_description: 'Invalid client_id' },
      { status: 400 },
    )
  }

  // Store MCP OAuth params in an encrypted cookie
  const oauthParams = await encryptOAuthParams({
    redirectUri,
    state,
    codeChallenge,
    clientId,
  })

  const cookieStore = await cookies()
  cookieStore.set('mcp_oauth_params', oauthParams, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 10,
  })

  // Generate GitHub OAuth state and store it
  const githubState = generateState()
  cookieStore.set('mcp_github_state', githubState, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 10,
  })

  // Redirect to GitHub OAuth
  const github = getMcpGitHub()
  const githubUrl = github.createAuthorizationURL(githubState, ['user'])
  return NextResponse.redirect(githubUrl)
}
