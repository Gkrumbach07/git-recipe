/**
 * Token resolution for the MCP server.
 * - HTTP with OAuth: GitHub token from authInfo.extra.githubToken
 * - Local clients (stdio): GITHUB_TOKEN env var
 */

export interface McpAuthInfo {
  extra?: {
    githubToken?: string
    [key: string]: unknown
  }
  [key: string]: unknown
}

export function getToken(authInfo?: McpAuthInfo): string {
  if (authInfo?.extra?.githubToken) {
    return authInfo.extra.githubToken
  }

  const token = process.env.GITHUB_TOKEN
  if (!token) {
    throw new Error(
      'No GitHub token available. Set GITHUB_TOKEN env var for local use, or authenticate via OAuth for HTTP transport.',
    )
  }
  return token
}
