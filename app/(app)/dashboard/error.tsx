'use client'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="p-8 font-mono">
      <p className="text-destructive">ERR: {error.message || 'Failed to load dashboard'}</p>
      <button
        onClick={reset}
        className="mt-4 border border-primary px-4 py-1 text-primary hover:bg-primary hover:text-primary-foreground"
      >
        [ Retry ]
      </button>
    </div>
  )
}
