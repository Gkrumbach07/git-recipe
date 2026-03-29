import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="border-b border-border px-6 py-3 flex items-center">
        <span className="text-primary font-bold text-lg">git-recipe</span>
        <div className="flex-1" />
        <Link
          href="/login"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          [sign in]
        </Link>
      </nav>

      <main className="flex-1 flex items-center justify-center">
        <div className="max-w-2xl w-full px-8">
          <pre className="text-primary text-sm mb-8">
{`        _ _                       _
   __ _(_) |_      _ __ ___  ___(_)_ __   ___
  / _\` | | __|____| '__/ _ \\/ __| | '_ \\ / _ \\
 | (_| | | ||_____| | |  __/ (__| | |_) |  __/
  \\__, |_|\\__|    |_|  \\___|\\___|_| .__/ \\___|
  |___/                           |_|         `}
          </pre>

          <p className="text-foreground mb-6">
            &gt; recipe management backed by GitHub repos
          </p>

          <div className="border border-border p-4 mb-8 space-y-2 text-sm">
            <p className="text-muted-foreground">$ cat features.txt</p>
            <p className="text-foreground">
              -- cookbooks are repos. recipes are markdown files.
            </p>
            <p className="text-foreground">
              -- organize recipes with tags.
            </p>
            <p className="text-foreground">
              -- branches, pull requests, and commits built in.
            </p>
            <p className="text-foreground">
              -- no database. your data lives in GitHub.
            </p>
            <p className="text-foreground">
              -- collaborate with anyone. fork, suggest, merge.
            </p>
          </div>

          <Link
            href="/login"
            className="border border-primary text-primary px-6 py-2 hover:bg-primary hover:text-primary-foreground transition-colors inline-block"
          >
            [ Sign in with GitHub ]
          </Link>

          <p className="text-muted-foreground text-xs mt-8">
            $ echo &quot;your recipes deserve version control&quot;
          </p>
        </div>
      </main>
    </div>
  )
}
