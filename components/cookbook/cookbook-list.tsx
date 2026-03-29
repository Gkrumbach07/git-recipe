'use client'

import { useQuery } from '@tanstack/react-query'
import { cookbooksQueryOptions } from '@/lib/queries/cookbooks'
import Link from 'next/link'
import type { Cookbook } from '@/types'

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const mon = d.toLocaleString('en', { month: 'short' })
  const day = String(d.getDate()).padStart(2, ' ')
  const time = d.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: false })
  return `${mon} ${day} ${time}`
}

export function CookbookList() {
  const { data: cookbooks, isLoading, isError } = useQuery(cookbooksQueryOptions())

  if (isLoading) {
    return (
      <div className="text-muted-foreground text-sm">
        <p>$ ls -la ~/cookbooks/</p>
        <p>[ ... ]</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="text-destructive text-sm">
        <p>ERR: failed to load cookbooks</p>
      </div>
    )
  }

  if (!cookbooks || cookbooks.length === 0) {
    return (
      <div className="border border-border p-6">
        <p className="text-muted-foreground text-sm mb-2">
          $ ls -la ~/cookbooks/
        </p>
        <p className="text-muted-foreground text-sm mb-4">
          total 0
        </p>
        <p className="text-foreground text-sm mb-4">
          &gt; no cookbooks found. create your first one.
        </p>
        <Link
          href="/cookbook/new"
          className="border border-primary text-primary px-4 py-1 text-sm hover:bg-primary hover:text-primary-foreground transition-colors inline-block"
        >
          [ + new cookbook ]
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="text-muted-foreground text-sm mb-2">
        $ ls -la ~/cookbooks/
      </div>
      <div className="border border-border">
        <div className="border-b border-border px-4 py-2 text-xs text-muted-foreground flex">
          <span className="w-12">type</span>
          <span className="w-20">vis</span>
          <span className="flex-1">name</span>
          <span className="w-36 text-right">updated</span>
        </div>
        {cookbooks.map((cookbook: Cookbook) => (
          <Link
            key={cookbook.id}
            href={`/cookbook/${cookbook.owner.login}/${cookbook.name}`}
            className="flex px-4 py-2 text-sm hover:bg-muted/30 transition-colors border-b border-border last:border-b-0"
          >
            <span className="w-12 text-secondary">d</span>
            <span className="w-20 text-muted-foreground">
              {cookbook.private ? 'priv' : 'pub'}
            </span>
            <span className="flex-1 text-primary">
              {cookbook.owner.login}/{cookbook.name}
            </span>
            <span className="w-36 text-right text-muted-foreground">
              {formatDate(cookbook.updated_at)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
