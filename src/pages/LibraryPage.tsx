import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Volume2, VolumeX, Play, Check, ArrowLeft, X, SlidersHorizontal, LayoutGrid, Images, Film, ChevronRight, BookOpen } from "lucide-react";
import api from "../lib/api";
import { cn } from "../lib/utils";
import { useAuthStore } from "../store/useAuthStore";

/**
 * Interface for Library items
 */
interface LibraryItem {
  id: string;
  type: "image" | "video";
  url: string;
  title: string;
  description: string;
  total?: string;
  viewCount?: number;
  reference?: string;
  referenceLink?: string;
  aspect: string;
  categoryId?: string;
  category?: {
    id: string;
    name: string;
  } | null;
}

interface LibraryCategory {
  id: string;
  name: string;
  isActive: boolean;
  order: number;
}

/**
 * FeedItem Component - Individual post styling
 */
function FeedItem({ item, onFullscreen, onView, isLightMode }: { item: LibraryItem, onFullscreen: (item: LibraryItem) => void, onView: (item: LibraryItem) => void, isLightMode: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isVisibleRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isShared, setIsShared] = useState(false);
  const sourceUrl = "https://api.wesis2026.com"

  // Auto-play/pause based on visibility
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (item.type === "video" && videoRef.current) {
            if (entry.isIntersecting) {
              if (!isVisibleRef.current) onView(item);
              isVisibleRef.current = true;
              videoRef.current.play().catch(() => { });
              setIsPlaying(true);
            } else {
              isVisibleRef.current = false;
              videoRef.current.pause();
              setIsPlaying(false);
            }
          }
        });
      },
      { threshold: 0.6 }
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => observer.disconnect();
  }, [item.type, item.id, onView]);

  const handleShare = async () => {
    const shareData = {
      title: item.title,
      text: item.description,
      url: window.location.origin + (item.type === "video" ? `/library?id=${item.id}` : item.url),
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        setIsShared(true);
        setTimeout(() => setIsShared(false), 2000);
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      className={cn("mb-12 w-full max-w-[500px] mx-auto rounded-xl overflow-hidden shadow-sm border", isLightMode ? "bg-white border-slate-200" : "bg-black border-white/10")}
    >
      {/* Header */}
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-linear-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] p-[2px]">
            <div className="w-full h-full rounded-full bg-black flex items-center justify-center p-1">
              <img src="/wesis-icon.png" alt="WESIS" className="w-full h-full object-contain brightness-110" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className={cn("text-sm font-bold leading-none", isLightMode ? "text-slate-900" : "text-white")}>WESIS</span>
            <span className={cn("text-sm opacity-70", isLightMode ? "text-slate-500" : "text-white/50")}>{item.viewCount ?? 0} views</span>
          </div>
        </div>
        <button
          onClick={handleShare}
          className="transition-transform active:scale-90 hover:opacity-70 group relative"
        >
          <AnimatePresence mode="wait">
            {isShared ? (
              <motion.div key="check" initial={{ scale: 0.5 }} animate={{ scale: 1 }} exit={{ scale: 0.5 }}>
                <Check className="w-[26px] h-[26px] text-green-400" />
              </motion.div>
            ) : (
              <motion.div key="share" initial={{ scale: 0.5 }} animate={{ scale: 1 }} exit={{ scale: 0.5 }}>
                <Share2 className={cn("w-[26px] h-[26px]", isLightMode ? "text-slate-600 hover:text-slate-800" : "text-white hover:text-white/80")} />
              </motion.div>
            )}
          </AnimatePresence>

          {isShared && (
            <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-black text-sm px-2 py-1 rounded font-bold shadow-lg">
              คัดลอกแล้ว!
            </span>
          )}
        </button>
      </div>

      {/* Media Content Area */}
      <div
        className="relative bg-zinc-900 flex items-center justify-center cursor-pointer group"
        onClick={() => onFullscreen(item)}
      >
        {item.type === "video" ? (
          <>
            <video
              ref={videoRef}
              src={`${sourceUrl}${item.url}`}
              className="w-full h-auto block"
              loop
              muted={isMuted}
              playsInline
            />

            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                <div className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center border border-white/20">
                  <Play className="w-6 h-6 text-white fill-white ml-1" />
                </div>
              </div>
            )}

            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <span className="text-sm font-bold text-white bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-md">คลิกเพื่อดูเต็มจอ</span>
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMuted(!isMuted);
                }}
                className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white border border-white/10 hover:bg-black/70 transition-all shadow-lg"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          </>
        ) : (
          <div className="relative w-full h-auto">
            <img
              src={`${sourceUrl}${item.url}`}
              alt={item.title}
              className="w-full h-auto block"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <span className="text-sm font-bold text-white bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-md">คลิกเพื่อดูเต็มจอ</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Info */}
      <div className="flex flex-col gap-1 pointer-events-none p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn("text-base font-bold drop-shadow-md", isLightMode ? "text-slate-900" : "text-white")}>{item.title}</span>
          {item.category && (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-violet-500/20 text-violet-400 border border-violet-500/30">
              {item.category.name}
            </span>
          )}
        </div>
        <span className={cn("text-sm drop-shadow-md whitespace-pre-line", isLightMode ? "text-slate-500" : "text-white/50")}>{item.description}</span>


        {(item.reference || item.referenceLink) && (
          <div className="mt-3 pt-3 border-t border-white/5 pointer-events-auto">

            <div className={cn("text-sm uppercase tracking-wider flex items-center gap-2", isLightMode ? "text-slate-400" : "text-white/30")}>
              {item.referenceLink ? (
                <div className="grid gap-2">
                  <span className={cn("text-sm drop-shadow-md whitespace-pre-line", isLightMode ? "text-slate-500" : "text-white/50")}>อ้างอิง: {item.reference}</span>
                  <a
                    href={item.referenceLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline font-bold text-blue-400 truncate max-w-[200px]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    ลิงก์ต้นฉบับ
                  </a>
                </div>
              ) : (
                <span className="font-bold truncate max-w-[200px]">{item.reference}</span>
              )}

            </div>
          </div>

        )}
      </div>
    </motion.div>
  );
}

/**
 * CategoryAlbumCard — Instagram/Facebook album-style cover.
 * Shows cover media + name + item count. Tap drills into feed.
 */
function CategoryAlbumCard({
  title,
  count,
  cover,
  icon,
  isLightMode,
  onOpen,
  index = 0,
}: {
  title: string;
  count: number;
  cover?: LibraryItem | null;
  icon?: React.ReactNode;
  isLightMode: boolean;
  onOpen: () => void;
  index?: number;
}) {
  const sourceUrl = "https://api.wesis2026.com";

  return (
    <motion.button
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.2) }}
      onClick={onOpen}
      className={cn(
        "group relative aspect-square w-full overflow-hidden rounded-2xl border text-left transition-transform active:scale-[0.97]",
        isLightMode ? "border-slate-200 bg-slate-100" : "border-white/10 bg-zinc-900"
      )}
    >
      {cover ? (
        cover.type === "video" ? (
          <video
            src={`${sourceUrl}${cover.url}`}
            className="absolute inset-0 h-full w-full object-cover"
            muted
            playsInline
            preload="metadata"
          />
        ) : (
          <img
            src={`${sourceUrl}${cover.url}`}
            alt={title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        )
      ) : (
        <div className={cn("absolute inset-0 flex items-center justify-center", isLightMode ? "bg-slate-100" : "bg-zinc-800")}>
          {icon ?? <Images className={cn("h-8 w-8", isLightMode ? "text-slate-300" : "text-white/20")} />}
        </div>
      )}

      {/* gradient for legibility */}
      <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/20 to-black/10" />

      {/* media-type badge */}
      {cover?.type === "video" && (
        <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-md">
          <Film className="h-3 w-3" />
          วิดีโอ
        </div>
      )}

      {/* count badge */}
      <div className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-md">
        {count} โพสต์
      </div>

      {/* bottom label */}
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-1 p-2.5">
        <span className="line-clamp-2 text-sm font-bold leading-tight text-white drop-shadow-md">{title}</span>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md transition-colors group-hover:bg-violet-500">
          <ChevronRight className="h-4 w-4" />
        </span>
      </div>
    </motion.button>
  );
}

/**
 * Main Page Component — Category album home + drill-in Instagram-style feed
 */
export default function LibraryPage() {
  const [fullscreenItem, setFullscreenItem] = useState<LibraryItem | null>(null);
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const { user } = useAuthStore();
  const recordView = useCallback((item: LibraryItem) => {
    if (!user?.id) return;
    api.post(`/library/${item.id}/view`, { userId: user.id }).then((response) => {
      const viewCount = response.data?.data?.viewCount;
      if (typeof viewCount === "number") {
        setLibraryItems((items) => items.map((current) => current.id === item.id ? { ...current, viewCount } : current));
      }
    }).catch((error) => {
      console.error("Failed to record library view:", error);
    });
  }, [user?.id]);
  const [categories, setCategories] = useState<LibraryCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isLightMode = (user as any)?.currentStage >= 5;
  const sourceUrl = "https://api.wesis2026.com"

  useEffect(() => {
    if (fullscreenItem?.type === "image") recordView(fullscreenItem);
  }, [fullscreenItem, user?.id]);

  useEffect(() => {
    const fetchLibrary = async () => {
      try {
        const res = await api.get("/library");
        setLibraryItems(res.data.data || []);
      } catch (error) {
        console.error("Failed to fetch library:", error);
      } finally {
        setIsLoading(false);
      }
    };
    const fetchCategories = async () => {
      try {
        const res = await api.get("/library-categories");
        setCategories(res.data.data || []);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };
    fetchLibrary();
    fetchCategories();
  }, []);

  // Deep-link: /library?id=xxx opens fullscreen, /library?category=yyy opens album
  useEffect(() => {
    if (libraryItems.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const deepId = params.get("id");
    const deepCategory = params.get("category");
    if (deepCategory) {
      setSelectedCategoryId(deepCategory);
    }
    if (deepId) {
      const found = libraryItems.find((i) => i.id === deepId);
      if (found) {
        setFullscreenItem(found);
        if (found.categoryId) setSelectedCategoryId(found.categoryId);
      }
    }
  }, [libraryItems]);

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.order - b.order),
    [categories]
  );

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of libraryItems) {
      if (item.categoryId) map.set(item.categoryId, (map.get(item.categoryId) ?? 0) + 1);
    }
    return map;
  }, [libraryItems]);

  const coverFor = (categoryId: string | null): LibraryItem | null => {
    if (categoryId === null) return libraryItems[0] ?? null;
    return libraryItems.find((i) => i.categoryId === categoryId) ?? null;
  };

  const filteredItems = selectedCategoryId
    ? libraryItems.filter((item) => item.categoryId === selectedCategoryId)
    : libraryItems;

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  const openCategory = (id: string | null) => {
    setSelectedCategoryId(id);
    const url = new URL(window.location.href);
    if (id) url.searchParams.set("category", id);
    else url.searchParams.delete("category");
    window.history.replaceState(null, "", url.toString());
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const isHome = selectedCategoryId === null;

  return (
    <div className="max-w-[500px] mx-auto pt-4 md:pt-0 pb-24">
      {/* Sticky Header */}
      <header className={cn(
        "fixed top-0 left-0 right-0 md:relative md:top-auto backdrop-blur-xl border-b z-30 px-6 py-4 mb-6 md:rounded-2xl md:mb-10",
        isLightMode ? "bg-zinc-50/80 border-slate-200 md:bg-white/80" : "bg-black/80 border-white/10 md:bg-white/5"
      )}>
        <div className="flex items-center justify-between max-w-[500px] mx-auto">
          {!isHome ? (
            <button
              onClick={() => openCategory(null)}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full transition-transform active:scale-95",
                isLightMode ? "bg-slate-100 text-slate-700" : "bg-white/10 text-white"
              )}
              aria-label="กลับไปหน้าหมวดหมู่"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : (
            <div className="relative w-12 h-12">
              <img src="/wesis-icon.png" alt="WeSIS Logo" className="w-full h-full object-contain" />
            </div>
          )}
          <h2 className={cn("text-2xl font-bold text-center flex-1", !isHome && "pr-10", isHome && "pr-12", isLightMode ? "text-slate-900" : "text-white")}>
            {isHome ? "คลังความรู้" : selectedCategory?.name ?? "คลังความรู้"}
          </h2>
          <button
            onClick={() => setIsFilterOpen(true)}
            className={cn(
              "flex items-center gap-1.5 text-sm font-bold px-3 py-2 rounded-full backdrop-blur-md transition-all active:scale-95",
              selectedCategoryId
                ? "bg-violet-500 text-white"
                : isLightMode
                  ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  : "bg-white/10 text-white hover:bg-white/20"
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            {selectedCategory ? selectedCategory.name : "หมวดหมู่"}
          </button>
        </div>

        {/* Quick album strip in detail view — jump between categories */}
        {!isHome && !isLoading && sortedCategories.length > 0 && (
          <div className="mx-auto mt-3 flex max-w-[500px] gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            <button
              onClick={() => openCategory(null)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
                isLightMode ? "bg-slate-100 text-slate-600" : "bg-white/10 text-white/70"
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              ทั้งหมด
            </button>
            {sortedCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => openCategory(cat.id)}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
                  selectedCategoryId === cat.id
                    ? "bg-violet-500 text-white"
                    : isLightMode
                      ? "bg-slate-100 text-slate-600"
                      : "bg-white/10 text-white/70"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Spacing for fixed header on mobile */}
      <div className={cn("md:hidden", isHome ? "h-16" : "h-28")}></div>

      {isHome ? (
        <>
          {/* Category album home — see everything at a glance */}
          <section className="px-2 pt-2">
            <div className="mb-3 flex items-center justify-between px-1">
              <h3 className={cn("flex items-center gap-2 text-base font-bold", isLightMode ? "text-slate-900" : "text-white")}>
                <BookOpen className="h-4 w-4 text-violet-400" />
                สำรวจตามหมวดหมู่
              </h3>
              <span className={cn("text-xs", isLightMode ? "text-slate-400" : "text-white/40")}>
                {sortedCategories.length} หมวด · {libraryItems.length} โพสต์
              </span>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className={cn("aspect-square animate-pulse rounded-2xl", isLightMode ? "bg-slate-100" : "bg-white/5")} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <CategoryAlbumCard
                  title="โพสต์ทั้งหมด"
                  count={libraryItems.length}
                  cover={coverFor(null)}
                  icon={<LayoutGrid className="h-8 w-8 text-white/20" />}
                  isLightMode={isLightMode}
                  onOpen={() => openCategory(sortedCategories[0]?.id ?? null)}
                  index={0}
                />
                {sortedCategories.map((cat, i) => (
                  <CategoryAlbumCard
                    key={cat.id}
                    title={cat.name}
                    count={counts.get(cat.id) ?? 0}
                    cover={coverFor(cat.id)}
                    isLightMode={isLightMode}
                    onOpen={() => openCategory(cat.id)}
                    index={i + 1}
                  />
                ))}
              </div>
            )}

            {!isLoading && sortedCategories.length === 0 && libraryItems.length === 0 && (
              <div className="py-10 text-center">
                <p className={cn("text-sm", isLightMode ? "text-slate-400" : "text-white/50")}>ไม่พบสื่อในคลังความรู้</p>
              </div>
            )}
          </section>

          {/* Instagram-style feed — latest content, gradually revealed on scroll */}
          <section className="mt-8 px-2">
            <div className="mb-3 flex items-center justify-between px-1">
              <h3 className={cn("flex items-center gap-2 text-base font-bold", isLightMode ? "text-slate-900" : "text-white")}>
                <Images className="h-4 w-4 text-violet-400" />
                ฟีดล่าสุด
              </h3>
              <span className={cn("text-xs", isLightMode ? "text-slate-400" : "text-white/40")}>ไถลงเพื่อดูเพิ่มเติม</span>
            </div>

            <div className="space-y-2">
              {isLoading ? (
                [1, 2, 3].map((n) => (
                  <div key={n} className={cn("mb-12 w-full max-w-[500px] mx-auto rounded-xl overflow-hidden border", isLightMode ? "bg-white border-slate-200" : "bg-black border-white/10")}>
                    <div className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse" />
                        <div className="h-3 w-28 bg-white/5 rounded animate-pulse" />
                      </div>
                      <div className="w-4 h-4 bg-white/5 rounded animate-pulse" />
                    </div>

                    <div className="relative aspect-4/5 bg-white/5 overflow-hidden">
                      <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/3 to-transparent -translate-x-full animate-shimmer" />
                    </div>

                    <div className="p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-40 bg-white/10 rounded animate-pulse" />
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 w-full bg-white/5 rounded animate-pulse" />
                        <div className="h-3 w-2/3 bg-white/5 rounded animate-pulse" />
                      </div>
                    </div>
                  </div>
                ))
              ) : filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <FeedItem key={item.id} item={item} onFullscreen={setFullscreenItem} onView={recordView} isLightMode={isLightMode} />
                ))
              ) : (
                <div className="py-20 text-center space-y-4">
                  <div className={cn("w-16 h-16 rounded-full mx-auto flex items-center justify-center", isLightMode ? "bg-slate-100" : "bg-white/5")}>
                    <X className={cn("w-8 h-8", isLightMode ? "text-slate-300" : "text-white/20")} />
                  </div>
                  <p className={cn(isLightMode ? "text-slate-400" : "text-white/50")}>ไม่พบสื่อในคลังความรู้</p>
                </div>
              )}
            </div>
          </section>
        </>
      ) : (
        <>
          {/* Category detail — album header + filtered Instagram feed */}
          <div className="px-2 pt-2">
            <div className={cn("mb-4 flex items-center justify-between rounded-2xl border px-4 py-3", isLightMode ? "border-slate-200 bg-white" : "border-white/10 bg-white/5")}>
              <div>
                <p className={cn("text-sm font-bold", isLightMode ? "text-slate-900" : "text-white")}>
                  {selectedCategory?.name}
                </p>
                <p className={cn("text-xs", isLightMode ? "text-slate-400" : "text-white/40")}>
                  {filteredItems.length} โพสต์ในอัลบั้มนี้
                </p>
              </div>
              <button
                onClick={() => openCategory(null)}
                className="text-xs font-bold text-violet-400 hover:underline"
              >
                ดูอัลบั้มอื่น
              </button>
            </div>
          </div>

          {/* Feed List (filtered) */}
          <div className="space-y-2 px-2">
            {isLoading ? (
              [1, 2, 3].map((n) => (
                <div key={n} className={cn("mb-12 w-full max-w-[500px] mx-auto rounded-xl overflow-hidden border", isLightMode ? "bg-white border-slate-200" : "bg-black border-white/10")}>
                  <div className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse" />
                      <div className="h-3 w-28 bg-white/5 rounded animate-pulse" />
                    </div>
                    <div className="w-4 h-4 bg-white/5 rounded animate-pulse" />
                  </div>

                  <div className="relative aspect-4/5 bg-white/5 overflow-hidden">
                    <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/3 to-transparent -translate-x-full animate-shimmer" />
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-40 bg-white/10 rounded animate-pulse" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 w-full bg-white/5 rounded animate-pulse" />
                      <div className="h-3 w-2/3 bg-white/5 rounded animate-pulse" />
                    </div>
                  </div>
                </div>
              ))
            ) : filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <FeedItem key={item.id} item={item} onFullscreen={setFullscreenItem} onView={recordView} isLightMode={isLightMode} />
              ))
            ) : (
              <div className="py-20 text-center space-y-4">
                <div className={cn("w-16 h-16 rounded-full mx-auto flex items-center justify-center", isLightMode ? "bg-slate-100" : "bg-white/5")}>
                  <X className={cn("w-8 h-8", isLightMode ? "text-slate-300" : "text-white/20")} />
                </div>
                <p className={cn(isLightMode ? "text-slate-400" : "text-white/50")}>ยังไม่มีสื่อในหมวดหมู่นี้</p>
                <button onClick={() => openCategory(null)} className="text-sm font-bold text-violet-400 hover:underline">
                  กลับไปดูอัลบั้มทั้งหมด
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Footer info */}
      <footer className={cn("py-12 text-center border-t mt-10", isLightMode ? "border-slate-200" : "border-white/10")}>
        <p className={cn("text-sm uppercase tracking-widest", isLightMode ? "text-slate-300" : "text-white/30")}>
          End of library content
        </p>
      </footer>

      {/* Category Filter Modal */}
      <AnimatePresence>
        {isFilterOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-90 bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center"
            onClick={() => setIsFilterOpen(false)}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="w-full max-w-[420px] mx-auto rounded-t-3xl md:rounded-3xl overflow-hidden bg-zinc-900 border border-white/10 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 flex items-center justify-between border-b border-white/10">
                <h3 className="text-lg font-bold text-white">กรองตามหมวดหมู่</h3>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
                <button
                  onClick={() => { openCategory(null); setIsFilterOpen(false); }}
                  className={cn(
                    "w-full text-left px-4 py-4 rounded-2xl border transition-all flex items-center justify-between",
                    selectedCategoryId === null
                      ? "bg-violet-500 border-violet-400 text-white"
                      : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                  )}
                >
                  <span className="font-bold">ทั้งหมด</span>
                  {selectedCategoryId === null && <Check className="w-5 h-5" />}
                </button>

                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { openCategory(cat.id); setIsFilterOpen(false); }}
                    className={cn(
                      "w-full text-left px-4 py-4 rounded-2xl border transition-all flex items-center justify-between",
                      selectedCategoryId === cat.id
                        ? "bg-violet-500 border-violet-400 text-white"
                        : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                    )}
                  >
                    <span className="font-bold">{cat.name}</span>
                    {selectedCategoryId === cat.id && <Check className="w-5 h-5" />}
                  </button>
                ))}

                {categories.length === 0 && (
                  <p className="text-center text-sm text-white/40 py-8">ยังไม่มีหมวดหมู่</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {fullscreenItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 bg-black flex flex-col items-center justify-center p-4"
          >
            {/* Context Header for Fullscreen */}
            <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between bg-linear-to-b from-black/80 to-transparent z-10">
              <button
                onClick={() => setFullscreenItem(null)}
                className="flex items-center gap-2 text-white/80 hover:text-white transition-colors group"
              >
                <div className="p-2 rounded-full bg-white/10 group-hover:bg-white/20 transition-all">
                  <ArrowLeft className="w-6 h-6" />
                </div>
                <span className="font-medium">ย้อนกลับ</span>
              </button>
              <div className="w-10"></div>
            </div>

            {/* Content Display */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-5xl h-full flex items-center justify-center pointer-events-none"
            >
              {fullscreenItem.type === "video" ? (
                <video
                  src={`${sourceUrl}${fullscreenItem.url}`}
                  className="max-w-full max-h-full pointer-events-auto shadow-2xl"
                  autoPlay
                  controls
                  loop
                />
              ) : (
                <img
                  src={`${sourceUrl}${fullscreenItem.url}`}
                  alt={fullscreenItem.title}
                  className="max-w-full max-h-full object-contain pointer-events-auto"
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
