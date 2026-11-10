import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { useAuthStore } from "../store/useAuthStore";
import { ChevronRight, ChevronLeft, Check, Loader2, HelpCircle, X } from "lucide-react";
import { cn } from "../lib/utils";
import { trackStageButtonClick } from "../lib/stageButtonTracking";

// Types
interface SisCheckItem {
  id: string;
  sisCheckId: string;
  message: string;
}

interface SisCheck {
  id: string;
  message: string;
  items: SisCheckItem[];
}

function TypewriterText({ text, delay = 50 }: { text: string; delay?: number }) {
  const [displayedText, setDisplayedText] = useState("");
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    let segments: string[] = [];
    if (typeof Intl !== 'undefined' && (Intl as any).Segmenter) {
      const segmenter = new (Intl as any).Segmenter("th", { granularity: "grapheme" });
      segments = Array.from(segmenter.segment(text)).map((s: any) => s.segment);
    } else {
      const regex = /[\u0E01-\u0E2E][\u0E31\u0E34-\u0E39\u0E47-\u0E4E]*|[\u0E30\u0E32\u0E33\u0E40-\u0E46]|./g;
      segments = text.match(regex)?.filter(Boolean) || Array.from(text);
    }

    let index = 0;
    setDisplayedText("");
    setComplete(false);

    const timer = setInterval(() => {
      if (index < segments.length) {
        const nextChar = segments[index];
        if (nextChar !== undefined) {
          setDisplayedText((prev) => prev + nextChar);
        }
        index++;
      } else {
        setComplete(true);
        clearInterval(timer);
      }
    }, delay);

    return () => clearInterval(timer);
  }, [text, delay]);

  return (
    <span className="relative inline-block min-h-[1.5em]">
      {displayedText}
      {!complete && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.6, repeat: Infinity }}
          className="inline-block w-[3px] h-[1.1em] bg-yellow-400 ml-0.5 align-middle"
        />
      )}
    </span>
  );
}

export default function SisCheckPage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const currentStage = (user as any)?.currentStage || 1;
  const isLightMode = currentStage === 5;

  const [loading, setLoading] = useState(true);
  const [checks, setChecks] = useState<SisCheck[]>([]);
  const [checkItems, setCheckItems] = useState<SisCheckItem[]>([]);

  // Navigation State
  const [currentOrderIndex, setCurrentOrderIndex] = useState(0);
  const [stepOrder, setStepOrder] = useState<number[]>([0, 1, 2]);

  const [selectedItems, setSelectedItems] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [activeModalCheck, setActiveModalCheck] = useState<string | null>(null);
  const [showNotReadyModal, setShowNotReadyModal] = useState(false);

  // Auto-redirect for hesitant users
  useEffect(() => {
    let timer: any;
    if (showNotReadyModal) {
      timer = setTimeout(() => {
        handleHesitantExit();
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [showNotReadyModal]);

  useEffect(() => {
    if (!user?.id) return;

    const fetchData = async () => {
      try {
        const [checksRes, logsRes] = await Promise.all([
          api.get('/sis/check'),
          api.get(`/sis/check/logs/${user.id}`)
        ]);

        const fetchedChecks: SisCheck[] = checksRes.data.data;
        setChecks(fetchedChecks);

        // Flatten check items for easier access like CheckFlow
        const flatItems = fetchedChecks.flatMap(c => c.items);
        setCheckItems(flatItems);

        const logs = logsRes.data.data;
        if (logs.length > 0) {
          const initialSelections: Record<string, string[]> = {};
          logs.forEach((log: any) => {
            if (!initialSelections[log.sisCheckId]) {
              initialSelections[log.sisCheckId] = [];
            }
            initialSelections[log.sisCheckId].push(log.sisCheckItemId);
          });
          setSelectedItems(initialSelections);
        }
      } catch (error) {
        console.error("Error fetching SIS data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.id]);

  // Derived step info
  const isSummaryStep = currentOrderIndex === checks.length && checks.length > 0;
  const currentCheckIndex = !isSummaryStep ? stepOrder[currentOrderIndex] : -1;
  const currentCheck = currentCheckIndex !== -1 ? checks[currentCheckIndex] : null;
  const itemsForCurrentCheck = currentCheck ? checkItems.filter((item) => item.sisCheckId === currentCheck.id) : [];

  // Selection
  const handleSelect = (itemId: string) => {
    if (isSummaryStep || !currentCheck) return;
    setSelectedItems((prev) => {
      const currentSelections = prev[currentCheck.id] || [];
      if (currentSelections.includes(itemId)) {
        return { ...prev, [currentCheck.id]: currentSelections.filter((id) => id !== itemId) };
      }
      return { ...prev, [currentCheck.id]: [...currentSelections, itemId] };
    });
  };

  const nextStep = () => {
    if (currentOrderIndex < checks.length) {
      setCurrentOrderIndex(currentOrderIndex + 1);
    }
  };

  const prevStep = () => {
    if (currentOrderIndex > 0) {
      setCurrentOrderIndex(currentOrderIndex - 1);
    } else {
      setShowIntro(true);
    }
  };

  const saveLogs = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const promises: any[] = [];
      for (const checkId in selectedItems) {
        const itemIds = selectedItems[checkId];
        for (const itemId of itemIds) {
          promises.push(api.post('/sis/check/log', {
            userId: user.id,
            sisCheckId: checkId,
            sisCheckItemId: itemId
          }));
        }
      }

      if (promises.length > 0) await Promise.all(promises);

      // Stage update is handled by individual button handlers
    } catch (error) {
      console.error("Error saving SIS logs:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHesitantExit = async () => {
    await saveLogs();
    navigate('/library');
  };

  const handleGoToClear = async () => {
    if (!user) return;
    try {
      await saveLogs();
      const cs = (user as any).currentStage || 1;
      if (cs < 2) {
        await api.patch(`/profiles/user/${user.id}`, { currentStage: 2 });
        setUser({ ...user, currentStage: 2 } as any);
      }
      navigate('/sis-clear');
    } catch (err) {
      console.error("Failed to finish SIS Check flow:", err);
      navigate('/sis-clear');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-6 gap-4">
        <Loader2 className="w-10 h-10 text-yellow-400 animate-spin" />
        <p className="text-white/40 font-normal uppercase tracking-widest text-sm">กำลังเตรียมข้อมูล...</p>
      </div>
    );
  }

  // Header Sub-component
  const Header = () => (
    <div className="w-full flex justify-between items-center mb-6 px-2 max-w-lg mx-auto">
      <div className="w-10 h-10">
        <img src="/wesis-icon.png" alt="WESIS" className="w-full h-full object-contain" />
      </div>
      <h1 className={cn("font-prompt font-bold text-lg uppercase tracking-tighter", isLightMode ? "text-slate-800" : "text-yellow-400")}>SIS Check</h1>
    </div>
  );

  if (showIntro) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-start relative px-6 animate-in fade-in duration-500 pt-6 min-h-screen",
        isLightMode ? "bg-[#f8fafc]" : "bg-black"
      )}>
        <Header />

        <div className="w-full max-w-lg space-y-12 relative overflow-visible px-2">

          <div className="flex items-end gap-3 md:gap-4 relative z-10 w-full">
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", damping: 15 }}
              className="shrink-0 relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-2 border-yellow-400 bg-zinc-800"
            >
              <img
                src="/model/model4.png"
                alt="Avatar"
                className="absolute inset-0 w-full h-full object-cover object-top scale-125 pointer-events-none"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: -20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className={cn(
                "relative border p-6 rounded-xl rounded-bl-none w-full max-w-[calc(100%-100px)] z-20 shadow-xl",
                isLightMode ? "bg-white border-slate-200" : "bg-zinc-900 border-white/10"
              )}
            >
              <div className={cn(isLightMode ? "text-slate-700" : "text-white", "text-sm md:text-base leading-relaxed")}>
                <TypewriterText
                  text="สวัสดีจ้ะ พี่จริงใจ เองนะ พี่ดีใจที่เราได้เจอกันนะคะ.... วันนี้พี่จะชวนเรามา Check กล่อง ปริศนา ที่พ็อตไม่เคยบอกเรา น้องลองกดที่กล่องดูสิ"
                  delay={40}
                />
              </div>
            </motion.div>
          </div>

          <div className="pt-6 border-t border-white/5 relative z-10 w-full">
            <div className="flex flex-wrap justify-center gap-6 md:gap-8 max-w-xl mx-auto items-center">
              {checks.map((_, idx) => (
                <motion.button
                  key={idx}
                  whileHover={{
                    scale: 1.05,
                    y: -10,
                    rotate: idx % 2 === 0 ? 3 : -3,
                    transition: { type: "spring", stiffness: 400, damping: 10 }
                  }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 30, rotate: (idx % 3 - 1) * 10 }}
                  animate={{ opacity: 1, y: 0, rotate: (idx % 3 - 1) * 5 }}
                  transition={{ delay: 1.2 + (idx * 0.1) }}
                  onClick={() => {
                    const order = [idx];
                    for (let i = 1; i < checks.length; i++) {
                      order.push((idx + i) % checks.length);
                    }
                    setStepOrder(order);
                    setCurrentOrderIndex(0);
                    setShowIntro(false);
                  }}
                  className={cn(
                    "relative aspect-square group",
                    idx === 2 ? "w-[60%] md:w-[45%]" : "w-[45%] md:w-[45%]"
                  )}
                >
                  <div className={cn(
                    "absolute inset-0 blur-2xl rounded-xl transition-all duration-500",
                    isLightMode ? "bg-slate-200/50 group-hover:bg-yellow-400/20" : "bg-yellow-400/10 group-hover:bg-yellow-400/30"
                  )} />
                  <div className={cn(
                    "relative h-full flex flex-col items-center justify-center border-2 rounded-xl transition-all overflow-hidden p-6 shadow-2xl",
                    isLightMode
                      ? "bg-white border-slate-200 group-hover:border-yellow-400/50"
                      : "bg-zinc-800 border-white/10 group-hover:border-yellow-400/50"
                  )}>
                    <div className={cn(
                      "absolute top-0 left-0 w-full h-1/3 border-b",
                      isLightMode ? "bg-slate-50/50 border-slate-100" : "bg-white/5 border-white/5"
                    )} />
                    <HelpCircle className="w-12 h-12 md:w-16 md:h-16 text-yellow-500/50 group-hover:text-yellow-400 group-hover:scale-110 transition-all duration-300 mb-2" />
                    <div className="relative">
                      <div className="absolute inset-0 blur-md bg-yellow-400/20 scale-150" />
                      <span className="relative text-lg font-normal text-yellow-400">
                        {idx + 1}
                      </span>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex flex-col relative px-4 max-w-lg mx-auto w-full animate-in fade-in duration-500",
      isLightMode ? "bg-[#f8fafc]" : "bg-black"
    )}>
      <Header />

      <AnimatePresence mode="wait">
        {isSummaryStep ? (
          <motion.div
            key="summary"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col pt-4 overflow-visible w-full"
          >
            <div className="flex items-end gap-3 md:gap-4 mb-6">
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 15 }}
                className="shrink-0 relative w-20 h-20 md:w-28 md:h-28 rounded-full overflow-hidden border-2 border-yellow-400 bg-zinc-800"
              >
                <img
                  src="/model/model4.png"
                  alt="Avatar"
                  className="absolute inset-0 w-full h-full object-cover object-top scale-125 pointer-events-none"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9, x: -20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className={cn(
                  "relative border p-5 rounded-xl rounded-bl-none flex-1 shadow-lg",
                  isLightMode ? "bg-white border-slate-200" : "bg-zinc-900 border-white/10"
                )}
              >
                <div className={cn(isLightMode ? "text-slate-700" : "text-white", "text-sm md:text-base leading-relaxed")}>
                  <TypewriterText
                    text="เปิดครบ 3 กล่องแล้ว...น้องคิดยังไงกับสิ่งที่ได้รู้ ??? น้องเลือกชีวิตที่น้องต้องการได้ด้วยหัวใจและสองมือของน้องเอง พี่เชื่อว่าน้องจะเลือกสิ่งที่ดีที่สุดให้กับตัวเองเสมอ อยากได้แบบไหน กดปุ่มด้านล่างเลยจ้ะ"
                    delay={30}
                  />
                </div>
              </motion.div>
            </div>

            <div className="flex flex-wrap md:flex-nowrap justify-center gap-3 mb-6 w-full px-2">
              <button
                onClick={() => {
                  trackStageButtonClick(user?.id, 1, "SIS_CHECK", "sis_check_not_yet", "ยังอ่ะ", "/library");
                  setShowNotReadyModal(true);
                }}
                disabled={isSubmitting}
                className="flex-1 w-full px-4 py-4 rounded-xl bg-white text-black font-bold text-base md:text-lg border-b-2 border-pink-500 hover:scale-[1.02] transition-all active:scale-95 shadow-md"
              >
                ยังอ่ะ
              </button>
              <button
                onClick={() => {
                  trackStageButtonClick(user?.id, 1, "SIS_CHECK", "sis_check_thinking", "แอบคิดนะ", "/sis-clear");
                  void handleGoToClear();
                }}
                disabled={isSubmitting}
                className="flex-1 w-full px-4 py-4 rounded-xl bg-white text-black font-bold text-base md:text-lg border-b-2 border-amber-400 hover:scale-[1.02] transition-all active:scale-95 shadow-md"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "แอบคิดนะ"}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 md:gap-6 flex-1 pb-6 w-full">
              {/* Column 1: If Continue (Notes 1 & 2) */}
              <div className="flex flex-col items-center space-y-4 md:space-y-6 w-full">
                <div className="text-center w-full">
                  <h4 className={cn(
                    "text-sm md:text-base font-bold leading-tight uppercase underline underline-offset-4 mb-1",
                    isLightMode ? "text-slate-800 decoration-pink-500" : "text-white decoration-pink-500/50"
                  )}>
                    ถ้า..ดูดพ็อตต่อ... <br /> น้องจะได้สิ่งนี้
                  </h4>
                  <div className="flex justify-center py-1 text-pink-500 animate-bounce">
                    <ChevronRight className="rotate-90 w-4 h-4 md:w-6 md:h-6" />
                  </div>
                </div>

                {/* Sticky Note 1: ตัวน้องเอง */}
                <motion.button
                  whileHover={{ scale: 1.05, rotate: -4 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveModalCheck(checks[0]?.id)}
                  className="relative w-full max-w-[170px] md:max-w-[200px] aspect-3/4 bg-[#f2e6d3] -rotate-2 p-3 sm:p-4 flex flex-col text-left cursor-pointer group rounded-xl shadow-xl hover:shadow-2xl transition-all border border-black/5"
                >
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-red-600 rounded-full border-2 border-white/20 shadow-md" />
                  <h5 className="text-blue-900 text-sm sm:text-sm font-bold mb-1.5 border-b border-blue-900/10 pb-1">ตัวน้องเอง</h5>
                  <ul className="text-zinc-800 text-xs sm:text-sm font-normal space-y-1 sm:space-y-1.5 list-disc pl-3 pt-1 overflow-hidden pointer-events-none pr-1">
                    {(selectedItems[checks[0]?.id] || []).slice(0, 3).map(id => (
                      <li key={id} className="line-clamp-2 leading-tight">{checkItems.find(i => i.id === id)?.message}</li>
                    ))}
                    {(selectedItems[checks[0]?.id] || []).length > 3 && (
                      <li className="list-none text-blue-600 pt-1 font-medium">และอื่นๆ...</li>
                    )}
                  </ul>
                  <div className="mt-auto pt-2 text-xs sm:text-xs text-blue-900 font-medium flex items-center justify-between w-full">
                    <span>คลิกเพื่อดูทั้งหมด</span> <ChevronRight className="w-3 h-3 text-blue-900/50 group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.button>

                {/* Sticky Note 2: คนรอบตัวน้อง */}
                <motion.button
                  whileHover={{ scale: 1.05, rotate: 3 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveModalCheck(checks[1]?.id)}
                  className="relative w-full max-w-[170px] md:max-w-[200px] aspect-3/4 bg-[#f2e6d3] rotate-1 p-3 sm:p-4 flex flex-col text-left cursor-pointer group rounded-xl shadow-xl hover:shadow-2xl transition-all border border-black/5"
                >
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-red-600 rounded-full border-2 border-white/20 shadow-md" />
                  <h5 className="text-blue-900 text-sm sm:text-sm font-bold mb-1.5 border-b border-blue-900/10 pb-1">คนรอบตัวน้อง</h5>
                  <ul className="text-zinc-800 text-xs sm:text-sm font-normal space-y-1 sm:space-y-1.5 list-disc pl-3 pt-1 overflow-hidden pointer-events-none pr-1">
                    {(selectedItems[checks[1]?.id] || []).slice(0, 3).map(id => (
                      <li key={id} className="line-clamp-2 leading-tight">{checkItems.find(i => i.id === id)?.message}</li>
                    ))}
                    {(selectedItems[checks[1]?.id] || []).length > 3 && (
                      <li className="list-none text-blue-600 pt-1 font-medium">และอื่นๆ...</li>
                    )}
                  </ul>
                  <div className="mt-auto pt-2 text-xs sm:text-xs text-blue-900 font-medium flex items-center justify-between w-full">
                    <span>คลิกเพื่อดูทั้งหมด</span> <ChevronRight className="w-3 h-3 text-blue-900/50 group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.button>
              </div>

              {/* Column 2: Gain */}
              <div className="flex flex-col items-center w-full">
                <div className="text-center mb-4 md:mb-6 w-full">
                  <h4 className="text-sm md:text-base font-bold text-yellow-400 leading-tight uppercase underline decoration-emerald-400/50 underline-offset-4 mb-1">
                    ถ้า...เลิกดูดพ็อต <br /> น้องจะได้สิ่งนี้
                  </h4>
                  <div className="flex justify-center py-1 text-emerald-400 animate-bounce">
                    <ChevronRight className="rotate-90 w-4 h-4 md:w-6 md:h-6" />
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-start items-center w-full pb-4 md:pb-0 h-full max-h-[300px]">
                  <motion.button
                    whileHover={{ scale: 1.05, rotate: 4 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveModalCheck(checks[2]?.id)}
                    className="relative w-full max-w-[180px] md:max-w-[220px] aspect-square bg-[#fff8a6] rotate-2 p-4 sm:p-5 md:p-6 text-left cursor-pointer group rounded-xl shadow-2xl hover:shadow-3xl transition-all border border-black/5 flex flex-col"
                  >
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-5 h-5 bg-orange-600 rounded-full border-2 border-white/20 shadow-md" />
                    <ul className="text-sm sm:text-sm text-zinc-800 pointer-events-none overflow-hidden space-y-2 flex-1 mt-2">
                      {(selectedItems[checks[2]?.id] || []).slice(0, 3).map(id => (
                        <li key={id} className="line-clamp-2 md:line-clamp-3 leading-snug text-sm sm:text-sm">{checkItems.find(i => i.id === id)?.message}</li>
                      ))}
                      {(selectedItems[checks[2]?.id] || []).length > 3 && (
                        <li className="list-none text-orange-600 pt-1 font-medium text-sm sm:text-sm">และข้ออื่นๆ อีกเพียบ...</li>
                      )}
                    </ul>
                    {(selectedItems[checks[2]?.id] || []).length === 0 && (
                      <div className="flex-1 flex items-center justify-center pointer-events-none">
                        <p className="text-blue-900/40 text-sm font-medium">ยังไม่ได้เลือก</p>
                      </div>
                    )}
                    <div className="mt-auto pt-3 text-xs sm:text-sm text-blue-900 font-medium flex items-center justify-between border-t border-blue-900/10">
                      <span>คลิกเพื่อดูทั้งหมด</span> <ChevronRight className="w-3 h-3 text-blue-900/50 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <>
            <div className="mb-4 md:mb-8 text-center w-full">
              <h2 className={cn(
                "text-xl md:text-lg font-bold leading-tight drop-shadow-sm",
                isLightMode ? "text-slate-800" : "text-white"
              )}>
                {currentCheck!.message}
              </h2>
            </div>

            <motion.div
              key={currentCheck!.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="flex flex-row gap-4 md:gap-10 items-stretch"
            >
              <div className="w-1/2 flex flex-col justify-end items-start relative pb-4 overflow-visible">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, x: -10 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  className="relative w-full h-full"
                >
                  <img
                    src="/model/model14.png"
                    alt="Character"
                    className="w-full h-full object-contain object-center origin-bottom pointer-events-none drop-shadow-[0_0_20px_rgba(250,204,21,0.05)]"
                  />
                </motion.div>
              </div>

              <div className="w-1/2 flex flex-col pt-2 md:pt-4">
                <div className="pr-2 space-y-3 pb-8">
                  {itemsForCurrentCheck.map((item) => {
                    const isSelected = selectedItems[currentCheck!.id]?.includes(item.id);
                    return (
                      <motion.button
                        key={item.id}
                        whileHover={{ x: 4, backgroundColor: isLightMode ? "rgba(241,245,249,0.8)" : "rgba(63,63,70,0.8)" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSelect(item.id)}
                        className={cn(
                          "w-full p-4 md:p-5 rounded-xl md:rounded-2xl border-2 text-start transition-all flex items-center justify-between group shadow-lg",
                          isSelected
                            ? "bg-yellow-400 border-yellow-400 text-black shadow-[0_0_15px_rgba(250,204,21,0.3)]"
                            : isLightMode
                              ? "bg-white border-slate-200 text-slate-700 hover:border-yellow-400/50"
                              : "bg-zinc-800/80 backdrop-blur-md border-white/10 text-white/90 hover:border-yellow-400/50"
                        )}
                      >
                        <span className={cn("text-sm sm:text-sm md:text-base font-normal leading-snug w-[85%]", isSelected ? "text-black" : isLightMode ? "text-slate-600" : "text-white")}>
                          {item.message}
                        </span>
                        <div className={cn(
                          "w-5 h-5 md:w-6 md:h-6 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors shadow-sm",
                          isSelected
                            ? "bg-black border-black text-yellow-400"
                            : isLightMode
                              ? "bg-slate-50 border-slate-200 group-hover:border-yellow-400/50 text-transparent"
                              : "bg-white/5 border-white/20 group-hover:border-yellow-400/50 text-transparent"
                        )}>
                          {isSelected && <Check className="w-3 h-3 md:w-4 md:h-4 stroke-4" />}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {!isSummaryStep && (
        <div className="flex justify-between items-center pt-6 z-10 gap-4 w-full">
          <button
            onClick={prevStep}
            className={cn(
              "w-14 h-14 md:w-16 md:h-16 rounded-xl flex items-center justify-center transition-all shrink-0 shadow-lg border",
              isLightMode
                ? "bg-white border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                : "bg-zinc-800 border-white/10 text-white/60 hover:bg-zinc-700 hover:text-white"
            )}
          >
            <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
          </button>

          <button
            onClick={nextStep}
            disabled={isSubmitting || (!selectedItems[currentCheck?.id || ""] || selectedItems[currentCheck?.id || ""].length === 0)}
            className={cn(
              "h-12 md:h-14 flex-1 rounded-xl font-bold text-base md:text-lg flex items-center justify-center gap-2 transition-all shadow-md",
              isSubmitting
                ? "bg-yellow-400/50 text-black/50"
                : (!selectedItems[currentCheck?.id || ""] || selectedItems[currentCheck?.id || ""].length === 0)
                  ? isLightMode
                    ? "bg-slate-100 border border-slate-200 text-slate-300 cursor-not-allowed"
                    : "bg-zinc-800 border border-white/10 text-white/30 cursor-not-allowed"
                  : "bg-yellow-400 text-black hover:bg-yellow-300 active:scale-95 hover:shadow-[0_0_20px_rgba(250,204,21,0.4)]"
            )}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                กำลังบันทึก...
              </span>
            ) : currentOrderIndex === checks.length - 1 ? (
              <>
                สรุปข้อมูล <ChevronRight className="w-6 h-6 md:w-7 md:h-7" />
              </>
            ) : (
              <>
                ถัดไป <ChevronRight className="w-6 h-6 md:w-7 md:h-7" />
              </>
            )}
          </button>
        </div>
      )}

      {/* Summary Detail Modal */}
      <AnimatePresence>
        {activeModalCheck && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveModalCheck(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={cn("relative w-full max-w-[400px] border rounded-2xl overflow-hidden flex flex-col max-h-[85vh] shadow-[0_30px_60px_rgba(0,0,0,0.8)]", isLightMode ? "bg-white border-slate-200" : "bg-zinc-900 border-white/10")}
            >
              <div className="p-6 md:p-8 flex flex-col h-full relative">

                <h3 className={cn("text-lg font-bold mb-6 pr-10 leading-tight", isLightMode ? "text-slate-800" : "text-yellow-400")}>
                  {(() => {
                    const checkIndex = checks.findIndex(c => c.id === activeModalCheck);
                    if (checkIndex === 0) return "ถ้า..ดูดพ็อตต่อ...\nตัวน้องเองจะได้สิ่งนี้";
                    if (checkIndex === 1) return "ถ้า..ดูดพ็อตต่อ...\nคนรอบตัวน้องจะได้สิ่งนี้";
                    if (checkIndex === 2) return "ถ้า...เลิกดูดพ็อต\nน้องจะได้สิ่งนี้";
                    return checks.find(c => c.id === activeModalCheck)?.message;
                  })()}
                </h3>

                <div className="flex-1 overflow-y-auto space-y-3 md:space-y-4 pr-1 md:pr-4 custom-scrollbar pb-4">
                  {(selectedItems[activeModalCheck] || []).map((id, idx) => (
                    <motion.div
                      key={id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={cn("p-4 md:p-5 rounded-xl border flex items-start gap-4 shadow-sm", isLightMode ? "bg-slate-50 border-slate-200" : "bg-zinc-800/80 border-white/5")}
                    >
                      <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-yellow-400 flex items-center justify-center shrink-0 mt-0.5 shadow-[0_0_10px_rgba(250,204,21,0.3)]">
                        <Check className="w-3 h-3 md:w-4 md:h-4 text-black stroke-3" />
                      </div>
                      <p className={cn("font-normal text-sm md:text-base leading-relaxed", isLightMode ? "text-slate-700" : "text-white")}>
                        {checkItems.find(i => i.id === id)?.message}
                      </p>
                    </motion.div>
                  ))}
                  {(selectedItems[activeModalCheck] || []).length === 0 && (
                    <p className="text-white/30 text-center py-10 text-base">ยังไม่ได้เลือกรายการในหัวข้อนี้</p>
                  )}
                </div>

                <div className="pt-4 border-t border-white/10 mt-auto">
                  <button
                    onClick={() => setActiveModalCheck(null)}
                    className="w-full py-4 rounded-xl bg-white text-black font-bold text-lg hover:bg-zinc-200 transition-colors shadow-lg active:scale-[0.98]"
                  >
                    เข้าใจแล้ว
                  </button>
                </div>

                <button
                  onClick={() => setActiveModalCheck(null)}
                  className={cn("absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-colors", isLightMode ? "bg-slate-100 text-slate-400 hover:text-slate-600" : "bg-white/10 text-white/60 hover:text-white hover:bg-white/20")}
                >
                  <X className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Not Ready / Support Modal */}
      <AnimatePresence>
        {showNotReadyModal && (
          <div className="fixed inset-0 z-200 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNotReadyModal(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={cn("relative w-full max-w-[340px] border rounded-3xl overflow-hidden flex flex-col p-6 md:p-8 gap-6 shadow-[0_30px_60px_rgba(0,0,0,0.8)]", isLightMode ? "bg-white border-slate-200" : "bg-zinc-900 border-white/10")}
            >
              <div className="flex items-end gap-3 mb-2">
                <div className="shrink-0 relative w-16 h-16 rounded-full overflow-hidden border-2 border-white/10 bg-zinc-800 shadow-xl">
                  <img
                    src="/model/model13.png"
                    alt="Assistant JingJai"
                    className="w-full h-full object-cover object-top scale-125"
                  />
                </div>
                <div className={cn("relative border p-3 md:p-4 rounded-xl rounded-bl-none shadow-xl", isLightMode ? "bg-white border-slate-200" : "bg-zinc-800 border-white/10")}>
                  <p className={cn("text-sm leading-relaxed font-normal", isLightMode ? "text-slate-700" : "text-white")}>
                    "ไม่เป็นไรเลยจ้ะ แค่วันนี้น้องมาสำรวจตัวเองกับพี่ น้องก็กล้าหาญมากๆแล้ว แต่ถ้าวันไหนเกิดเปลี่ยนใจ มาหาพี่ตรงนี้นะจ๊ะ พี่จะพาไปลุยเอง"
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-3 w-full">
                  <button
                    onClick={handleHesitantExit}
                    disabled={isSubmitting}
                    className="w-full h-14 bg-yellow-400 text-black font-bold text-lg rounded-xl hover:bg-yellow-300 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-yellow-400/20"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                      <>
                        ยืนยันการออก
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowNotReadyModal(false)}
                    disabled={isSubmitting}
                    className="w-full h-12 text-white/50 font-medium text-base hover:text-white transition-colors"
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
