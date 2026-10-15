import type { APIRoute } from "astro";
import { fetchMangaDex } from "../../../lib/mangadex";

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const imageUrl = url.searchParams.get("url");

  if (!imageUrl || !imageUrl.startsWith("https://uploads.mangadex.org/")) {
    return new Response("URL gambar tidak valid", { status: 400 });
  }

  try {
    const { status, buffer, headers } = await fetchMangaDex(imageUrl);

    if (status !== 200 || buffer.length === 0) {
      return new Response("Gagal memuat gambar", { status: status || 502 });
    }

    const contentType = (headers["content-type"] as string) || "image/jpeg";

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control":
          "public, max-age=604800, s-maxage=2592000, stale-while-revalidate=86400",
      },
    });
  } catch {
    return new Response("Terjadi kesalahan koneksi gambar", { status: 500 });
  }
};
