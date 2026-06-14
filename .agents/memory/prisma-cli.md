---
name: Prisma CLI path
description: How to invoke prisma CLI in this repo — it is not in PATH
---

## Problem
`prisma` binary is not in `$PATH`. Neither `node_modules/.bin/prisma` nor a global `prisma` exists.

## Solution
Use `bunx prisma` from the `packages/prisma` directory:
```
cd packages/prisma && bunx prisma db push --accept-data-loss --config prisma.config.ts --schema postgresql/schema.prisma
cd packages/prisma && bunx prisma generate --config prisma.config.ts --schema postgresql/schema.prisma
```

**Why:** `bun run db:push` shells out via `exec("prisma ...")` which fails (code 127: not found). `bunx` resolves the binary from the bun cache correctly.

## Don't use
- `./node_modules/.bin/prisma` — doesn't exist
- `npx prisma` — also not found
- `bun run db:push` / `bun run db:generate` in packages/prisma — both fail via tsx exec

## Schema location
`packages/prisma/postgresql/schema.prisma` (PostgreSQL target)
Config: `packages/prisma/prisma.config.ts`
