'use client'

import Link from 'next/link'

export default function CookbookError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="p-8 font-mono">
      <p className="text-destructive">ERR: {error.message || 'Failed to load cookbook'}</p>
      <div className="mt-4 flex gap-4">
        <button
          onClick={reset}
          className="border border-primary px-4 py-1 text-primary hover:bg-primary hover:text-primary-foreground"
        >
          [ Retry ]
        </button>
        <Link
          href="/dashboard"
          className="border border-muted px-4 py-1 text-muted-foreground hover:text-foreground"
        >
          [ Dashboard ]
        </Link>
      </div>
    </div>
  )
}
