import { NextResponse } from "next/server";
import { searchMulti } from "@/lib/tmdb";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (q.length < 1) {
    return NextResponse.json({ results: [] });
  }
  try {
    const data = await searchMulti(q);
    const results = (data.results ?? [])
      .filter((r) => r.media_type === "movie" || r.media_type === "tv")
      .slice(0, 30);
    return NextResponse.json({ results });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error" },
      { status: 500 }
    );
  }
}
