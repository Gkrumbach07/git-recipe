import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { GitHub } from 'arctic'
import { createAuthCode, decryptOAuthParams } from '@/lib/mcp-oauth'

function getMcpGitHub(): GitHub {
  return new GitHub(
    process.env.GITHUB_APP_CLIENT_ID!,
    process.env.GITHUB_APP_CLIENT_SECRET!,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/callback`,
  )
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')

  const cookieStore = await cookies()
  const storedState = cookieStore.get('mcp_github_state')?.value
  const oauthParamsCookie = cookieStore.get('mcp_oauth_params')?.value

  if (!code || !state || !storedState || state !== storedState) {
    return Response.json(
      { error: 'invalid_state', error_description: 'OAuth state mismatch' },
      { status: 400 },
    )
  }

  if (!oauthParamsCookie) {
    return Response.json(
      { error: 'invalid_request', error_description: 'Missing MCP OAuth params' },
      { status: 400 },
    )
  }

  try {
    // Exchange code for GitHub tokens
    const github = getMcpGitHub()
    const tokens = await github.validateAuthorizationCode(code)
    const githubToken = tokens.accessToken()

    // Recover MCP OAuth params
    const oauthParams = await decryptOAuthParams(oauthParamsCookie)

    // Create an auth code containing the GitHub token + PKCE challenge
    const authCode = await createAuthCode(
      githubToken,
      oauthParams.codeChallenge,
      oauthParams.redirectUri,
      oauthParams.clientId,
    )

    // Clean up cookies
    cookieStore.delete('mcp_github_state')
    cookieStore.delete('mcp_oauth_params')

    // Redirect to the MCP client's redirect_uri with the auth code
    const redirectUrl = new URL(oauthParams.redirectUri)
    redirectUrl.searchParams.set('code', authCode)
    redirectUrl.searchParams.set('state', oauthParams.state)

    return NextResponse.redirect(redirectUrl.toString())
  } catch (error) {
    return Response.json(
      { error: 'server_error', error_description: String(error) },
      { status: 500 },
    )
  }
}
