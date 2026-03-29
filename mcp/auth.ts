/**
 * Token resolution for the MCP server.
 * - Local clients (stdio): GITHUB_TOKEN env var
 * - ChatGPT (HTTP): OAuth token from request context
 */

export function getToken(oauthToken?: string): string {
  if (oauthToken) return oauthToken

  const token = process.env.GITHUB_TOKEN
  if (!token) {
    throw new Error(
      'No GitHub token available. Set GITHUB_TOKEN env var for local use, or authenticate via OAuth for HTTP transport.',
    )
  }
  return token
}
