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

  // Verify client_id
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

  // Build the GitHub OAuth URL
  const githubState = generateState()
  cookieStore.set('mcp_github_state', githubState, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 10,
  })

  const github = getMcpGitHub()
  const githubUrl = github.createAuthorizationURL(githubState, ['repo', 'read:user'])

  // If test mode is enabled, show a page with both options
  if (process.env.MCP_TEST_GITHUB_TOKEN) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const formAction = `${baseUrl}/api/oauth/test-login`
    return new Response(
      `<!DOCTYPE html>
<html><head><title>git-recipe — sign in</title></head>
<body style="background:#1d2021;color:#ebdbb2;font-family:monospace;display:flex;justify-content:center;align-items:center;height:100vh;margin:0">
<div style="max-width:360px;width:100%">
<h1 style="color:#b8bb26;margin:0 0 1.5rem;font-size:1.2rem">[ git-recipe ]</h1>
<a href="${githubUrl}" style="display:block;text-align:center;border:1px solid #b8bb26;color:#b8bb26;padding:0.75rem;text-decoration:none;margin-bottom:2rem">[ Sign in with GitHub ]</a>
<div id="test-toggle" style="text-align:center;margin-top:1rem">
<button onclick="document.getElementById('test-form').style.display='block';this.style.display='none'" style="background:none;border:none;color:#504945;font-family:monospace;cursor:pointer;font-size:0.75rem">developer login</button>
</div>
<form id="test-form" method="POST" action="${formAction}" style="display:none;border:1px solid #665c54;padding:1.5rem;margin-top:1rem">
<label style="display:block;margin-bottom:0.5rem;font-size:0.85rem">&gt; username<br><input name="username" style="background:#282828;color:#ebdbb2;border:1px solid #665c54;padding:0.5rem;width:100%;font-family:monospace;box-sizing:border-box;margin-top:0.25rem;font-size:0.85rem" /></label>
<label style="display:block;margin-bottom:1rem;font-size:0.85rem">&gt; password<br><input name="password" type="password" style="background:#282828;color:#ebdbb2;border:1px solid #665c54;padding:0.5rem;width:100%;font-family:monospace;box-sizing:border-box;margin-top:0.25rem;font-size:0.85rem" /></label>
<button type="submit" style="background:transparent;color:#b8bb26;border:1px solid #b8bb26;padding:0.5rem 1rem;font-family:monospace;cursor:pointer;width:100%;font-size:0.85rem">[ login ]</button>
</form>
</div></body></html>`,
      { status: 200, headers: { 'Content-Type': 'text/html' } },
    )
  }

  // Default: redirect straight to GitHub OAuth
  return NextResponse.redirect(githubUrl)
}
