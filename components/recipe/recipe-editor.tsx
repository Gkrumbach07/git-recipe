'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useCreateRecipe, useUpdateRecipe } from '@/lib/queries/recipes'
import { slugify } from '@/lib/recipe'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import type { ParsedRecipe, RecipeFrontmatter } from '@/types'

interface RecipeEditorProps {
  mode: 'create' | 'edit'
  owner: string
  repo: string
  recipe?: ParsedRecipe
  recipePath?: string
  branch?: string
}

export function RecipeEditor({
  mode,
  owner,
  repo,
  recipe,
  recipePath,
  branch,
}: RecipeEditorProps) {
  const router = useRouter()
  const createRecipe = useCreateRecipe(owner, repo)
  const updateRecipe = useUpdateRecipe(owner, repo)

  const [title, setTitle] = useState(recipe?.frontmatter.title ?? '')
  const [tags, setTags] = useState(recipe?.frontmatter.tags?.join(', ') ?? '')
  const [servings, setServings] = useState(
    recipe?.frontmatter.servings?.toString() ?? ''
  )
  const [source, setSource] = useState(recipe?.frontmatter.source ?? '')
  const [body, setBody] = useState(recipe?.body ?? '')
  const [commitMessage, setCommitMessage] = useState('')
  const [showCommitMsg, setShowCommitMsg] = useState(false)
  const [preview, setPreview] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isPending = createRecipe.isPending || updateRecipe.isPending

  const handleSave = () => {
    if (!title.trim()) {
      setError('Title is required')
      return
    }
    setError(null)

    const frontmatter: RecipeFrontmatter = {
      title: title.trim(),
      ...(tags.trim() && {
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      }),
      ...(servings && { servings: Number(servings) }),
      ...(source.trim() && { source: source.trim() }),
    }

    if (mode === 'create') {
      const fileName = slugify(title)
      const path = fileName

      createRecipe.mutate(
        {
          path,
          frontmatter,
          body,
          branch,
          message: commitMessage.trim() || undefined,
        },
        {
          onSuccess: () => {
            router.push(`/cookbook/${owner}/${repo}/recipe/${path}`)
          },
          onError: (err) => setError(err.message),
        }
      )
    } else {
      if (!recipe || !recipePath) return

      updateRecipe.mutate(
        {
          path: recipePath,
          frontmatter,
          body,
          sha: recipe.sha,
          branch,
          message: commitMessage.trim() || undefined,
        },
        {
          onSuccess: () => {
            router.push(`/cookbook/${owner}/${repo}/recipe/${recipePath}`)
          },
          onError: (err) => setError(err.message),
        }
      )
    }
  }

  return (
    <div className="font-mono space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Label htmlFor="title" className="mb-1">
            &gt; title *
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Recipe title"
            className="font-mono"
          />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="tags" className="mb-1">
            &gt; tags
          </Label>
          <Input
            id="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="italian, sauce, family"
            className="font-mono"
          />
        </div>

        <div>
          <Label htmlFor="servings" className="mb-1">
            &gt; servings
          </Label>
          <Input
            id="servings"
            type="number"
            value={servings}
            onChange={(e) => setServings(e.target.value)}
            placeholder="4"
            className="font-mono"
          />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="source" className="mb-1">
            &gt; source
          </Label>
          <Input
            id="source"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="Grandma Rose"
            className="font-mono"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <Label htmlFor="body">&gt; body (markdown)</Label>
          <button
            type="button"
            onClick={() => setPreview(!preview)}
            className="border border-border px-3 py-1 text-sm hover:bg-muted text-foreground"
          >
            {preview ? '[ Edit ]' : '[ Preview ]'}
          </button>
        </div>

        {preview ? (
          <div className="min-h-[200px] border border-border p-4 bg-card prose prose-invert max-w-none text-foreground [&_h1]:text-foreground [&_h2]:text-foreground [&_h3]:text-foreground [&_p]:text-foreground [&_li]:text-foreground [&_a]:text-primary [&_strong]:text-foreground [&_code]:text-secondary [&_code]:bg-muted [&_code]:px-1">
            {body ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
            ) : (
              <p className="text-muted-foreground">nothing to preview</p>
            )}
          </div>
        ) : (
          <Textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="## Ingredients&#10;&#10;- ...&#10;&#10;## Instructions&#10;&#10;1. ..."
            className="font-mono min-h-[200px] bg-card"
          />
        )}
      </div>

      <div>
        <button
          type="button"
          onClick={() => setShowCommitMsg(!showCommitMsg)}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          {showCommitMsg ? '[-]' : '[+]'} custom commit message
        </button>
        {showCommitMsg && (
          <Input
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            placeholder={
              mode === 'create'
                ? `Add "${title || 'Recipe'}"`
                : `Update "${title || 'Recipe'}"`
            }
            className="font-mono mt-2"
          />
        )}
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? '[ ... ]' : '[ Save ]'}
        </Button>
        <Button
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          [ Cancel ]
        </Button>
      </div>

      {error && <p className="text-destructive text-sm">ERR: {error}</p>}
    </div>
  )
}
