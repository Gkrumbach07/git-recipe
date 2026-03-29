export default function PrivacyPage() {
  return (
    <div className="min-h-screen p-8 max-w-3xl mx-auto">
      <h1 className="text-xl text-primary mb-6">[ privacy policy ]</h1>
      <div className="space-y-4 text-sm text-muted-foreground">
        <p className="text-foreground">Last updated: March 29, 2026</p>

        <h2 className="text-foreground mt-6">&gt; what we collect</h2>
        <p>
          git-recipe authenticates you via GitHub OAuth. We access your GitHub profile
          (username, avatar) and repository data (to manage cookbooks and recipes).
        </p>
        <p>
          We do not store your data in any database. All recipe data lives in your
          GitHub repositories. Session tokens are stored in encrypted HTTP-only cookies
          in your browser.
        </p>

        <h2 className="text-foreground mt-6">&gt; what we don&apos;t do</h2>
        <ul className="list-none space-y-1">
          <li>-- We don&apos;t sell your data</li>
          <li>-- We don&apos;t track you with analytics</li>
          <li>-- We don&apos;t store your GitHub password</li>
          <li>-- We don&apos;t access repos beyond what you authorize</li>
        </ul>

        <h2 className="text-foreground mt-6">&gt; github permissions</h2>
        <p>
          The git-recipe GitHub App requests these permissions:
        </p>
        <ul className="list-none space-y-1">
          <li>-- Administration (read/write): create and delete repositories</li>
          <li>-- Contents (read/write): read and write recipe files</li>
          <li>-- Metadata (read): basic repository information</li>
        </ul>

        <h2 className="text-foreground mt-6">&gt; cookies</h2>
        <p>
          We use a single encrypted HTTP-only session cookie to keep you signed in.
          No tracking cookies, no third-party cookies.
        </p>

        <h2 className="text-foreground mt-6">&gt; data deletion</h2>
        <p>
          Uninstall the git-recipe GitHub App from your account to revoke all access.
          Your recipes remain in your GitHub repos — we never had a copy.
        </p>

        <h2 className="text-foreground mt-6">&gt; contact</h2>
        <p>
          Questions? Email <a href="mailto:gkrumbach@gmail.com" className="text-primary hover:underline">gkrumbach@gmail.com</a>
        </p>
      </div>
    </div>
  )
}
