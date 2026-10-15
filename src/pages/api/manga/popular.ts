import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
  try {
    const mangaDexUrl = new URL("https://api.mangadex.org/manga");
    mangaDexUrl.searchParams.set("limit", "16");
    mangaDexUrl.searchParams.append("includes[]", "cover_art");
    mangaDexUrl.searchParams.set("order[followedCount]", "desc");
    mangaDexUrl.searchParams.append("contentRating[]", "safe");
    mangaDexUrl.searchParams.append("contentRating[]", "suggestive");

    const res = await fetch(mangaDexUrl.toString(), {
      headers: {
        "User-Agent": "MangaTrack/1.0",
        "Accept": "application/json",
      },
    });

    if (res.ok) {
      const data = await res.json();
      const list = (data.data || []).map((item: any) => {
        const titles = item.attributes?.title || {};
        const title =
          titles.en ||
          titles["ja-ro"] ||
          Object.values(titles)[0] ||
          "Untitled";

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
          coverUrl,
          status: item.attributes?.status || "ongoing",
        };
      });

      if (list.length > 0) {
        return new Response(JSON.stringify({ data: list }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=3600, s-maxage=86400",
          },
        });
      }
    }
  } catch {
    // Network / cert fallback
  }

  // Fallback data populer teruji dari MangaDex agar marquee selalu tampil sempurna
  const fallbackPopular = [
    {
      id: "b40280b2-ff6b-4573-bfba-79e51c8dbd98",
      title: "Sousou no Frieren",
      coverUrl: "https://uploads.mangadex.org/covers/b40280b2-ff6b-4573-bfba-79e51c8dbd98/6168be41-1188-4228-8547-3be9cf8fa722.jpg.512.jpg",
      status: "ongoing",
    },
    {
      id: "a1c7c817-4e59-43b7-9365-09675a149a6f",
      title: "One Piece",
      coverUrl: "https://uploads.mangadex.org/covers/a1c7c817-4e59-43b7-9365-09675a149a6f/761e389b-f116-43b9-a2e6-764057e937d3.jpg.512.jpg",
      status: "ongoing",
    },
    {
      id: "32d76d19-8a05-4db0-9fc2-e0b0648fe9d0",
      title: "Solo Leveling",
      coverUrl: "https://uploads.mangadex.org/covers/32d76d19-8a05-4db0-9fc2-e0b0648fe9d0/342999e5-9430-4e59-9941-ad6b38cff06e.jpg.512.jpg",
      status: "completed",
    },
    {
      id: "e78a489b-6632-4d61-b069-52341f4b25a7",
      title: "Chainsaw Man",
      coverUrl: "https://uploads.mangadex.org/covers/e78a489b-6632-4d61-b069-52341f4b25a7/218cb72c-e300-482a-a9e9-d3e74ff1f7c0.jpg.512.jpg",
      status: "ongoing",
    },
    {
      id: "d8f93318-ea34-471c-a4ff-a3f0254d6453",
      title: "Jujutsu Kaisen",
      coverUrl: "https://uploads.mangadex.org/covers/d8f93318-ea34-471c-a4ff-a3f0254d6453/3daeec7e-07f9-467f-9d32-eb803c625805.jpg.512.jpg",
      status: "completed",
    },
    {
      id: "c0ee660b-84ad-423e-ac85-91ff405ae699",
      title: "Oshi no Ko",
      coverUrl: "https://uploads.mangadex.org/covers/c0ee660b-84ad-423e-ac85-91ff405ae699/65d1d619-ba6b-4e6f-a8ea-68218f401ad8.jpg.512.jpg",
      status: "completed",
    },
    {
      id: "3046eb30-d3e3-4d01-9997-789a74442eb2",
      title: "Bocchi the Rock!",
      coverUrl: "https://uploads.mangadex.org/covers/3046eb30-d3e3-4d01-9997-789a74442eb2/05e2697b-6072-4d7a-af7f-775c754d9c49.jpg.512.jpg",
      status: "ongoing",
    },
    {
      id: "bc287a98-333e-4b68-80f0-82cc7867201b",
      title: "SPY×FAMILY",
      coverUrl: "https://uploads.mangadex.org/covers/bc287a98-333e-4b68-80f0-82cc7867201b/099ca108-99ee-47b2-a42e-2e212404e9bc.jpg.512.jpg",
      status: "ongoing",
    },
    {
      id: "801513ba-a712-4985-8c30-c82e8081396e",
      title: "Berserk",
      coverUrl: "https://uploads.mangadex.org/covers/801513ba-a712-4985-8c30-c82e8081396e/7b0965d1-9481-4322-8302-36c927f88ebc.jpg.512.jpg",
      status: "ongoing",
    },
    {
      id: "ed99f2aa-ca5f-467a-9774-839f83a483a9",
      title: "Blue Lock",
      coverUrl: "https://uploads.mangadex.org/covers/ed99f2aa-ca5f-467a-9774-839f83a483a9/b12e3650-6a75-4fc1-a966-d4f19ad178ef.jpg.512.jpg",
      status: "ongoing",
    },
  ];

  return new Response(JSON.stringify({ data: fallbackPopular }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
