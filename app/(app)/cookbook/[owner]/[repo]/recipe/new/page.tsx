import { Breadcrumb } from '@/components/layout/breadcrumb'
import { RecipeEditor } from '@/components/recipe/recipe-editor'

export default async function NewRecipePage({
  params,
}: {
  params: Promise<{ owner: string; repo: string }>
}) {
  const { owner, repo } = await params

  return (
    <div className="p-8">
      <Breadcrumb owner={owner} repo={repo} />
      <h1 className="font-mono text-lg text-foreground mb-6">[ new recipe ]</h1>
      <RecipeEditor
        mode="create"
        owner={owner}
        repo={repo}
      />
    </div>
  )
}
