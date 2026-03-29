import { createServer } from '@/mcp/server'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'

// Stateless transport — no session management for serverless
function createTransport() {
  return new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  })
}

export async function POST(request: Request) {
  const server = createServer()
  const transport = createTransport()
  await server.connect(transport)
  return transport.handleRequest(request)
}

export async function GET(request: Request) {
  const server = createServer()
  const transport = createTransport()
  await server.connect(transport)
  return transport.handleRequest(request)
}

export async function DELETE(request: Request) {
  const server = createServer()
  const transport = createTransport()
  await server.connect(transport)
  return transport.handleRequest(request)
}
