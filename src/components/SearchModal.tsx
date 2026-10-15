import React, { useState, useEffect } from "react";
import { MagnifyingGlass, X, Plus, Check, SpinnerGap } from "@phosphor-icons/react";

interface MangaSearchResult {
  id: string;
  title: string;
  description: string;
  coverUrl: string | null;
  status: string;
  year: number | null;
}

interface SearchModalProps {
  onMangaAdded?: () => void;
}

export default function SearchModal({ onMangaAdded }: SearchModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<MangaSearchResult[]>([]);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const [addingId, setAddingId] = useState<string | null>(null);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/manga/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
        }
      } catch (err) {
        console.error("Gagal mencari manga:", err);
      } finally {
        setLoading(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [query]);

  // Keyboard shortcut (Cmd/Ctrl + K and Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleAdd = async (manga: MangaSearchResult) => {
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
        if (onMangaAdded) onMangaAdded();
        window.dispatchEvent(new CustomEvent("manga-library-updated"));
      } else {
        const errData = await res.json();
        alert(errData.error || "Gagal menambahkan manga");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan jaringan");
    } finally {
      setAddingId(null);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="px-4 py-2.5 rounded-xl bg-pastel-primary text-white text-xs sm:text-sm font-semibold hover:bg-pastel-secondary transition-all shadow-sm shadow-pastel-primary/20 inline-flex items-center gap-2 cursor-pointer active:scale-95"
      >
        <Plus size={16} weight="bold" />
        <span>Tambah Manga</span>
        <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 text-[10px] bg-white/20 rounded-md font-mono text-white/90">
          ⌘K
        </kbd>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white border border-pastel-accent/40 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-pastel-surface/40 flex items-center justify-between bg-pastel-canvas/30">
              <div className="flex items-center gap-2.5 flex-1 mr-4">
                <MagnifyingGlass size={20} className="text-pastel-primary shrink-0" weight="bold" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari judul manga (misal: Frieren, One Piece, Solo Leveling)..."
                  autoFocus
                  className="w-full bg-transparent text-[#1e1b4b] placeholder-slate-400 text-sm focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-pastel-surface/40 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Results Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading && (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <SpinnerGap size={28} className="animate-spin text-pastel-primary" />
                  <span className="text-xs">Mencari di MangaDex...</span>
                </div>
              )}

              {!loading && query && results.length === 0 && (
                <div className="py-12 text-center text-slate-500 text-sm">
                  Tidak ada manga yang cocok dengan "<span className="font-semibold">{query}</span>".
                </div>
              )}

              {!loading && !query && (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Ketik nama manga di kotak pencarian untuk melihat hasil.
                </div>
              )}

              {!loading &&
                results.map((manga) => {
                  const isAdded = addedIds[manga.id];
                  const isAdding = addingId === manga.id;

                  return (
                    <div
                      key={manga.id}
                      className="flex items-start gap-4 p-3 rounded-xl border border-pastel-accent/30 hover:border-pastel-accent bg-white/70 hover:bg-pastel-surface/20 transition-colors"
                    >
                      {/* Cover Thumbnail */}
                      <div className="w-16 h-22 rounded-lg bg-pastel-surface/50 border border-pastel-accent/30 overflow-hidden shrink-0 flex items-center justify-center">
                        {manga.coverUrl ? (
                          <img
                            src={manga.coverUrl}
                            alt={manga.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span className="text-[10px] text-slate-400 text-center px-1">No Cover</span>
                        )}
                      </div>

                      {/* Detail Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-[#1e1b4b] truncate">{manga.title}</h4>
                          {manga.year && (
                            <span className="text-[11px] px-1.5 py-0.5 rounded bg-pastel-surface/60 text-slate-600 font-medium">
                              {manga.year}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                          {manga.description}
                        </p>

                        <div className="mt-2.5 flex items-center justify-between">
                          <span className="text-[11px] capitalize text-pastel-primary font-medium">
                            Status: {manga.status}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleAdd(manga)}
                            disabled={isAdded || isAdding}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                              isAdded
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-pastel-primary text-white hover:bg-pastel-secondary"
                            }`}
                          >
                            {isAdding ? (
                              <>
                                <SpinnerGap size={14} className="animate-spin" />
                                <span>Menyimpan...</span>
                              </>
                            ) : isAdded ? (
                              <>
                                <Check size={14} weight="bold" />
                                <span>Di Library</span>
                              </>
                            ) : (
                              <>
                                <Plus size={14} weight="bold" />
                                <span>+ Library</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-pastel-surface/40 bg-pastel-canvas/20 flex items-center justify-between text-xs text-slate-500 px-4">
              <span>Data bersumber dari MangaDex API</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1 rounded-lg text-slate-600 hover:bg-pastel-surface/40 font-medium cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
