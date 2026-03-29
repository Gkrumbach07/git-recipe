export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return Response.json({
    resource: `${baseUrl}/api/mcp`,
    authorization_servers: [baseUrl],
    scopes_supported: ['repo', 'read:user'],
  })
}
