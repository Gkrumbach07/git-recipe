/**
 * GitHub API client for MCP server.
 * Re-exports from lib/github.ts for use in MCP tools.
 */
export {
  getUser,
  listRepos,
  getRepo,
  createRepo,
  deleteRepo,
  forkRepo,
  listContents,
  getFile,
  createOrUpdateFile,
  deleteFile,
  listCommits,
  getCommit,
  searchCode,
} from '@/lib/github'
