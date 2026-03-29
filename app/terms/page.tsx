export default function TermsPage() {
  return (
    <div className="min-h-screen p-8 max-w-3xl mx-auto">
      <h1 className="text-xl text-primary mb-6">[ terms of service ]</h1>
      <div className="space-y-4 text-sm text-muted-foreground">
        <p className="text-foreground">Last updated: March 29, 2026</p>

        <h2 className="text-foreground mt-6">&gt; the short version</h2>
        <p>
          git-recipe is a free tool that manages recipes in GitHub repositories.
          You own your data. We provide the interface. Use it responsibly.
        </p>

        <h2 className="text-foreground mt-6">&gt; your account</h2>
        <p>
          You sign in with your GitHub account. You are responsible for maintaining
          the security of your GitHub account. git-recipe acts on your behalf using
          the permissions you grant.
        </p>

        <h2 className="text-foreground mt-6">&gt; your data</h2>
        <p>
          All recipes and cookbooks are stored in your GitHub repositories. You own
          them completely. git-recipe has no database and keeps no copies of your data.
          If you stop using git-recipe, your recipes remain in your GitHub repos.
        </p>

        <h2 className="text-foreground mt-6">&gt; the service</h2>
        <ul className="list-none space-y-1">
          <li>-- git-recipe is provided &quot;as is&quot; without warranties</li>
          <li>-- We may update or discontinue the service at any time</li>
          <li>-- We are not responsible for data loss (your data is in GitHub)</li>
          <li>-- We rely on GitHub&apos;s API — their outages affect us too</li>
        </ul>

        <h2 className="text-foreground mt-6">&gt; acceptable use</h2>
        <ul className="list-none space-y-1">
          <li>-- Don&apos;t abuse the GitHub API through git-recipe</li>
          <li>-- Don&apos;t use git-recipe for anything illegal</li>
          <li>-- Don&apos;t attempt to access other users&apos; data</li>
        </ul>

        <h2 className="text-foreground mt-6">&gt; contact</h2>
        <p>
          Questions? Email <a href="mailto:gkrumbach@gmail.com" className="text-primary hover:underline">gkrumbach@gmail.com</a>
        </p>
      </div>
    </div>
  )
}
