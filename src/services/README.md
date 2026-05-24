# `src/services/`

Per-resource service modules that call the Kalmio backend. One file per backend resource.

## Two API clients live in this app today

| Client | Where | When to use |
|---|---|---|
| **`api`** (axios) | `@/lib/api` | Existing services. Untyped URLs — strings are not checked against the backend. |
| **`apiClient`** (openapi-fetch + axios under the hood) | `@/lib/api-client` | **New services and migrations.** URLs and shapes typed from `src/types/api.d.ts`, regenerated from the backend's OpenAPI spec. |

Both share the same axios instance for HTTP, so request/response interceptors (Bearer token, `X-Refresh-Token` sliding refresh, 401 → expired-session redirect, `Accept-Language` header) apply uniformly.

## Why two — and why migrate

In 2026-05 a backend route refactor (`PlanController` → `/api/plans/calendar`) silently broke ten frontend calls. The compiler could not catch it because URLs were plain strings. KALMIO-387 introduced `apiClient` so that mistake becomes a TypeScript error in your editor before you ever push.

Goal: every service in this folder uses `apiClient` for its calls. Migrate one file at a time when you touch it for any other reason; do not run a big-bang refactor.

## How to add a new service or migrate an existing method

```ts
import { apiClient } from '@/lib/api-client'

export const widgetService = {
  getById: async (id: string) => {
    const { data, error, response } = await apiClient.GET('/api/widgets/{id}', {
      params: { path: { id } },
    })
    if (response.status === 404) return null
    if (error) throw error
    return data
  },
}
```

The first argument is autocompleted from `paths` in `src/types/api.d.ts`. Typo it → red squiggle. Rename it on the backend → red squiggle next time someone runs `pnpm gen:api`.

## Regenerating types

```bash
pnpm gen:api                # writes src/types/api.d.ts; soft-fails if backend is offline
pnpm check:api              # like gen:api but exits non-zero if the file would change
KALMIO_API_URL=… pnpm gen:api   # point at a non-local backend (e.g. staging)
```

`pnpm dev` runs `gen:api` automatically as a `predev` hook, so types stay fresh during local work. If the backend isn't running, the script warns and continues — existing types are used.

## CI guard — open follow-up

The intended workflow: a CI step boots the backend, runs `pnpm check:api`, and fails if the committed `api.d.ts` is stale. That step is not yet wired (the existing CI workflow only builds the frontend). Until it is, the discipline is human: regenerate before pushing if you touched backend routes, and reviewers should look for `api.d.ts` changes alongside route changes.

## Reference

- Generator script: `scripts/gen-api.mjs`
- Typed client: `src/lib/api-client.ts`
- Generated types: `src/types/api.d.ts` (do not edit by hand)
- Original axios client: `src/lib/api.ts`
- Migration story: KALMIO-387
