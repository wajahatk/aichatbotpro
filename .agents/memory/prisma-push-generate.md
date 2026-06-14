---
name: Prisma push + generate
description: Commands to sync schema and regenerate the Prisma client in this repo
---

## Commands
```bash
cd packages/prisma && bunx prisma db push --accept-data-loss --config prisma.config.ts --schema postgresql/schema.prisma
cd packages/prisma && bunx prisma generate --config prisma.config.ts --schema postgresql/schema.prisma
```

**Why:** The repo uses a non-standard Prisma config path (`prisma.config.ts`) and schema path (`postgresql/schema.prisma`). Plain `prisma db push` without these flags fails.
