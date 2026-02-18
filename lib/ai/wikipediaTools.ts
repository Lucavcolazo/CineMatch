export type WikipediaSearchResult = {
  title: string;
  description: string | null;
  url: string | null;
};

export async function wikipediaSearch(params: {
  query: string;
  limit?: number;
}): Promise<WikipediaSearchResult[]> {
  const { query, limit = 5 } = params;
  const safeLimit = Math.max(1, Math.min(10, limit));

  // Nota: usamos el endpoint REST oficial (no scraping).
  const url = new URL("https://es.wikipedia.org/w/rest.php/v1/search/title");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", String(safeLimit));

  const res = await fetch(url.toString(), { next: { revalidate: 300 } });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Wikipedia error ${res.status}: ${body}`);
  }

  const data = (await res.json()) as {
    pages?: { title?: string; description?: string; key?: string }[];
  };

  const pages = Array.isArray(data.pages) ? data.pages : [];
  return pages
    .map((p) => {
      const title = (p.title ?? "").trim();
      const key = (p.key ?? title).trim();
      if (!title) return null;
      return {
        title,
        description: p.description?.trim() ? p.description.trim() : null,
        url: key ? `https://es.wikipedia.org/wiki/${encodeURIComponent(key)}` : null,
      } satisfies WikipediaSearchResult;
    })
    .filter((x): x is WikipediaSearchResult => Boolean(x));
}

export type WikipediaSummary = {
  title: string;
  extract: string | null;
  url: string | null;
};

export async function wikipediaSummary(params: {
  title: string;
}): Promise<WikipediaSummary> {
  const { title } = params;
  const safeTitle = title.trim();
  if (!safeTitle) {
    throw new Error("Falta el título para buscar el resumen en Wikipedia.");
  }

  const url = `https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
    safeTitle
  )}`;

  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Wikipedia error ${res.status}: ${body}`);
  }

  const data = (await res.json()) as {
    title?: string;
    extract?: string;
    content_urls?: { desktop?: { page?: string } };
  };

  return {
    title: (data.title ?? safeTitle).trim(),
    extract: data.extract?.trim() ? data.extract.trim() : null,
    url: data.content_urls?.desktop?.page ?? null,
  };
}

