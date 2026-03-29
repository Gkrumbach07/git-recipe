import { createClientId, generateSecret } from '@/lib/mcp-oauth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { client_name, redirect_uris, scope, ...rest } = body

    if (!client_name) {
      return Response.json(
        { error: 'invalid_client_metadata', error_description: 'client_name is required' },
        { status: 400 },
      )
    }

    if (!redirect_uris || !Array.isArray(redirect_uris) || redirect_uris.length === 0) {
      return Response.json(
        { error: 'invalid_client_metadata', error_description: 'redirect_uris is required' },
        { status: 400 },
      )
    }

    const clientSecret = generateSecret()
    const clientId = await createClientId(client_name, redirect_uris, clientSecret)

    return Response.json({
      client_id: clientId,
      client_secret: clientSecret,
      client_name,
      redirect_uris,
      scope: scope || 'repo read:user',
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      token_endpoint_auth_method: 'client_secret_post',
      ...rest,
    }, { status: 201 })
  } catch (error) {
    return Response.json(
      { error: 'server_error', error_description: String(error) },
      { status: 500 },
    )
  }
}
