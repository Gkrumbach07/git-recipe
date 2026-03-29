import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAuthCode, decryptOAuthParams } from '@/lib/mcp-oauth'

export async function POST(request: NextRequest) {
  const testToken = process.env.MCP_TEST_GITHUB_TOKEN
  if (!testToken) {
    return Response.json(
      { error: 'test_mode_disabled' },
      { status: 403 },
    )
  }

  const formData = await request.formData()
  const username = formData.get('username') as string
  const password = formData.get('password') as string

  if (username !== 'test_user' || password !== 'hunter2') {
    return new Response(
      `<!DOCTYPE html>
<html><head><title>git-recipe — error</title></head>
<body style="background:#1d2021;color:#fb4934;font-family:monospace;display:flex;justify-content:center;align-items:center;height:100vh;margin:0">
<p>ERR: invalid credentials. <a href="javascript:history.back()" style="color:#b8bb26">[ try again ]</a></p>
</body></html>`,
      { status: 401, headers: { 'Content-Type': 'text/html' } },
    )
  }

  const cookieStore = await cookies()
  const oauthParamsCookie = cookieStore.get('mcp_oauth_params')?.value

  if (!oauthParamsCookie) {
    return Response.json(
      { error: 'invalid_request', error_description: 'Missing MCP OAuth params. Start from the authorize endpoint.' },
      { status: 400 },
    )
  }

  const oauthParams = await decryptOAuthParams(oauthParamsCookie)

  // Create auth code using the test GitHub token
  const authCode = await createAuthCode(
    testToken,
    oauthParams.codeChallenge,
    oauthParams.redirectUri,
    oauthParams.clientId,
  )

  cookieStore.delete('mcp_oauth_params')

  // Redirect to the MCP client's redirect_uri
  const redirectUrl = new URL(oauthParams.redirectUri)
  redirectUrl.searchParams.set('code', authCode)
  redirectUrl.searchParams.set('state', oauthParams.state)

  return NextResponse.redirect(redirectUrl.toString())
}
