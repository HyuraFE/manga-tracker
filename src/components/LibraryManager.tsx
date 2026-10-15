import React, { useState, useEffect } from "react";
import {
  Trash,
  Plus,
  Minus,
  SpinnerGap,
  MagnifyingGlass,
  ArrowSquareOut,
  Books,
  BookOpen,
  CheckCircle,
  Clock,
  X,
} from "@phosphor-icons/react";

export interface UserMangaItem {
  id: string;
  userId: string;
  mangaId: string;
  title: string;
  coverUrl: string | null;
  currentChapter: number;
  totalChapters: number | null;
  status: "reading" | "completed" | "on_hold" | "dropped" | "plan_to_read";
  updatedAt: string | Date;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string; dotClass: string }
> = {
  reading: {
    label: "Reading",
    badgeClass: "bg-pastel-primary text-white shadow-xs",
    dotClass: "bg-pastel-primary",
  },
  completed: {
    label: "Completed",
    badgeClass: "bg-emerald-600 text-white shadow-xs",
    dotClass: "bg-emerald-600",
  },
  plan_to_read: {
    label: "Plan to Read",
    badgeClass: "bg-white/95 text-slate-800 border border-pastel-accent/50 shadow-xs",
    dotClass: "bg-slate-400",
  },
  on_hold: {
    label: "On Hold",
    badgeClass: "bg-amber-100 text-amber-900 border border-amber-200 shadow-xs",
    dotClass: "bg-amber-500",
  },
  dropped: {
    label: "Dropped",
    badgeClass: "bg-slate-100 text-slate-700 border border-slate-300 shadow-xs",
    dotClass: "bg-slate-400",
  },
};

const getCoverUrl = (url: string | null) => {
  if (!url) return null;
  if (url.startsWith("https://uploads.mangadex.org/")) {
    return `/api/manga/cover?url=${encodeURIComponent(url)}`;
  }
  return url;
};

export default function LibraryManager() {
  const [items, setItems] = useState<UserMangaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchFilter, setSearchFilter] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchLibrary = async () => {
    try {
      const res = await fetch("/api/library");
      if (res.ok) {
        const json = await res.json();
        setItems(json.data || []);
      }
    } catch (err) {
      console.error("Gagal memuat library:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLibrary();

    const handleUpdate = () => {
      fetchLibrary();
    };

    window.addEventListener("manga-library-updated", handleUpdate);
    return () => window.removeEventListener("manga-library-updated", handleUpdate);
  }, []);

  const handleUpdateChapter = async (id: string, newChapter: number) => {
    if (newChapter < 0) return;
    setUpdatingId(id);

    // Optimistic UI update
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, currentChapter: newChapter } : item
      )
    );

    try {
      const res = await fetch("/api/library", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, currentChapter: newChapter }),
      });
      if (!res.ok) {
        fetchLibrary();
      }
    } catch {
      fetchLibrary();
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);

    // Optimistic UI update
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: newStatus as any } : item
      )
    );

    try {
      const res = await fetch("/api/library", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (!res.ok) {
        fetchLibrary();
      }
    } catch {
      fetchLibrary();
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Hapus "${title}" dari library?`)) return;

    setItems((prev) => prev.filter((item) => item.id !== id));

    try {
      await fetch(`/api/library?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
    } catch {
      fetchLibrary();
    }
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesTab = activeTab === "all" || item.status === activeTab;
    const matchesSearch = item.title
      .toLowerCase()
      .includes(searchFilter.toLowerCase().trim());
    return matchesTab && matchesSearch;
  });

  // Tab counts
  const counts = {
    all: items.length,
    reading: items.filter((i) => i.status === "reading").length,
    completed: items.filter((i) => i.status === "completed").length,
    plan_to_read: items.filter((i) => i.status === "plan_to_read").length,
    on_hold: items.filter((i) => i.status === "on_hold").length,
    dropped: items.filter((i) => i.status === "dropped").length,
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-3">
        <SpinnerGap size={36} className="animate-spin text-pastel-primary" />
        <span className="text-xs font-medium text-slate-500">Memuat library...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Metrics Bar */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white/75 backdrop-blur-xs p-3.5 rounded-2xl border border-pastel-accent/30 shadow-2xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Books size={14} className="text-pastel-primary" weight="bold" />
              <span>Total Manga</span>
            </div>
            <div className="text-xl font-extrabold text-[#1e1b4b] mt-1">{counts.all}</div>
          </div>

          <div className="bg-white/75 backdrop-blur-xs p-3.5 rounded-2xl border border-pastel-accent/30 shadow-2xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen size={14} className="text-pastel-primary" weight="bold" />
              <span>Sedang Dibaca</span>
            </div>
            <div className="text-xl font-extrabold text-pastel-primary mt-1">{counts.reading}</div>
          </div>

          <div className="bg-white/75 backdrop-blur-xs p-3.5 rounded-2xl border border-pastel-accent/30 shadow-2xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle size={14} className="text-emerald-600" weight="bold" />
              <span>Selesai</span>
            </div>
            <div className="text-xl font-extrabold text-emerald-600 mt-1">{counts.completed}</div>
          </div>

          <div className="bg-white/75 backdrop-blur-xs p-3.5 rounded-2xl border border-pastel-accent/30 shadow-2xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Clock size={14} className="text-slate-500" weight="bold" />
              <span>Rencana Baca</span>
            </div>
            <div className="text-xl font-extrabold text-[#1e1b4b] mt-1">{counts.plan_to_read}</div>
          </div>
        </div>
      )}

      {/* Filter Tabs & In-Library Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
        {/* Status Tabs */}
        <div className="bg-white/80 p-1 rounded-2xl border border-pastel-accent/30 shadow-xs flex items-center gap-1 overflow-x-auto scrollbar-none">
          {[
            { key: "all", label: "Semua", count: counts.all },
            { key: "reading", label: "Reading", count: counts.reading },
            { key: "completed", label: "Completed", count: counts.completed },
            { key: "plan_to_read", label: "Plan to Read", count: counts.plan_to_read },
            { key: "on_hold", label: "On Hold", count: counts.on_hold },
            { key: "dropped", label: "Dropped", count: counts.dropped },
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? "bg-pastel-primary text-white shadow-xs"
                    : "text-slate-600 hover:text-[#1e1b4b] hover:bg-pastel-surface/30"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive
                      ? "bg-white/25 text-white"
                      : "bg-pastel-surface/60 text-slate-600"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Quick Filter in library */}
        {items.length > 0 && (
          <div className="relative w-full md:w-64">
            <MagnifyingGlass
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              weight="bold"
            />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Cari judul di library..."
              className="w-full pl-8.5 pr-8 py-2 text-xs bg-white/90 border border-pastel-accent/40 rounded-xl focus:outline-none focus:border-pastel-primary focus:bg-white transition-all text-[#1e1b4b] placeholder-slate-400 shadow-2xs"
            />
            {searchFilter && (
              <button
                type="button"
                onClick={() => setSearchFilter("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={13} weight="bold" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Manga Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-white/80 border border-pastel-accent/30 rounded-3xl p-12 text-center max-w-md mx-auto my-8 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-pastel-surface/50 flex items-center justify-center text-pastel-primary mx-auto mb-4">
            <Books size={28} weight="duotone" />
          </div>
          <h3 className="text-base font-bold text-[#1e1b4b]">
            {items.length === 0
              ? "Library masih kosong"
              : "Tidak ada manga di filter ini"}
          </h3>
          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
            {items.length === 0
              ? "Klik tombol '+ Cari & Tambah Manga' di pojok kanan atas untuk mulai menyimpan bacaan."
              : "Coba pilih tab status lain atau hapus filter pencarian."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4 md:gap-5">
          {filteredItems.map((manga) => {
            const statusConfig = STATUS_CONFIG[manga.status] || STATUS_CONFIG.reading;

            return (
              <div
                key={manga.id}
                className="group bg-white rounded-2xl border border-pastel-accent/35 hover:border-pastel-accent hover:shadow-lg hover:shadow-pastel-primary/10 transition-all duration-200 overflow-hidden flex flex-col"
              >
                {/* Poster Cover */}
                <div className="relative aspect-[2/3] bg-pastel-surface/20 overflow-hidden">
                  {manga.coverUrl ? (
                    <img
                      src={getCoverUrl(manga.coverUrl) || ""}
                      alt={manga.title}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                      No Cover
                    </div>
                  )}

                  {/* Gradient vignette for badge and button contrast */}
                  <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-black/50 via-black/15 to-transparent pointer-events-none" />

                  {/* Status Badge */}
                  <div className="absolute top-2 left-2 z-10">
                    <span
                      className={`text-[9.5px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full ${statusConfig.badgeClass}`}
                    >
                      {statusConfig.label}
                    </span>
                  </div>

                  {/* Action Buttons Top-Right */}
                  <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
                    {/* Read on MangaDex link */}
                    <a
                      href={`https://mangadex.org/title/${manga.mangaId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-white/90 text-slate-700 hover:text-pastel-primary hover:bg-white shadow-xs transition-colors cursor-pointer"
                      title="Buka di MangaDex"
                    >
                      <ArrowSquareOut size={13} weight="bold" />
                    </a>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => handleDelete(manga.id, manga.title)}
                      className="p-1.5 rounded-lg bg-white/90 text-rose-500 hover:bg-rose-50 shadow-xs transition-colors cursor-pointer"
                      title="Hapus dari library"
                    >
                      <Trash size={13} weight="bold" />
                    </button>
                  </div>
                </div>

                {/* Card Info & Controls */}
                <div className="p-3 flex-1 flex flex-col justify-between space-y-3 bg-white">
                  <div>
                    <h3
                      className="font-bold text-xs sm:text-[13px] text-[#1e1b4b] line-clamp-2 leading-snug group-hover:text-pastel-primary transition-colors"
                      title={manga.title}
                    >
                      {manga.title}
                    </h3>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-pastel-surface/40">
                    {/* Stepper Chapter Controls */}
                    <div className="flex items-center gap-1.5">
                      {/* Decrement Button */}
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateChapter(manga.id, Math.max(0, manga.currentChapter - 1))
                        }
                        disabled={manga.currentChapter <= 0}
                        className="w-7 h-7 rounded-lg bg-pastel-canvas text-slate-600 hover:bg-pastel-surface hover:text-[#1e1b4b] disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center transition-colors cursor-pointer shrink-0 border border-pastel-accent/30"
                        title="Kurangi 1 chapter"
                      >
                        <Minus size={12} weight="bold" />
                      </button>

                      {/* Chapter Value Display & Input */}
                      <div className="flex-1 flex items-center justify-center bg-pastel-canvas/60 border border-pastel-accent/40 rounded-lg px-1.5 py-1 text-center">
                        <span className="text-[10px] text-slate-500 mr-1 font-medium">Ch.</span>
                        <input
                          type="number"
                          value={manga.currentChapter}
                          onChange={(e) =>
                            handleUpdateChapter(manga.id, parseFloat(e.target.value) || 0)
                          }
                          className="w-12 text-center text-xs font-bold text-pastel-primary bg-transparent focus:outline-none"
                        />
                      </div>

                      {/* Increment Button (+1) */}
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateChapter(manga.id, manga.currentChapter + 1)
                        }
                        className="w-7 h-7 rounded-lg bg-pastel-primary text-white hover:bg-pastel-secondary active:scale-90 flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-2xs font-bold"
                        title="Tambah 1 chapter"
                      >
                        <Plus size={12} weight="bold" />
                      </button>
                    </div>

                    {/* Status Dropdown */}
                    <div>
                      <select
                        value={manga.status}
                        onChange={(e) => handleUpdateStatus(manga.id, e.target.value)}
                        className="w-full text-[11px] font-medium bg-pastel-canvas/40 hover:bg-pastel-surface/30 border border-pastel-accent/40 rounded-lg py-1 px-2 text-slate-800 focus:outline-none focus:border-pastel-primary cursor-pointer transition-colors"
                      >
                        <option value="reading">Reading</option>
                        <option value="completed">Completed</option>
                        <option value="plan_to_read">Plan to Read</option>
                        <option value="on_hold">On Hold</option>
                        <option value="dropped">Dropped</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
