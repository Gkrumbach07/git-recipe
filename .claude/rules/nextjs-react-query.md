---
paths:
  - "app/**"
  - "lib/queries/**"
  - "components/**"
  - "app/providers.tsx"
  - "app/get-query-client.ts"
description: Next.js App Router + React Query integration — SSR, prefetching, caching, hydration rules
---

# Next.js + React Query Optimization Rules

These rules govern how Next.js server rendering and React Query's client cache work together. Getting this wrong causes double-fetching, hydration mismatches, request waterfalls, or stale data leaking between users.

---

## 1. Two Cache Layers — Don't Confuse Them

| Layer | Owns | Scope | Invalidation |
|---|---|---|---|
| **Next.js fetch cache** | Server-side `fetch()` with `cache: 'force-cache'` or `next.revalidate` | Per-route, CDN-level | `revalidatePath()`, `revalidateTag()` |
| **React Query cache** | Client-side `QueryClient` | Per-user, in-browser | `invalidateQueries()`, `staleTime` expiry |

**Do NOT mix them on the same data.** Since all our data comes from the GitHub API via React Query, we use React Query as the single cache layer. Do not add `cache: 'force-cache'` or `next: { revalidate }` to fetch calls that feed React Query — it will cause the server to return stale data that React Query then caches again on the client, creating a double-stale problem.

**When to use Next.js cache:** Only for data NOT managed by React Query (e.g., static marketing page content, public metadata).

---

## 2. staleTime Must Be > 0 for SSR

```ts
staleTime: 60 * 1000  // 1 minute minimum
```

**Why:** With SSR, React Query measures staleness from when the query was fetched on the server. If `staleTime` is `0` (the default), the client immediately refetches on hydration — negating the entire point of server prefetching. Always set a default `staleTime > 0` in the QueryClient.

---

## 3. Server: New QueryClient Per Request

```ts
// get-query-client.ts
if (isServer) return makeQueryClient()           // ALWAYS fresh
if (!browserQueryClient) browserQueryClient = makeQueryClient()  // singleton
return browserQueryClient
```

**Why:** Sharing a QueryClient across server requests leaks data between users and degrades performance. The server always creates a new client. The browser reuses a singleton.

**Do NOT use `useState` to create the QueryClient** unless there is a Suspense boundary below it. If React suspends during initial render, it throws away state — including the QueryClient.

---

## 4. Prefetch in Server Components, Consume in Client Components

This is the core pattern. Every page that needs data should follow it:

```tsx
// app/(app)/cookbook/[owner]/[repo]/page.tsx  (Server Component)
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { getQueryClient } from '@/app/get-query-client'

export default function CookbookPage({ params }) {
  const queryClient = getQueryClient()

  // Prefetch — runs on the server
  void queryClient.prefetchQuery(recipesQueryOptions(params.owner, params.repo))
  void queryClient.prefetchQuery(branchesQueryOptions(params.owner, params.repo))

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <RecipeList />     {/* Client Component — data available instantly */}
      <BranchSwitcher /> {/* Client Component — data available instantly */}
    </HydrationBoundary>
  )
}
```

```tsx
// components/recipe/recipe-list.tsx  (Client Component)
'use client'

export function RecipeList({ owner, repo }) {
  // Data from server prefetch is available immediately — no loading flash
  const { data } = useQuery(recipesQueryOptions(owner, repo))
  // ...
}
```

**Rules:**
- Prefetch in the Server Component (`page.tsx`)
- Wrap children in `<HydrationBoundary state={dehydrate(queryClient)}>`
- Client components call `useQuery` with the same query key — data is already in cache
- Client-only queries (no prefetch) are fine to mix in — they fetch on mount

---

## 5. Streaming: Don't Await Prefetches

```tsx
// DO — enables streaming, non-blocking
void queryClient.prefetchQuery(recipesQueryOptions(owner, repo))

// DON'T — blocks the entire page until data resolves
await queryClient.prefetchQuery(recipesQueryOptions(owner, repo))
```

**Why:** Without `await`, the `dehydrate()` call includes pending queries. Next.js streams the HTML shell immediately, then streams the data as it resolves. The client shows `loading.tsx` / Suspense fallbacks while data arrives.

**Requires** `shouldDehydrateQuery` to include pending queries (already configured in `get-query-client.ts`):

```ts
dehydrate: {
  shouldDehydrateQuery: (query) =>
    defaultShouldDehydrateQuery(query) || query.state.status === 'pending',
}
```

---

## 6. Avoid Request Waterfalls

**Bad — sequential waterfall:**
```tsx
function CookbookPage() {
  const { data: cookbook } = useQuery(cookbookQueryOptions(owner, repo))
  // RecipeList can't render until cookbook loads — Comments can't fetch until RecipeList renders
  return cookbook ? <RecipeList owner={owner} repo={repo} /> : <Loading />
}
```

**Good — parallel prefetch at the page level:**
```tsx
export default function CookbookPage({ params }) {
  const queryClient = getQueryClient()

  // All prefetches fire in parallel
  void queryClient.prefetchQuery(cookbookQueryOptions(params.owner, params.repo))
  void queryClient.prefetchQuery(recipesQueryOptions(params.owner, params.repo))
  void queryClient.prefetchQuery(branchesQueryOptions(params.owner, params.repo))

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CookbookShell />
    </HydrationBoundary>
  )
}
```

**Rule:** Prefetch all data a page needs at the page level (Server Component). Don't nest queries inside conditional renders that create sequential dependencies.

---

## 7. Mutations: React Query Invalidation, Not Next.js Revalidation

Since React Query owns our cache, mutations invalidate via React Query — not `revalidatePath()` / `revalidateTag()`:

```tsx
const createRecipe = useMutation({
  mutationFn: (data) => githubCreateRecipe(owner, repo, data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: [owner, repo, 'recipes'] })
  },
})
```

**Do NOT call `revalidatePath()` for GitHub API data.** That's for Next.js's own fetch cache, which we're not using for API data.

**Exception:** If we ever add server-rendered static pages (e.g., a public cookbook view cached at the CDN level), those would use `revalidatePath()`.

---

## 8. Error Handling: Don't Redact Next.js Errors

```ts
shouldRedactErrors: () => false
```

**Why:** Next.js uses thrown errors to detect dynamic pages. If React Query redacts these errors, Next.js can't distinguish dynamic from static routes. Let Next.js handle its own error redaction (it does this automatically with digests).

---

## 9. Optimistic Updates for Recipe Edits

Recipe edits should feel instant. Use optimistic updates:

```tsx
const updateRecipe = useMutation({
  mutationFn: (data) => githubUpdateRecipe(owner, repo, path, data),
  onMutate: async (newData) => {
    await queryClient.cancelQueries({ queryKey: [owner, repo, 'recipe', path] })
    const previous = queryClient.getQueryData([owner, repo, 'recipe', path])
    queryClient.setQueryData([owner, repo, 'recipe', path], newData)
    return { previous }
  },
  onError: (err, vars, context) => {
    queryClient.setQueryData([owner, repo, 'recipe', path], context.previous)
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: [owner, repo, 'recipe', path] })
  },
})
```

---

## Quick Reference: What NOT to Do

| Anti-pattern | Why it breaks |
|---|---|
| `staleTime: 0` with SSR | Client refetches immediately on hydration, wasting the server prefetch |
| Shared `QueryClient` on server | Leaks user data between requests |
| `useState(() => new QueryClient())` without Suspense boundary | React discards client on suspend |
| `await` on prefetch in Server Component | Blocks streaming — user sees nothing until all data loads |
| `cache: 'force-cache'` on GitHub API fetches | Double-caches with React Query, stale data compounds |
| `revalidatePath()` for React Query data | Wrong cache layer — has no effect on client-side Query cache |
| Nested `useQuery` behind conditional renders | Creates request waterfalls — queries run sequentially not in parallel |
