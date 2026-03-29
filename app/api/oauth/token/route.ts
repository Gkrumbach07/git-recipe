import { verifyAuthCode, verifyClientId, validatePkce, createAccessToken } from '@/lib/mcp-oauth'

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || ''
    let params: Record<string, string>

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await request.text()
      params = Object.fromEntries(new URLSearchParams(text))
    } else if (contentType.includes('application/json')) {
      params = await request.json()
    } else {
      // Try form-urlencoded as default
      const text = await request.text()
      params = Object.fromEntries(new URLSearchParams(text))
    }

    const {
      grant_type,
      code,
      code_verifier,
      client_id,
      client_secret,
      redirect_uri,
    } = params

    if (grant_type !== 'authorization_code') {
      return Response.json(
        { error: 'unsupported_grant_type', error_description: 'Only authorization_code grant is supported' },
        { status: 400 },
      )
    }

    if (!code || !code_verifier || !client_id) {
      return Response.json(
        { error: 'invalid_request', error_description: 'Missing required parameters: code, code_verifier, client_id' },
        { status: 400 },
      )
    }

    // Verify client_id and client_secret
    let clientInfo: { clientName: string; redirectUris: string[]; clientSecret: string }
    try {
      clientInfo = await verifyClientId(client_id)
    } catch {
      return Response.json(
        { error: 'invalid_client', error_description: 'Invalid client_id' },
        { status: 401 },
      )
    }

    if (client_secret && client_secret !== clientInfo.clientSecret) {
      return Response.json(
        { error: 'invalid_client', error_description: 'Invalid client_secret' },
        { status: 401 },
      )
    }

    // Decrypt the auth code
    let authCodeData: {
      githubToken: string
      codeChallenge: string
      redirectUri: string
      clientId: string
    }
    try {
      authCodeData = await verifyAuthCode(code)
    } catch {
      return Response.json(
        { error: 'invalid_grant', error_description: 'Invalid or expired authorization code' },
        { status: 400 },
      )
    }

    // Validate PKCE
    if (!validatePkce(code_verifier, authCodeData.codeChallenge)) {
      return Response.json(
        { error: 'invalid_grant', error_description: 'PKCE validation failed' },
        { status: 400 },
      )
    }

    // Validate redirect_uri matches
    if (redirect_uri && redirect_uri !== authCodeData.redirectUri) {
      return Response.json(
        { error: 'invalid_grant', error_description: 'redirect_uri mismatch' },
        { status: 400 },
      )
    }

    // Validate client_id matches
    if (client_id !== authCodeData.clientId) {
      return Response.json(
        { error: 'invalid_grant', error_description: 'client_id mismatch' },
        { status: 400 },
      )
    }

    // Create access token
    const accessToken = await createAccessToken(authCodeData.githubToken)

    return Response.json({
      access_token: accessToken,
      token_type: 'bearer',
      expires_in: 28800, // 8 hours
    })
  } catch (error) {
    return Response.json(
      { error: 'server_error', error_description: String(error) },
      { status: 500 },
    )
  }
}
