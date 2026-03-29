import Link from 'next/link'

export default function CookbookNotFound() {
  return (
    <div className="p-8 font-mono">
      <p className="text-destructive">ERR 404: cookbook not found</p>
      <p className="mt-2 text-muted-foreground">
        The cookbook you&apos;re looking for doesn&apos;t exist or you don&apos;t have access.
      </p>
      <Link
        href="/dashboard"
        className="mt-4 inline-block border border-primary px-4 py-1 text-primary hover:bg-primary hover:text-primary-foreground"
      >
        [ Back to Dashboard ]
      </Link>
    </div>
  )
}
