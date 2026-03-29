---
paths:
  - "lib/queries/**"
  - "app/(app)/**"
  - "components/**"
  - "app/providers.tsx"
description: TanStack React Query patterns for Next.js App Router with GitHub API
---

# React Query Rules

## Setup

- `app/providers.tsx` — `'use client'` wrapper with `QueryClientProvider`
- `app/get-query-client.ts` — shared `getQueryClient()` factory
- Wrap children in `<Providers>` in the root or `(app)` layout

## QueryClient Factory

Server: always create a new `QueryClient` per request. Browser: singleton — reuse the same client.

Do NOT use `useState` to initialize the query client — if React suspends before a Suspense boundary, it throws away the client. Use the `getQueryClient()` pattern:

```ts
import { isServer, QueryClient, defaultShouldDehydrateQuery } from '@tanstack/react-query'

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
      },
      dehydrate: {
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.status === 'pending',
        shouldRedactErrors: () => false, // let Next.js handle error redaction
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined = undefined

export function getQueryClient() {
  if (isServer) return makeQueryClient()
  if (!browserQueryClient) browserQueryClient = makeQueryClient()
  return browserQueryClient
}
```

## Query Key Convention

Namespace all keys by `[owner, repo, ...resource]`:

```ts
['gkrumbac', 'family-recipes', 'recipes']
['gkrumbac', 'family-recipes', 'recipe', 'pasta/carbonara.md']
['gkrumbac', 'family-recipes', 'branches']
['gkrumbac', 'family-recipes', 'suggestions']
['gkrumbac', 'family-recipes', 'history']
['cookbooks']  // top-level list
```

## Query Factories

Keep query/mutation factories in `lib/queries/`. One file per domain:

```
lib/queries/
  cookbooks.ts    # list, create, delete, fork
  recipes.ts      # list, read, create, update, delete, move, search
  drafts.ts       # list branches, create, delete
  suggestions.ts  # list PRs, create, merge
  history.ts      # commit log
```

Each factory exports `queryOptions()` and mutation hooks.

## Stale Times

| Resource | Stale Time | Reason |
|---|---|---|
| Cookbooks list | 5m | Rarely changes mid-session |
| Recipe content | 5m | Usually the only editor |
| Recipe list | 2m | May add recipes |
| Branches | 30s | Changes during draft workflows |
| Suggestions (PRs) | 30s | Active collaboration |
| History | 5m | Append-only |

## Mutations

- Invalidate relevant queries on success (e.g., creating a recipe invalidates the recipe list)
- Optimistic updates for recipe edits — update cache immediately, rollback on error
- Auto-generate commit messages in mutation: `Add "Recipe Title"`, `Update "Recipe Title"`, `Delete "Recipe Title"`

## Server Components + Prefetching

Prefetch in Server Components, consume in Client Components:

```tsx
// Server Component (page.tsx)
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { getQueryClient } from '@/app/get-query-client'

export default async function RecipesPage() {
  const queryClient = getQueryClient()
  await queryClient.prefetchQuery(recipesQueryOptions(owner, repo))

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <RecipeList />  {/* Client Component uses useQuery — data available immediately */}
    </HydrationBoundary>
  )
}
```

## Client Component Queries

```tsx
'use client'
// Data from server prefetch is available immediately — no loading flash
const { data } = useQuery(recipesQueryOptions(owner, repo))
// Client-only queries (no prefetch) also fine to mix in
const { data: branches } = useQuery(branchesQueryOptions(owner, repo))
```
