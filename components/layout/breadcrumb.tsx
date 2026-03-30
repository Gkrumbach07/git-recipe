import Link from 'next/link'

interface BreadcrumbProps {
  owner: string
  repo: string
  path?: string
}

export function Breadcrumb({ owner, repo, path }: BreadcrumbProps) {
  const segments = path ? path.split('/').filter(Boolean) : []
  const basePath = `/cookbook/${owner}/${repo}`

  return (
    <nav className="text-sm text-muted-foreground font-mono mb-4">
      <Link href="/dashboard" className="hover:text-foreground">
        ~
      </Link>
      <span>/</span>
      <Link href="/dashboard" className="hover:text-foreground">
        cookbooks
      </Link>
      <span>/</span>
      <Link href={basePath} className="hover:text-foreground">
        {repo}
      </Link>
      <span>/</span>
      {segments.map((segment, i) => {
        const isLast = i === segments.length - 1
        const segmentPath = segments.slice(0, i + 1).join('/')
        const isFile = segment.endsWith('.md')
        const href = isFile
          ? `${basePath}/recipe/${segmentPath}`
          : `${basePath}/${segmentPath}`

        return (
          <span key={i}>
            {isLast ? (
              <span className="text-foreground">{segment}</span>
            ) : (
              <>
                <Link href={href} className="hover:text-foreground">
                  {segment}
                </Link>
                <span>/</span>
              </>
            )}
          </span>
        )
      })}
    </nav>
  )
}
