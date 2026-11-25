import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { PRICE_CACHE_TAG } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * Called by the API right after a successful CSV upload (Bearer INGEST_TOKEN)
 * so new or backfilled prices show up immediately instead of whenever the
 * cached copy happens to expire. Set REVALIDATE_TOKEN on this project to the
 * same value as the API's INGEST_TOKEN.
 */
export async function POST(request: NextRequest) {
  const token = process.env.REVALIDATE_TOKEN;
  if (!token) {
    return NextResponse.json({ ok: false, error: "REVALIDATE_TOKEN not configured" }, { status: 503 });
  }
  if (request.headers.get("authorization") !== `Bearer ${token}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  revalidateTag(PRICE_CACHE_TAG);
  // Also drop rendered pages (homepage, town pages, sitemap) that were built from old data.
  revalidatePath("/", "layout");

  return NextResponse.json({ ok: true, revalidated: [PRICE_CACHE_TAG, "/"] });
}
