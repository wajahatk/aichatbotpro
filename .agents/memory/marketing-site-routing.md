---
name: Marketing site routing
description: Two places gate public/marketing routes; both must be updated when adding new public paths.
---

## The two gatekeepers

### 1. `apps/builder/src/proxy.ts` (Next.js Edge Middleware)
- Runs server-side before any page renders.
- Hard-redirects `/` to `/signin` (unauthenticated) or `/typebots` (authenticated) by default.
- Fix: for unauthenticated users at `/`, return `NextResponse.next()` so `index.tsx` renders instead.
- `config.matcher` is `["/", "/typebots"]` — only intercepts those two paths.

### 2. `apps/builder/src/features/user/UserProvider.tsx` (Client-side effect)
- Runs in the browser after hydration.
- Checks `status === "unauthenticated"` and calls `router.replace("/signin")` for any path NOT in its allowlist.
- Allowlist: `isSignInPath` array + `isPathPublicFriendly` regex + `isMarketingPath` check.
- Fix: add `isMarketingPath` check covering `/`, `/pricing`, `/features`, `/about`, `/legal/*`.

## Adding a new public page
When adding any new unauthenticated-accessible page:
1. If it's at `/`, update `proxy.ts`.
2. Always update the `isMarketingPath` check in `UserProvider.tsx`.

**Why:** Without step 2, the page SSR-renders correctly but the client immediately redirects to `/signin` after hydration — making it appear to work in curl/SSR but fail for real browser users.
