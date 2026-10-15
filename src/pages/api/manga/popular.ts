import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
  // Daftar manga populer terverifikasi di MangaDex dengan cover asli berkualitas tinggi
  const verifiedPopular = [
    {
      id: "b0b721ff-c388-4486-aa0f-c2b0bb321512",
      title: "Sousou no Frieren",
      coverUrl: "https://uploads.mangadex.org/covers/b0b721ff-c388-4486-aa0f-c2b0bb321512/75a1cb6f-0554-4447-bf6e-0ef759af3f48.jpg.512.jpg",
      status: "ongoing",
    },
    {
      id: "a1c7c817-4e59-43b7-9365-09675a149a6f",
      title: "One Piece",
      coverUrl: "https://uploads.mangadex.org/covers/a1c7c817-4e59-43b7-9365-09675a149a6f/2f4aca53-64c7-46ac-ae85-3bc9b3169890.png.512.jpg",
      status: "ongoing",
    },
    {
      id: "e896c48c-3150-437d-ba57-d8567eb399ae",
      title: "Chainsaw Man",
      coverUrl: "https://uploads.mangadex.org/covers/e896c48c-3150-437d-ba57-d8567eb399ae/fa06e4e4-ef2a-477b-bfb6-a2a88793620b.jpg.512.jpg",
      status: "ongoing",
    },
    {
      id: "68112dc1-2b80-4f20-beb8-2f2a8716a430",
      title: "Dandadan",
      coverUrl: "https://uploads.mangadex.org/covers/68112dc1-2b80-4f20-beb8-2f2a8716a430/85b5b2e9-0e3c-436f-88e1-91e3b7934b38.jpg.512.jpg",
      status: "ongoing",
    },
    {
      id: "6b958848-c885-4735-9201-12ee77abcb3c",
      title: "SPY×FAMILY",
      coverUrl: "https://uploads.mangadex.org/covers/6b958848-c885-4735-9201-12ee77abcb3c/91a35e78-62b2-41fe-9869-ce051f2d1070.jpg.512.jpg",
      status: "ongoing",
    },
    {
      id: "6a1d1cb1-ecd5-40d9-89ff-9d88e40b136b",
      title: "Tokyo Ghoul",
      coverUrl: "https://uploads.mangadex.org/covers/6a1d1cb1-ecd5-40d9-89ff-9d88e40b136b/040e8ae9-4ddd-49d2-8986-56782b391714.jpg.512.jpg",
      status: "completed",
    },
    {
      id: "239d6260-d71f-43b0-afff-074e3619e3de",
      title: "Bleach",
      coverUrl: "https://uploads.mangadex.org/covers/239d6260-d71f-43b0-afff-074e3619e3de/032cc781-43eb-4281-956c-7cf991dd0a6a.jpg.512.jpg",
      status: "completed",
    },
    {
      id: "6b1eb93e-473a-4ab3-9922-1a66d2a29a4a",
      title: "Naruto",
      coverUrl: "https://uploads.mangadex.org/covers/6b1eb93e-473a-4ab3-9922-1a66d2a29a4a/c5a3090c-4ca0-40a2-9102-e0ee0c6dac15.jpg.512.jpg",
      status: "completed",
    },
    {
      id: "0c44cf39-3d6c-4472-815b-9e163613cfe9",
      title: "Kimi ga Shinu made Koi o Shitai",
      coverUrl: "https://uploads.mangadex.org/covers/0c44cf39-3d6c-4472-815b-9e163613cfe9/bda1d964-69fb-4438-a312-cf9a5fbae77a.png.256.jpg",
      status: "ongoing",
    },
  ];

  return new Response(JSON.stringify({ data: verifiedPopular }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
};
