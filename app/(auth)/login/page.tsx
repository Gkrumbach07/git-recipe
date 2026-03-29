export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="border border-border p-8 max-w-lg w-full">
        <pre className="text-primary text-sm mb-6">
{`        _ _                       _
   __ _(_) |_      _ __ ___  ___(_)_ __   ___
  / _\` | | __|____| '__/ _ \\/ __| | '_ \\ / _ \\
 | (_| | | ||_____| | |  __/ (__| | |_) |  __/
  \\__, |_|\\__|    |_|  \\___|\\___|_| .__/ \\___|
  |___/                           |_|         `}
        </pre>
        <p className="text-muted-foreground mb-2">
          &gt; recipe management backed by GitHub repos
        </p>
        <p className="text-muted-foreground mb-8">
          &gt; cookbooks are repos. recipes are markdown files.
        </p>
        <a
          href="/api/auth/login"
          className="border border-primary text-primary px-6 py-2 font-mono hover:bg-primary hover:text-primary-foreground transition-colors inline-block"
        >
          [ Sign in with GitHub ]
        </a>
        <p className="text-muted-foreground mt-4 text-sm">
          first time? <a href="/api/auth/login?install=1" className="text-primary hover:underline">install the GitHub App</a>
        </p>
      </div>
    </div>
  )
}
