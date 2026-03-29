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

  // Try to verify client_id — if it fails and test mode is available, use test login
  let useTestMode = false
  try {
    const client = await verifyClientId(clientId)
    if (!client.redirectUris.includes(redirectUri)) {
      return Response.json(
        { error: 'invalid_request', error_description: 'redirect_uri does not match registered URIs' },
        { status: 400 },
      )
    }
  } catch {
    if (process.env.MCP_TEST_GITHUB_TOKEN) {
      // Unknown client but test mode available — use test login
      useTestMode = true
    } else {
      return Response.json(
        { error: 'invalid_client', error_description: 'Invalid client_id' },
        { status: 400 },
      )
    }
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

  // Test mode: show username/password form
  if (useTestMode) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const formAction = `${baseUrl}/api/oauth/test-login`
    return new Response(
      `<!DOCTYPE html>
<html><head><title>git-recipe — sign in</title></head>
<body style="background:#1d2021;color:#ebdbb2;font-family:monospace;display:flex;justify-content:center;align-items:center;height:100vh;margin:0">
<form method="POST" action="${formAction}" style="border:1px solid #665c54;padding:2rem;max-width:320px;width:100%">
<h2 style="color:#b8bb26;margin:0 0 1rem">[ sign in ]</h2>
<label style="display:block;margin-bottom:0.5rem">&gt; username<br><input name="username" style="background:#282828;color:#ebdbb2;border:1px solid #665c54;padding:0.5rem;width:100%;font-family:monospace;box-sizing:border-box" /></label>
<label style="display:block;margin-bottom:1rem">&gt; password<br><input name="password" type="password" style="background:#282828;color:#ebdbb2;border:1px solid #665c54;padding:0.5rem;width:100%;font-family:monospace;box-sizing:border-box" /></label>
<button type="submit" style="background:transparent;color:#b8bb26;border:1px solid #b8bb26;padding:0.5rem 1rem;font-family:monospace;cursor:pointer">[ login ]</button>
</form></body></html>`,
      { status: 200, headers: { 'Content-Type': 'text/html' } },
    )
  }

  // Default: redirect to GitHub OAuth
  const githubState = generateState()
  cookieStore.set('mcp_github_state', githubState, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 10,
  })

  const github = getMcpGitHub()
  const githubUrl = github.createAuthorizationURL(githubState, ['user'])
  return NextResponse.redirect(githubUrl)
}
