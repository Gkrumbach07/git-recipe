import type {
  GitHubRepo,
  GitHubContent,
  GitHubCommit,
  GitHubUser,
} from '@/types'

const GITHUB_API = 'https://api.github.com'

export class GitHubError extends Error {
  constructor(
    message: string,
    public status: number,
    public rateLimit?: { remaining: number; reset: number },
  ) {
    super(message)
    this.name = 'GitHubError'
  }
}

async function githubFetch<T>(
  token: string,
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = path.startsWith('http') ? path : `${GITHUB_API}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...options.headers,
    },
  })

  const rateLimit = {
    remaining: Number(res.headers.get('x-ratelimit-remaining') ?? -1),
    reset: Number(res.headers.get('x-ratelimit-reset') ?? 0),
  }

  if (!res.ok) {
    const body = await res.text()
    throw new GitHubError(
      `GitHub API error: ${res.status} ${body}`,
      res.status,
      rateLimit,
    )
  }

  if (res.status === 204) return undefined as T

  return res.json() as Promise<T>
}

// ── User ──

export function getUser(token: string): Promise<GitHubUser> {
  return githubFetch<GitHubUser>(token, '/user')
}

// ── Repositories ──

export function listRepos(token: string): Promise<GitHubRepo[]> {
  return githubFetch<GitHubRepo[]>(
    token,
    '/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator',
  )
}

export function getRepo(
  token: string,
  owner: string,
  repo: string,
): Promise<GitHubRepo> {
  return githubFetch<GitHubRepo>(token, `/repos/${owner}/${repo}`)
}

export function createRepo(
  token: string,
  data: { name: string; description?: string; private?: boolean; auto_init?: boolean },
): Promise<GitHubRepo> {
  return githubFetch<GitHubRepo>(token, '/user/repos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export function deleteRepo(
  token: string,
  owner: string,
  repo: string,
): Promise<void> {
  return githubFetch<void>(token, `/repos/${owner}/${repo}`, {
    method: 'DELETE',
  })
}

export function forkRepo(
  token: string,
  owner: string,
  repo: string,
): Promise<GitHubRepo> {
  return githubFetch<GitHubRepo>(token, `/repos/${owner}/${repo}/forks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
}

// ── Contents ──

export function listContents(
  token: string,
  owner: string,
  repo: string,
  path = '',
  branch?: string,
): Promise<GitHubContent[]> {
  const query = branch ? `?ref=${encodeURIComponent(branch)}` : ''
  return githubFetch<GitHubContent[]>(
    token,
    `/repos/${owner}/${repo}/contents/${path}${query}`,
  )
}

export function getFile(
  token: string,
  owner: string,
  repo: string,
  path: string,
  branch?: string,
): Promise<GitHubContent> {
  const query = branch ? `?ref=${encodeURIComponent(branch)}` : ''
  return githubFetch<GitHubContent>(
    token,
    `/repos/${owner}/${repo}/contents/${path}${query}`,
  )
}

export function createOrUpdateFile(
  token: string,
  owner: string,
  repo: string,
  path: string,
  content: string,
  sha?: string,
  message?: string,
  branch?: string,
): Promise<{ content: GitHubContent; commit: { sha: string } }> {
  return githubFetch(token, `/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: message ?? (sha ? `Update ${path}` : `Create ${path}`),
      content: btoa(unescape(encodeURIComponent(content))),
      ...(sha && { sha }),
      ...(branch && { branch }),
    }),
  })
}

export function deleteFile(
  token: string,
  owner: string,
  repo: string,
  path: string,
  sha: string,
  message?: string,
  branch?: string,
): Promise<{ commit: { sha: string } }> {
  return githubFetch(token, `/repos/${owner}/${repo}/contents/${path}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: message ?? `Delete ${path}`,
      sha,
      ...(branch && { branch }),
    }),
  })
}

// ── Commits ──

export function listCommits(
  token: string,
  owner: string,
  repo: string,
  path?: string,
  branch?: string,
  page = 1,
  perPage = 30,
): Promise<GitHubCommit[]> {
  const params = new URLSearchParams({
    per_page: String(perPage),
    page: String(page),
  })
  if (path) params.set('path', path)
  if (branch) params.set('sha', branch)
  return githubFetch<GitHubCommit[]>(
    token,
    `/repos/${owner}/${repo}/commits?${params}`,
  )
}

// ── Search ──

export interface GitHubSearchResult {
  total_count: number
  items: Array<{
    name: string
    path: string
    sha: string
    html_url: string
    repository: { full_name: string }
    text_matches?: Array<{
      fragment: string
      matches: Array<{ text: string; indices: number[] }>
    }>
  }>
}

export function searchCode(
  token: string,
  owner: string,
  repo: string,
  query: string,
): Promise<GitHubSearchResult> {
  const params = new URLSearchParams({
    q: `${query} repo:${owner}/${repo} extension:md`,
    per_page: '30',
  })
  return githubFetch<GitHubSearchResult>(
    token,
    `/search/code?${params}`,
    {
      headers: {
        Accept: 'application/vnd.github.text-match+json',
      },
    },
  )
}

export function getCommit(
  token: string,
  owner: string,
  repo: string,
  sha: string,
): Promise<GitHubCommit> {
  return githubFetch<GitHubCommit>(
    token,
    `/repos/${owner}/${repo}/commits/${sha}`,
  )
}


