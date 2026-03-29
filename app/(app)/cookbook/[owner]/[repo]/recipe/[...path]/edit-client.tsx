'use client'

import { useQuery } from '@tanstack/react-query'
import { recipeQueryOptions } from '@/lib/queries/recipes'
import { RecipeEditor } from '@/components/recipe/recipe-editor'

interface EditRecipeClientProps {
  owner: string
  repo: string
  recipePath: string
  branch?: string
}

export function EditRecipeClient({
  owner,
  repo,
  recipePath,
  branch,
}: EditRecipeClientProps) {
  const { data: recipe, isLoading, error } = useQuery(
    recipeQueryOptions(owner, repo, recipePath, branch)
  )

  if (isLoading) {
    return <div className="font-mono text-muted-foreground">[ ... ]</div>
  }

  if (error) {
    return (
      <div className="font-mono text-destructive">ERR: {error.message}</div>
    )
  }

  if (!recipe) {
    return (
      <div className="font-mono text-muted-foreground">recipe not found</div>
    )
  }

  return (
    <RecipeEditor
      mode="edit"
      owner={owner}
      repo={repo}
      recipe={recipe}
      recipePath={recipePath}
      branch={branch}
    />
  )
}
