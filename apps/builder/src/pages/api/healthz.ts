import prisma from "@typebot.io/prisma";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  const start = Date.now();
  let dbOk = false;
  let dbMs = 0;

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
    dbMs = Date.now() - start;
  } catch (_e) {
    dbMs = Date.now() - start;
  }

  const status = dbOk ? 200 : 503;
  return res.status(status).json({
    status: dbOk ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? "unknown",
    checks: {
      database: { status: dbOk ? "ok" : "error", latencyMs: dbMs },
      memory: {
        status: "ok",
        heapUsedMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      },
    },
  });
}
