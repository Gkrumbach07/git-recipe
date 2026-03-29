export default function SupportPage() {
  return (
    <div className="min-h-screen p-8 max-w-3xl mx-auto">
      <h1 className="text-xl text-primary mb-6">[ support ]</h1>
      <div className="space-y-4 text-sm text-muted-foreground">
        <p className="text-foreground">$ help --verbose</p>

        <h2 className="text-foreground mt-6">&gt; contact</h2>
        <p>
          Email: <a href="mailto:gkrumbach@gmail.com" className="text-primary hover:underline">gkrumbach@gmail.com</a>
        </p>

        <h2 className="text-foreground mt-6">&gt; common issues</h2>

        <div className="space-y-3">
          <div>
            <p className="text-foreground">ERR: &quot;Resource not accessible by integration&quot;</p>
            <p className="pl-4">
              The GitHub App needs to be installed on your account.
              Go to Settings &gt; Applications &gt; git-recipe &gt; Configure
              and grant access to your repositories.
            </p>
          </div>

          <div>
            <p className="text-foreground">ERR: Can&apos;t create cookbook</p>
            <p className="pl-4">
              Make sure the GitHub App has Administration (read/write) permission.
              You may need to re-authorize if permissions were updated.
            </p>
          </div>

          <div>
            <p className="text-foreground">ERR: Session expired</p>
            <p className="pl-4">
              Sign out and sign back in. Access tokens expire after 8 hours
              and should refresh automatically, but sometimes a fresh login
              is needed.
            </p>
          </div>
        </div>

        <h2 className="text-foreground mt-6">&gt; about</h2>
        <p>
          git-recipe is a recipe management app that uses GitHub repositories
          as the storage backend. Cookbooks are repos, recipes are markdown files.
          No database — your data lives entirely in GitHub.
        </p>
        <p>
          Built by <a href="https://gagekrumbach.com" className="text-primary hover:underline">Gage Krumbach</a>.
        </p>
      </div>
    </div>
  )
}
