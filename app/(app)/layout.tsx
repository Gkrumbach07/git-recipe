'use client'

import { useSession } from '@/hooks/use-session'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading } = useSession()

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="border-b border-border px-4 sm:px-6 py-3 flex items-center gap-3 min-h-[48px]">
        <a href="/dashboard" className="text-primary font-mono font-bold text-lg whitespace-nowrap shrink-0">
          git-recipe
        </a>
        <div className="flex-1" />
        {isLoading ? (
          <span className="text-muted-foreground text-sm">[ ... ]</span>
        ) : user ? (
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={user.avatarUrl}
              alt={user.login}
              className="w-6 h-6 border border-border"
            />
            <span className="text-sm text-foreground hidden sm:inline">{user.login}</span>
            <a
              href="/api/auth/logout"
              className="text-sm text-muted-foreground hover:text-destructive"
            >
              [logout]
            </a>
          </div>
        ) : null}
      </nav>
      <main className="flex-1">{children}</main>
    </div>
  )
}
