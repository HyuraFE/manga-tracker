import React, { useState, useEffect } from "react";
import { Plus, Check, SpinnerGap, Fire } from "@phosphor-icons/react";

interface PopularManga {
  id: string;
  title: string;
  coverUrl: string | null;
  status: string;
}

const getCoverUrl = (url: string | null | undefined) => {
  if (!url) return null;
  if (url.startsWith("https://uploads.mangadex.org/")) {
    return `/api/manga/cover?url=${encodeURIComponent(url)}`;
  }
  return url;
};

export default function PopularMarquee() {
  const [popular, setPopular] = useState<PopularManga[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/manga/popular")
      .then((r) => r.json())
      .then((d) => setPopular(d.data || []))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async (manga: PopularManga, e: React.MouseEvent) => {
    e.stopPropagation();
    if (addedIds[manga.id] || addingId === manga.id) return;

    setAddingId(manga.id);
    try {
      const res = await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mangaId: manga.id,
          title: manga.title,
          coverUrl: manga.coverUrl,
        }),
      });

      if (res.ok) {
        setAddedIds((prev) => ({ ...prev, [manga.id]: true }));
        window.dispatchEvent(new CustomEvent("manga-library-updated"));
      } else {
        const err = await res.json();
        alert(err.error || "Gagal menambahkan manga");
      }
    } catch {
      alert("Terjadi kesalahan jaringan");
    } finally {
      setAddingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Fire size={18} className="text-pastel-primary" weight="fill" />
          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800">
            Populer di MangaDex
          </h2>
        </div>
        <div className="flex gap-4 overflow-hidden py-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="w-28 sm:w-34 aspect-[2/3] rounded-2xl bg-white/60 border border-pastel-accent/30 animate-pulse shrink-0"
            />
          ))}
        </div>
      </div>
    );
  }

  if (popular.length === 0) return null;

  // Duplicate list to achieve continuous infinite marquee loop
  const marqueeItems = [...popular, ...popular];

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Fire size={18} className="text-pastel-primary" weight="fill" />
          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800">
            Populer di MangaDex
          </h2>
        </div>
        <span className="text-[11px] text-slate-500 hidden sm:inline">
          Arahkan kursor untuk menjeda scroll · Klik kartu untuk tambah
        </span>
      </div>

      {/* Marquee Viewport with soft gradient fade on edges */}
      <div className="relative w-full overflow-hidden py-1 rounded-2xl">
        {/* Left Fade Mask */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-8 sm:w-16 bg-gradient-to-r from-pastel-canvas via-pastel-canvas/80 to-transparent z-20" />
        {/* Right Fade Mask */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 sm:w-16 bg-gradient-to-l from-pastel-canvas via-pastel-canvas/80 to-transparent z-20" />

        {/* Scrolling Track */}
        <div className="animate-marquee gap-3.5 sm:gap-4 flex">
          {marqueeItems.map((manga, idx) => {
            const isAdded = addedIds[manga.id];
            const isAdding = addingId === manga.id;

            return (
              <div
                key={`${manga.id}-${idx}`}
                className="group/item relative w-28 sm:w-34 aspect-[2/3] shrink-0 rounded-2xl overflow-hidden border border-pastel-accent/35 bg-white shadow-2xs hover:border-pastel-primary hover:shadow-md transition-all duration-200 cursor-pointer"
                title={`${manga.title} - Klik untuk tambah ke library`}
                onClick={(e) => handleAdd(manga, e)}
              >
                {/* Poster Cover */}
                {manga.coverUrl ? (
                  <img
                    src={getCoverUrl(manga.coverUrl) || ""}
                    alt={manga.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover/item:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-pastel-surface/40 flex items-center justify-center text-xs text-slate-400">
                    No Cover
                  </div>
                )}

                {/* Dark gradient for title legibility */}
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none" />

                {/* Quick Add Button Top-Right */}
                <div className="absolute top-2 right-2 z-10">
                  <button
                    type="button"
                    onClick={(e) => handleAdd(manga, e)}
                    disabled={isAdded || isAdding}
                    className={`p-1.5 rounded-lg shadow-sm transition-all cursor-pointer ${
                      isAdded
                        ? "bg-emerald-600 text-white"
                        : "bg-white/90 text-pastel-primary hover:bg-pastel-primary hover:text-white"
                    }`}
                    title={isAdded ? "Sudah di library" : "Tambah ke library"}
                  >
                    {isAdding ? (
                      <SpinnerGap size={13} className="animate-spin" />
                    ) : isAdded ? (
                      <Check size={13} weight="bold" />
                    ) : (
                      <Plus size={13} weight="bold" />
                    )}
                  </button>
                </div>

                {/* Title & Info at Bottom */}
                <div className="absolute inset-x-0 bottom-0 p-2.5 z-10 pointer-events-none">
                  <h3 className="text-white font-bold text-[11px] sm:text-xs line-clamp-1 leading-snug drop-shadow-xs">
                    {manga.title}
                  </h3>
                  <span className="text-[9.5px] text-pastel-surface capitalize font-medium drop-shadow-xs">
                    {manga.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
