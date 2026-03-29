'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCreateCookbook } from '@/lib/queries/cookbooks'

export function CreateCookbookForm() {
  const router = useRouter()
  const createCookbook = useCreateCookbook()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [visibility, setVisibility] = useState<'public' | 'private'>('private')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    try {
      const repo = await createCookbook.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        visibility,
      })
      router.push(`/cookbook/${repo.owner.login}/${repo.name}`)
    } catch {
      // Error is available via createCookbook.error
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm text-muted-foreground mb-1">
          $ name:
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="my-cookbook"
          pattern="[a-zA-Z0-9._-]+"
          title="Letters, numbers, hyphens, dots, and underscores only"
          required
          className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:border-primary"
        />
        <p className="text-xs text-muted-foreground mt-1">
          -- letters, numbers, hyphens, dots, underscores
        </p>
      </div>

      <div>
        <label className="block text-sm text-muted-foreground mb-1">
          $ description:
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="A collection of family recipes"
          className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:border-primary"
        />
      </div>

      <div>
        <label className="block text-sm text-muted-foreground mb-2">
          $ visibility:
        </label>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setVisibility('private')}
            className={`border px-4 py-1 text-sm transition-colors ${
              visibility === 'private'
                ? 'border-primary text-primary bg-primary/10'
                : 'border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {visibility === 'private' ? '[x]' : '[ ]'} private
          </button>
          <button
            type="button"
            onClick={() => setVisibility('public')}
            className={`border px-4 py-1 text-sm transition-colors ${
              visibility === 'public'
                ? 'border-primary text-primary bg-primary/10'
                : 'border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {visibility === 'public' ? '[x]' : '[ ]'} public
          </button>
        </div>
      </div>

      {createCookbook.isError && (
        <p className="text-destructive text-sm">
          ERR: {(createCookbook.error as Error).message}
        </p>
      )}

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={createCookbook.isPending || !name.trim()}
          className="border border-primary text-primary px-6 py-2 text-sm hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {createCookbook.isPending ? '[ ... ]' : '[ create ]'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="border border-border text-muted-foreground px-6 py-2 text-sm hover:text-foreground transition-colors"
        >
          [ cancel ]
        </button>
      </div>
    </form>
  )
}
