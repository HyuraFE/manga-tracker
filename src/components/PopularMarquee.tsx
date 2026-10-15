import React, { useState, useEffect, useRef } from "react";
import { Plus, Check, SpinnerGap, Fire, CaretLeft, CaretRight } from "@phosphor-icons/react";

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
  const [isDragging, setIsDragging] = useState(false);

  const sliderRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);
  const isPausedRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const dragDistanceRef = useRef(0);

  useEffect(() => {
    fetch("/api/manga/popular")
      .then((r) => r.json())
      .then((d) => setPopular(d.data || []))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  // Smooth auto-scroll with seamless circular loop & pause on hover/drag
  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider || popular.length === 0) return;

    // Set initial scroll position to the middle third for bidirectional infinite dragging
    const oneThird = slider.scrollWidth / 3;
    if (oneThird > 0 && slider.scrollLeft === 0) {
      slider.scrollLeft = oneThird;
    }

    let animationFrameId: number;

    const step = () => {
      if (slider && !isPausedRef.current && !isDraggingRef.current) {
        slider.scrollLeft += 0.75;

        const third = slider.scrollWidth / 3;
        if (third > 0 && slider.scrollLeft >= third * 2) {
          slider.scrollLeft -= third;
        }
      }
      animationFrameId = requestAnimationFrame(step);
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [popular]);

  // Mouse Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const slider = sliderRef.current;
    if (!slider) return;

    setIsDragging(true);
    isDraggingRef.current = true;
    startXRef.current = e.pageX - slider.offsetLeft;
    scrollLeftRef.current = slider.scrollLeft;
    dragDistanceRef.current = 0;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const slider = sliderRef.current;
    if (!slider) return;

    e.preventDefault();
    const x = e.pageX - slider.offsetLeft;
    const walk = (x - startXRef.current) * 1.35;
    dragDistanceRef.current = Math.abs(x - startXRef.current);
    slider.scrollLeft = scrollLeftRef.current - walk;

    // Infinite wrap check while dragging
    const third = slider.scrollWidth / 3;
    if (third > 0) {
      if (slider.scrollLeft >= third * 2) {
        slider.scrollLeft -= third;
        scrollLeftRef.current -= third;
      } else if (slider.scrollLeft <= 0) {
        slider.scrollLeft += third;
        scrollLeftRef.current += third;
      }
    }
  };

  const handleMouseUpOrLeave = () => {
    if (!isDraggingRef.current) return;
    setIsDragging(false);
    isDraggingRef.current = false;
  };

  // Nudge Left / Right Buttons
  const scrollByAmount = (direction: "left" | "right") => {
    const slider = sliderRef.current;
    if (!slider) return;
    const delta = direction === "left" ? -300 : 300;
    slider.scrollBy({ left: delta, behavior: "smooth" });
  };

  // Add Manga to Library
  const handleAdd = async (manga: PopularManga, e: React.MouseEvent) => {
    e.stopPropagation();
    // Do not trigger click if user was dragging
    if (dragDistanceRef.current > 6) return;
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

  // Triplicate list to achieve continuous infinite drag & scroll in both directions
  const marqueeItems = [...popular, ...popular, ...popular];

  return (
    <div className="space-y-3 group/section relative select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Fire size={18} className="text-pastel-primary" weight="fill" />
          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800">
            Populer di MangaDex
          </h2>
        </div>
        <span className="text-[11px] text-slate-500 hidden sm:inline">
          Bisa di-drag kanan/kiri · Arahkan kursor untuk jeda · Klik untuk tambah
        </span>
      </div>

      {/* Marquee Viewport with subtle edge gradient masks & hover arrows */}
      <div className="relative w-full overflow-hidden py-1 rounded-2xl">
        {/* Left Fade Mask */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-8 sm:w-16 bg-gradient-to-r from-pastel-canvas via-pastel-canvas/80 to-transparent z-20" />
        {/* Right Fade Mask */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 sm:w-16 bg-gradient-to-l from-pastel-canvas via-pastel-canvas/80 to-transparent z-20" />

        {/* Floating Arrow Left */}
        <button
          type="button"
          onClick={() => scrollByAmount("left")}
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-2.5 rounded-full bg-white/90 text-pastel-primary border border-pastel-accent/40 shadow-md backdrop-blur-xs hover:bg-pastel-primary hover:text-white transition-all opacity-0 group-hover/section:opacity-100 hidden sm:flex items-center justify-center cursor-pointer"
          aria-label="Scroll ke kiri"
        >
          <CaretLeft size={16} weight="bold" />
        </button>

        {/* Floating Arrow Right */}
        <button
          type="button"
          onClick={() => scrollByAmount("right")}
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-2.5 rounded-full bg-white/90 text-pastel-primary border border-pastel-accent/40 shadow-md backdrop-blur-xs hover:bg-pastel-primary hover:text-white transition-all opacity-0 group-hover/section:opacity-100 hidden sm:flex items-center justify-center cursor-pointer"
          aria-label="Scroll ke kanan"
        >
          <CaretRight size={16} weight="bold" />
        </button>

        {/* Scrollable Track with Drag & Touch Support */}
        <div
          ref={sliderRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={() => {
            handleMouseUpOrLeave();
            isPausedRef.current = false;
          }}
          onMouseEnter={() => {
            isPausedRef.current = true;
          }}
          onTouchStart={() => {
            isPausedRef.current = true;
          }}
          onTouchEnd={() => {
            isPausedRef.current = false;
          }}
          className={`flex gap-3.5 sm:gap-4 overflow-x-auto py-1 px-1 scroll-smooth ${
            isDragging ? "cursor-grabbing" : "cursor-grab"
          }`}
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {marqueeItems.map((manga, idx) => {
            const isAdded = addedIds[manga.id];
            const isAdding = addingId === manga.id;

            return (
              <div
                key={`${manga.id}-${idx}`}
                className="group/item relative w-28 sm:w-34 aspect-[2/3] shrink-0 rounded-2xl overflow-hidden border border-pastel-accent/35 bg-white shadow-2xs hover:border-pastel-primary hover:shadow-md transition-all duration-200 cursor-pointer select-none"
                title={`${manga.title} - Klik untuk tambah ke library`}
                onClick={(e) => handleAdd(manga, e)}
              >
                {/* Poster Cover */}
                {manga.coverUrl ? (
                  <img
                    src={getCoverUrl(manga.coverUrl) || ""}
                    alt={manga.title}
                    loading="lazy"
                    draggable={false}
                    className="w-full h-full object-cover group-hover/item:scale-105 transition-transform duration-300 pointer-events-none select-none"
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
