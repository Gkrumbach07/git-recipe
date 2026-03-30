'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { searchRecipesQueryOptions } from '@/lib/queries/recipes'
import { useClickOutside } from '@/hooks/use-click-outside'

function useDebounce(value: string, ms: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms)
    return () => clearTimeout(id)
  }, [value, ms])
  return debounced
}

export function RecipeSearch({
  owner,
  repo,
}: {
  owner: string
  repo: string
}) {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 400)
  const isOpen = query.length > 0
  const ref = useRef<HTMLDivElement>(null)
  const clearQuery = useCallback(() => setQuery(''), [])
  useClickOutside(ref, clearQuery)

  const { data: results, isLoading, error } = useQuery(
    searchRecipesQueryOptions(owner, repo, debouncedQuery),
  )

  const recipes = results?.items?.filter(
    (item) =>
      item.name.endsWith('.md') &&
      !item.name.startsWith('.') &&
      item.name !== 'README.md',
  ) ?? []

  return (
    <div className="relative flex-1 min-w-[200px]" ref={ref}>
      <div className="flex items-center border border-border text-sm">
        <span className="px-2 text-muted-foreground">$</span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="grep recipes..."
          className="bg-transparent py-1 pr-3 flex-1 text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="px-2 text-muted-foreground hover:text-foreground"
          >
            [x]
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-10 top-full left-0 right-0 mt-1 border border-border bg-background max-h-72 overflow-y-auto">
          {debouncedQuery.length < 2 && (
            <div className="px-4 py-2 text-xs text-muted-foreground">
              type at least 2 characters
            </div>
          )}

          {isLoading && debouncedQuery.length >= 2 && (
            <div className="px-4 py-2 text-xs text-muted-foreground">
              [ ... ]
            </div>
          )}

          {error && (
            <div className="px-4 py-2 text-xs text-destructive">
              {error.message.includes('rate limit')
                ? 'ERR: rate limit -- wait a moment and try again'
                : `ERR: ${error.message}`}
            </div>
          )}

          {!isLoading && !error && debouncedQuery.length >= 2 && recipes.length === 0 && (
            <div className="px-4 py-2 text-xs text-muted-foreground">
              &gt; no matches
            </div>
          )}

          {recipes.map((item) => (
            <Link
              key={item.sha}
              href={`/cookbook/${owner}/${repo}/recipe/${item.path}`}
              onClick={() => setQuery('')}
              className="block px-4 py-2 text-sm hover:bg-muted/30 border-b border-border last:border-b-0"
            >
              <div className="text-primary">{item.name}</div>
              {item.text_matches?.[0] && (
                <div className="text-xs text-muted-foreground mt-0.5 truncate">
                  ...{item.text_matches[0].fragment.slice(0, 80)}...
                </div>
              )}
            </Link>
          ))}

          {!isLoading && !error && debouncedQuery.length >= 2 && results && (
            <div className="px-4 py-1 text-xs text-muted-foreground border-t border-border">
              {results.total_count} result{results.total_count !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
