import { NextResponse } from "next/server";

// Qué commit está publicado. Lo usa `pnpm esperar-publicacion` para saber cuándo un cambio ya
// está live, sin necesitar acceso a Vercel.
export function GET() {
  return NextResponse.json(
    { commit: process.env.VERCEL_GIT_COMMIT_SHA ?? "local" },
    { headers: { "cache-control": "no-store" } },
  );
}
