import type { APIRoute } from "astro";
import https from "node:https";

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const imageUrl = url.searchParams.get("url");

  if (!imageUrl || !imageUrl.startsWith("https://uploads.mangadex.org/")) {
    return new Response("URL gambar tidak valid", { status: 400 });
  }

  try {
    const { buffer, contentType } = await new Promise<{
      buffer: Buffer;
      contentType: string;
    }>((resolve, reject) => {
      const req = https.get(
        imageUrl,
        {
          rejectUnauthorized: false,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
          },
        },
        (res) => {
          if (res.statusCode && res.statusCode >= 400) {
            return reject(new Error(`HTTP ${res.statusCode}`));
          }
          const contentType = res.headers["content-type"] || "image/jpeg";
          const chunks: Buffer[] = [];
          res.on("data", (chunk) => chunks.push(chunk));
          res.on("end", () =>
            resolve({ buffer: Buffer.concat(chunks), contentType })
          );
        }
      );

      req.on("error", reject);
      req.setTimeout(12000, () => {
        req.destroy();
        reject(new Error("Timeout"));
      });
    });

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control":
          "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
      },
    });
  } catch {
    return Response.redirect(imageUrl, 302);
  }
};
