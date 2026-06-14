---
name: isolated-vm Node 20 incompatibility
description: isolated-vm v6 requires Node >=22; static import crashes ORPC on Node 20
---

## Rule
`isolated-vm@6.x` ships prebuilds only for ABI 127 (Node 22) and ABI 137 (Node 24).
Node 20.20.0 uses ABI 115 — no prebuild exists, causing a hard crash at module load time.

**Why:** Any package that does `import ... from "isolated-vm"` at the top level will crash
the entire Next.js route chunk that imports it, even if no Code block is actually invoked.
This was killing every ORPC endpoint (workspace listing, auth, etc.) with 500 errors.

**How to apply:** Keep all `isolated-vm` imports lazy — use `require("isolated-vm")` inside
the function that actually needs it (e.g. `getOrCreateIsolate()`). Use `import type` for
TypeScript type annotations only. Three files were fixed:
- `packages/runtime-session-store/src/index.ts`
- `packages/variables/src/codeRunners.ts`
- `packages/variables/src/executeFunction.ts`

If the Node runtime is upgraded to >=22, the lazy require still works fine (no regression).
