export interface RecipeFrontmatter {
  title: string
  tags?: string[]
  servings?: number
  source?: string
  cooked?: number
}

export interface ParsedRecipe {
  frontmatter: RecipeFrontmatter
  body: string
  sha: string
}

export interface Recipe extends ParsedRecipe {
  path: string
}

export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  owner: { login: string; avatar_url: string }
  description: string | null
  private: boolean
  fork: boolean
  parent?: { full_name: string; owner: { login: string } }
  default_branch: string
  updated_at: string
  pushed_at: string
}

export interface GitHubContent {
  name: string
  path: string
  sha: string
  size: number
  type: 'file' | 'dir' | 'symlink' | 'submodule'
  content?: string
  encoding?: string
  download_url: string | null
}

export interface GitHubCommitFile {
  sha: string
  filename: string
  status: 'added' | 'removed' | 'modified' | 'renamed'
  additions: number
  deletions: number
  patch?: string
  previous_filename?: string
}

export interface GitHubCommit {
  sha: string
  commit: {
    message: string
    author: { name: string; date: string }
  }
  author: { login: string; avatar_url: string } | null
  files?: GitHubCommitFile[]
}

export interface GitHubUser {
  login: string
  avatar_url: string
  name: string | null
}

export interface Cookbook extends GitHubRepo {
  recipeCount?: number
}

export interface CreateCookbookData {
  name: string
  description?: string
  visibility?: 'public' | 'private'
}

export interface CreateRecipeData {
  path: string
  frontmatter: RecipeFrontmatter
  body: string
  branch?: string
  message?: string
}

export interface UpdateRecipeData {
  path: string
  frontmatter: RecipeFrontmatter
  body: string
  sha: string
  branch?: string
  message?: string
}

