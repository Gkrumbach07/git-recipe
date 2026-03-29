import { createServer } from '@/mcp/server'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { verifyAccessToken } from '@/lib/mcp-oauth'
import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js'

// Stateless transport — no session management for serverless
function createTransport() {
  return new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  })
}

async function extractAuthInfo(request: Request): Promise<AuthInfo | undefined> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return undefined
  }

  const token = authHeader.slice(7)
  try {
    const verified = await verifyAccessToken(token)
    return {
      token: verified.token,
      clientId: verified.clientId,
      scopes: verified.scopes,
      extra: verified.extra,
    }
  } catch {
    return undefined
  }
}

async function handleMcpRequest(request: Request): Promise<Response> {
  const authInfo = await extractAuthInfo(request)

  // If no auth token and no GITHUB_TOKEN env var, require auth
  if (!authInfo && !process.env.GITHUB_TOKEN) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'WWW-Authenticate': `Bearer resource_metadata="${baseUrl}/.well-known/oauth-protected-resource"`,
      },
    })
  }

  const server = createServer()
  const transport = createTransport()
  await server.connect(transport)
  return transport.handleRequest(request, { authInfo })
}

export async function POST(request: Request) {
  return handleMcpRequest(request)
}

export async function GET(request: Request) {
  return handleMcpRequest(request)
}

export async function DELETE(request: Request) {
  return handleMcpRequest(request)
}
