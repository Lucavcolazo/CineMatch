import { NextResponse } from "next/server";
import { getTitleDetails, getTitleVideos, getWatchProviders, getFirstTrailerKey, type MediaType } from "@/lib/tmdb";
import type { TmdbProvider } from "@/lib/tmdb";

function pickProvidersForRegion(
  providers: Awaited<ReturnType<typeof getWatchProviders>>,
  region: string
) {
  const r = providers.results?.[region];
  const flatrate = (r?.flatrate ?? []) as TmdbProvider[];
  const rent = (r?.rent ?? []) as TmdbProvider[];
  const buy = (r?.buy ?? []) as TmdbProvider[];
  return { link: r?.link, flatrate, rent, buy };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ mediaType: string; id: string }> }
) {
  const { mediaType, id } = await params;
  const region = new URL(request.url).searchParams.get("region") ?? "AR";
  if (mediaType !== "movie" && mediaType !== "tv") {
    return NextResponse.json({ error: "Invalid mediaType" }, { status: 400 });
  }
  const numId = Number(id);
  if (!Number.isFinite(numId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  try {
    const [details, watch, videos] = await Promise.all([
      getTitleDetails(mediaType as MediaType, numId),
      getWatchProviders(mediaType as MediaType, numId),
      getTitleVideos(mediaType as MediaType, numId),
    ]);
    const { flatrate, rent, buy } = pickProvidersForRegion(watch, region);
    const trailer_key = getFirstTrailerKey(videos);
    return NextResponse.json({
      ...details,
      trailer_key: trailer_key ?? undefined,
      watch_providers: {
        flatrate: flatrate.map((p) => ({ provider_id: p.provider_id, provider_name: p.provider_name })),
        rent: rent.map((p) => ({ provider_id: p.provider_id, provider_name: p.provider_name })),
        buy: buy.map((p) => ({ provider_id: p.provider_id, provider_name: p.provider_name })),
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
