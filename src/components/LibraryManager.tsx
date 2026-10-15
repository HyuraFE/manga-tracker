import React, { useState, useEffect } from "react";
import {
  Trash,
  Plus,
  SpinnerGap,
  MagnifyingGlass,
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

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  reading: { label: "Reading", color: "bg-pastel-primary text-white" },
  completed: { label: "Completed", color: "bg-emerald-600 text-white" },
  plan_to_read: { label: "Plan to Read", color: "bg-pastel-surface text-[#1e1b4b] border border-pastel-accent/40" },
  on_hold: { label: "On Hold", color: "bg-amber-100 text-amber-800" },
  dropped: { label: "Dropped", color: "bg-slate-200 text-slate-700" },
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
      prev.map((item) => (item.id === id ? { ...item, currentChapter: newChapter } : item))
    );

    try {
      const res = await fetch("/api/library", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, currentChapter: newChapter }),
      });
      if (!res.ok) {
        fetchLibrary(); // rollback
      }
    } catch {
      fetchLibrary(); // rollback
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);

    // Optimistic UI update
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus as any } : item))
    );

    try {
      const res = await fetch("/api/library", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (!res.ok) {
        fetchLibrary(); // rollback
      }
    } catch {
      fetchLibrary(); // rollback
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Hapus "${title}" dari library Anda?`)) return;

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
    const matchesSearch = item.title.toLowerCase().includes(searchFilter.toLowerCase().trim());
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
      <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
        <SpinnerGap size={36} className="animate-spin text-pastel-primary" />
        <span className="text-sm font-medium">Memuat library manga...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search & Filter Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
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
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? "bg-pastel-primary text-white shadow-sm"
                    : "bg-white/80 text-slate-700 hover:bg-white border border-pastel-accent/30"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? "bg-white/25 text-white" : "bg-pastel-surface/60 text-slate-600"
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
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filter library saya..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white/80 border border-pastel-accent/40 rounded-xl focus:outline-none focus:border-pastel-primary focus:bg-white transition-all text-[#1e1b4b]"
            />
          </div>
        )}
      </div>

      {/* Manga Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-white/60 border border-pastel-accent/30 rounded-2xl p-12 text-center max-w-md mx-auto my-6">
          <div className="w-16 h-16 rounded-2xl bg-pastel-surface/60 flex items-center justify-center text-2xl mx-auto mb-4 text-pastel-primary">
            📚
          </div>
          <h3 className="text-base font-bold text-[#1e1b4b]">
            {items.length === 0
              ? "Belum ada manga di library Anda"
              : "Tidak ada manga di filter ini"}
          </h3>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            {items.length === 0
              ? "Klik tombol '+ Cari & Tambah Manga' di pojok kanan atas untuk mulai menyimpan bacaan."
              : "Coba ganti tab status atau kata kunci filter pencarian di atas."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
          {filteredItems.map((manga) => {
            const statusConfig = STATUS_LABELS[manga.status] || STATUS_LABELS.reading;

            return (
              <div
                key={manga.id}
                className="group bg-white rounded-2xl border border-pastel-accent/40 hover:border-pastel-accent hover:shadow-md transition-all overflow-hidden flex flex-col"
              >
                {/* Cover Image */}
                <div className="relative aspect-[2/3] bg-pastel-surface/30 overflow-hidden">
                  {manga.coverUrl ? (
                    <img
                      src={getCoverUrl(manga.coverUrl) || ""}
                      alt={manga.title}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                      No Cover
                    </div>
                  )}

                  {/* Subtle top vignette for badge clarity */}
                  <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-black/25 to-transparent pointer-events-none" />

                  {/* Status Badge floating */}
                  <div className="absolute top-2 left-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm backdrop-blur-sm ${statusConfig.color}`}
                    >
                      {statusConfig.label}
                    </span>
                  </div>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleDelete(manga.id, manga.title)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/90 text-rose-500 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-50 shadow-sm cursor-pointer"
                    title="Hapus dari library"
                  >
                    <Trash size={14} weight="bold" />
                  </button>
                </div>

                {/* Card Content */}
                <div className="p-3 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3
                      className="font-bold text-xs sm:text-sm text-[#1e1b4b] line-clamp-2 leading-snug"
                      title={manga.title}
                    >
                      {manga.title}
                    </h3>
                  </div>

                  <div className="space-y-2 pt-1 border-t border-pastel-surface/40">
                    {/* Chapter Progress Controls */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] text-slate-500">Ch.</span>
                        <input
                          type="number"
                          value={manga.currentChapter}
                          onChange={(e) =>
                            handleUpdateChapter(manga.id, parseFloat(e.target.value) || 0)
                          }
                          className="w-14 text-xs font-bold text-pastel-primary bg-pastel-canvas/60 border border-pastel-accent/40 rounded-lg px-1.5 py-0.5 text-center focus:outline-none focus:border-pastel-primary"
                        />
                      </div>

                      {/* Quick +1 Chapter Button */}
                      <button
                        type="button"
                        onClick={() => handleUpdateChapter(manga.id, manga.currentChapter + 1)}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg bg-pastel-primary text-white hover:bg-pastel-secondary active:scale-95 transition-all shadow-xs cursor-pointer flex items-center gap-0.5"
                        title="Tambah 1 chapter"
                      >
                        <Plus size={12} weight="bold" />
                        <span>1</span>
                      </button>
                    </div>

                    {/* Status Dropdown Selector */}
                    <div>
                      <select
                        value={manga.status}
                        onChange={(e) => handleUpdateStatus(manga.id, e.target.value)}
                        className="w-full text-[11px] font-medium bg-pastel-surface/30 border border-pastel-accent/30 rounded-lg py-1 px-1.5 text-slate-700 focus:outline-none cursor-pointer"
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
