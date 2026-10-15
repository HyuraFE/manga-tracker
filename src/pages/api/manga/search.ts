import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const query = url.searchParams.get("q");

  if (!query || query.trim().length === 0) {
    return new Response(JSON.stringify({ results: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const mangaDexUrl = new URL("https://api.mangadex.org/manga");
    mangaDexUrl.searchParams.set("title", query.trim());
    mangaDexUrl.searchParams.set("limit", "10");
    mangaDexUrl.searchParams.append("includes[]", "cover_art");
    mangaDexUrl.searchParams.set("order[relevance]", "desc");
    mangaDexUrl.searchParams.append("contentRating[]", "safe");
    mangaDexUrl.searchParams.append("contentRating[]", "suggestive");

    const res = await fetch(mangaDexUrl.toString(), {
      headers: {
        "User-Agent": "MangaTrack/1.0",
      },
    });

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: "Gagal mengambil data dari MangaDex" }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const data = await res.json();

    const results = (data.data || []).map((item: any) => {
      const titles = item.attributes?.title || {};
      const title =
        titles.en ||
        titles["ja-ro"] ||
        Object.values(titles)[0] ||
        "Untitled Manga";

      const descriptions = item.attributes?.description || {};
      const description =
        descriptions.en ||
        Object.values(descriptions)[0] ||
        "Tidak ada sinopsis.";

      const coverRel = item.relationships?.find(
        (rel: any) => rel.type === "cover_art"
      );
      const fileName = coverRel?.attributes?.fileName;
      const coverUrl = fileName
        ? `https://uploads.mangadex.org/covers/${item.id}/${fileName}.512.jpg`
        : null;

      return {
        id: item.id,
        title,
        description,
        coverUrl,
        status: item.attributes?.status || "unknown",
        year: item.attributes?.year || null,
      };
    });

    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Terjadi kesalahan server" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
