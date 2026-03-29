'use client'

import { useRouter } from 'next/navigation'
import { useDeleteRecipe } from '@/lib/queries/recipes'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface RecipeDeleteProps {
  owner: string
  repo: string
  path: string
  sha: string
  title: string
  onClose: () => void
}

export function RecipeDelete({
  owner,
  repo,
  path,
  sha,
  title,
  onClose,
}: RecipeDeleteProps) {
  const router = useRouter()
  const deleteRecipe = useDeleteRecipe(owner, repo)

  const handleDelete = () => {
    deleteRecipe.mutate(
      { path, sha, title },
      {
        onSuccess: () => {
          router.push(`/cookbook/${owner}/${repo}`)
        },
      }
    )
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="font-mono">
        <DialogHeader>
          <DialogTitle>[ confirm delete ]</DialogTitle>
          <DialogDescription>
            Delete &quot;{title}&quot;? This creates a deletion commit.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            [ Cancel ]
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteRecipe.isPending}
          >
            {deleteRecipe.isPending ? '[ ... ]' : '[ Delete ]'}
          </Button>
        </DialogFooter>
        {deleteRecipe.isError && (
          <p className="text-destructive text-sm">
            ERR: {deleteRecipe.error.message}
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}
