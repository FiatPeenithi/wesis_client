import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { useAuthStore } from "../store/useAuthStore";
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Calendar as CalendarIcon,
  Loader2,
  X
} from "lucide-react";
import { cn } from "../lib/utils";

function TypewriterText({ text, delay = 50, onComplete }: { text: string; delay?: number; onComplete?: () => void }) {
  const [displayedText, setDisplayedText] = useState("");
  const [complete, setComplete] = useState(false);
  const onCompleteRef = React.useRef(onComplete);

  React.useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  React.useEffect(() => {
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
        onCompleteRef.current?.();
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

function CustomCalendar({ selectedDate, onSelect, isLightMode }: { selectedDate: string, onSelect: (date: string) => void, isLightMode: boolean }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const totalDays = daysInMonth(year, month);
  const startDay = firstDayOfMonth(year, month);

  const days = [];
  // Padding for empty days at the start
  for (let i = 0; i < startDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-9 md:h-12" />);
  }

  // Get today in Thai timezone (GMT+7)
  const todayThai = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
  todayThai.setHours(0, 0, 0, 0);
  const maxFutureDate = new Date(todayThai);
  maxFutureDate.setDate(todayThai.getDate() + 15);

  for (let d = 1; d <= totalDays; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const currentDayDate = new Date(year, month, d);
    currentDayDate.setHours(0, 0, 0, 0);

    const isPast = currentDayDate < todayThai;
    const isToday = currentDayDate.getTime() === todayThai.getTime();
    const isSelected = selectedDate === dateStr;
    const isFuture15Days = currentDayDate > maxFutureDate;

    days.push(
      <button
        key={d}
        type="button"
        disabled={isPast || isFuture15Days}
        onClick={() => onSelect(dateStr)}
        className={cn(
          "h-12 w-full rounded-xl font-normal text-lg transition-all flex items-center justify-center relative",
          isSelected
            ? "bg-yellow-400 text-black scale-110 z-10"
            : isPast || isFuture15Days
              ? (isLightMode ? "text-slate-400 opacity-50 cursor-not-allowed" : "text-white/20 opacity-50 cursor-not-allowed")
              : (isLightMode
                ? "hover:bg-yellow-400/10 text-slate-800 hover:text-yellow-600"
                : "hover:bg-yellow-400/10 text-white/70 hover:text-yellow-400")
        )}
      >
        {d}
        {isToday && !isSelected && (
          <div className="absolute bottom-2 w-1 h-1 bg-yellow-400 rounded-full" />
        )}
      </button>
    );
  }

  const monthNames = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];

  const years = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i);

  return (
    <div className={cn("border rounded-xl p-4 md:p-6", isLightMode ? "bg-white border-slate-200" : "bg-black border-white/5")}>
      <div className="flex items-center justify-between gap-2 mb-3 md:mb-6">
        <div className="flex items-center gap-1.5">
          <div className="relative">
            <select
              value={month}
              onChange={(e) => setCurrentMonth(new Date(year, parseInt(e.target.value)))}
              className={cn("font-normal text-lg py-2 pl-4 pr-10 rounded-xl outline-none border cursor-pointer appearance-none transition-all", isLightMode ? "bg-slate-50 border-slate-200 text-slate-800 focus:border-yellow-500" : "bg-black border-white/5 text-yellow-400 focus:border-yellow-400/50")}
            >
              {monthNames.map((name, i) => (
                <option key={i} value={i} className={isLightMode ? "bg-white text-slate-800" : "bg-black"}>{name}</option>
              ))}
            </select>
            <ChevronLeft className="w-3 h-3 md:w-4 md:h-4 absolute right-1.5 md:right-3 top-1/2 -translate-y-1/2 -rotate-90 pointer-events-none text-yellow-400" />
          </div>
          <div className="relative">
            <select
              value={year}
              onChange={(e) => setCurrentMonth(new Date(parseInt(e.target.value), month))}
              className={cn("font-normal text-lg py-2 pl-4 pr-10 rounded-xl outline-none border cursor-pointer appearance-none transition-all", isLightMode ? "bg-slate-50 border-slate-200 text-slate-800 focus:border-yellow-500" : "bg-black border-white/5 text-yellow-400 focus:border-yellow-400/50")}
            >
              {years.map(y => (
                <option key={y} value={y} className={isLightMode ? "bg-white text-slate-800" : "bg-black"}>{y + 543}</option>
              ))}
            </select>
            <ChevronLeft className="w-3 h-3 md:w-4 md:h-4 absolute right-1.5 md:right-3 top-1/2 -translate-y-1/2 -rotate-90 pointer-events-none text-yellow-400" />
          </div>
        </div>

        {/* Navigation arrows removed per request */}
      </div>

      <div className="grid grid-cols-7 gap-1 md:gap-2 mb-1 md:mb-4">
        {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map(d => (
          <div key={d} className={cn("h-10 flex items-center justify-center text-lg font-normal uppercase tracking-wide", isLightMode ? "text-slate-400" : "text-white/20")}>
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 md:gap-2">
        {days}
      </div>
    </div>
  );
}

export default function SisCraftPage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const currentStage = (user as any)?.currentStage || 1;
  const isLightMode = currentStage === 5;
  const [crafts, setCrafts] = useState<any[]>([]);
  const [craftItems, setCraftItems] = useState<any[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [quitDate, setQuitDate] = useState(() => {
    const today = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });
  const [promise, setPromise] = useState("");
  const [selectedItems, setSelectedItems] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [reactionMessage, setReactionMessage] = useState("");
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [modalData, setModalData] = useState<{ title: string, content: React.ReactNode } | null>(null);
  const [isMessageComplete, setIsMessageComplete] = useState(false);

  const [pods, setPods] = useState<string[]>([]);
  const isTrashStep = currentStepIndex === 2 + crafts.length && crafts.length > 0;
  const isSummaryStep = currentStepIndex === 3 + crafts.length && crafts.length > 0;

  const dragAreaRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reactionMessage) {
      const timer = setTimeout(() => setReactionMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [reactionMessage]);

  useEffect(() => {
    if (isTrashStep && pods.length === 0) {
      try {
        const audio = new Audio("/sound/stamp.mp3");
        audio.play().catch(e => console.log("Stamp sound blocked:", e));
      } catch (e) {
        console.error("Stamp sound error:", e);
      }
    }
  }, [isTrashStep, pods.length]);

  useEffect(() => {
    setIsMessageComplete(false);
  }, [currentStepIndex]);

  useEffect(() => {
    if (!user?.id) return;

    const loadData = async () => {
      try {
        const [cRes, logRes] = await Promise.all([
          api.get('/sis/craft'),
          api.get(`/sis/craft/logs/${user.id}`)
        ]);

        const fetchedCrafts = cRes.data.data;
        setCrafts(fetchedCrafts);

        const flatItems = fetchedCrafts.flatMap((c: any) => c.items);
        setCraftItems(flatItems);

        setPods(["/pod/1.png", "/pod/2.png", "/pod/3.png", "/pod/4.png", "/pod/5.png", "/pod/6.png"]);

        const logs = logRes.data.data;
        if (logs.length > 0) {
          const latestLog = logs[0];
          setPromise(latestLog.promise || "");

          if (latestLog.quit_date) {
            setQuitDate(new Date(latestLog.quit_date).toISOString().split('T')[0]);
          }

          const initialSelections: Record<string, string[]> = {};
          latestLog.sisCraftItemLogs.forEach((it: any) => {
            if (!initialSelections[it.sisCraftId]) initialSelections[it.sisCraftId] = [];
            initialSelections[it.sisCraftId].push(it.sisCraftItemId);
          });
          setSelectedItems(initialSelections);
        }
      } catch (err) {
        console.error("Failed to load SIS Craft data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [user?.id]);

  const handleSelect = (craftId: string, itemId: string) => {
    const reactions = ["เลือกอาวุธได้ยอดเยี่ยมมาก", "เลือกได้ดีมากจ๊ะ", "เริ่ดดดดดสุดดด"];

    setSelectedItems(prev => {
      const current = prev[craftId] || [];
      const itemExists = current.includes(itemId);

      if (itemExists) {
        return { ...prev, [craftId]: current.filter(id => id !== itemId) };
      }

      // Enforce limit of 3
      if (current.length >= 3) return prev;

      // Pick random reaction only if not already set
      if (!reactionMessage) {
        const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
        setReactionMessage(randomReaction);
      }

      return { ...prev, [craftId]: [...current, itemId] };
    });
  };

  const handleDropPod = (id: string) => {
    setPods(prev => prev.filter(p => p !== id));
  };

  const nextStep = () => {
    setReactionMessage("");
    setCurrentStepIndex(prev => prev + 1);
  };

  const prevStep = () => {
    setReactionMessage("");
    setCurrentStepIndex(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const itemIds = Object.values(selectedItems).flat();
      await api.post('/sis/craft/log', {
        userId: user.id,
        quit_date: new Date(quitDate),
        promise,
        itemIds
      });

      const currentStage = (user as any).currentStage || 1;
      if (currentStage < 4) {
        await api.patch(`/profiles/user/${user.id}`, { currentStage: 4 });
        setUser({ ...user, currentStage: 4 } as any);
      }

      navigate("/dashboard");
    } catch (error) {
      console.error("Error submitting SIS Craft:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-6 gap-4 min-h-screen", isLightMode ? "bg-[#f8fafc]" : "bg-black")}>
        <Loader2 className="w-10 h-10 text-yellow-400 animate-spin" />
        <p className={cn("font-normal uppercase tracking-widest text-sm", isLightMode ? "text-slate-400" : "text-white/40")}>กำลังเตรียมข้อมูล...</p>
      </div>
    );
  }

  const renderContent = () => {
    if (currentStepIndex === 0) {
      return (
        <motion.div
          key="date-step"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, x: -20 }}
          className="flex flex-col h-auto md:min-h-0 py-1 md:py-6"
        >
          {/* Compact Chat Bubble + Avatar */}
          <div className="flex items-start gap-2 md:gap-4 mb-2 md:mb-6">
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", damping: 15 }}
              className="shrink-0 relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-2 border-yellow-400 bg-zinc-800"
            >
              <img
                src="/model/model6.png"
                alt="Avatar"
                className="absolute inset-0 w-full h-full object-cover object-top scale-125 pointer-events-none"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: -10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className={cn("relative border p-4 md:p-5 rounded-xl rounded-tl-none flex-1", isLightMode ? "bg-white border-slate-200" : "bg-zinc-900 border-white/10")}
            >
              <div className={cn("text-sm leading-relaxed", isLightMode ? "text-slate-700" : "text-white")}>
                <TypewriterText
                  text="เริ่มต้นวางแผนทวงคืนชีวิตกันเลยจ้ะ เลือกวันดีๆ ที่น้องตั้งใจจะเลิกในปฏิทินด้านล่างได้เลยนะคะ"
                  delay={30}
                />
              </div>
            </motion.div>
          </div>

          {/* Calendar */}
          <div className="mb-3 md:mb-6">
            <CustomCalendar
              selectedDate={quitDate}
              onSelect={(date) => setQuitDate(date)}
              isLightMode={isLightMode}
            />
          </div>

          {/* Date Confirmation */}
          <div className="flex flex-col gap-3 mt-auto">
            <AnimatePresence>
              {quitDate && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-yellow-400/10 border border-yellow-400/20 rounded-xl p-3 md:p-4 text-center shadow-lg"
                >
                  <p className="text-yellow-400 text-base md:text-lg font-normal">
                    น้องเลือก วันที่ {new Date(quitDate + "T00:00:00").toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </motion.div>
      );
    }

    if (currentStepIndex === 1) {
      return (
        <motion.div
          key="promise-step"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="flex flex-col h-auto md:min-h-0 py-1 md:py-6"
        >
          {/* Compact Chat Bubble + Avatar */}
          <div className="flex items-start gap-2 md:gap-4 mb-4 md:mb-8">
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
              initial={{ opacity: 0, scale: 0.9, x: -10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className={cn("relative border p-4 md:p-5 rounded-xl rounded-tl-none", isLightMode ? "bg-white border-slate-200" : "bg-zinc-900 border-white/10")}
            >
              <div className={cn("text-sm", isLightMode ? "text-slate-700" : "text-white")}>
                <TypewriterText
                  text="เรามาทำ “บันทึกสัญญาแห่งความภูมิใจ” ยืนยันว่าเราพร้อมสำหรับชีวิตใหม่ที่เราเลือกเองกันนะจ๊ะ..."
                  delay={30}
                />
              </div>
            </motion.div>
          </div>

          {/* Contract / Textarea Section */}
          <div className="min-h-0 relative w-full flex-1 flex flex-col mt-2 md:mt-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="relative w-full h-[340px] md:h-[400px] bg-[#fdfaf6] rounded-sm p-6 overflow-hidden shrink-0"
              style={{
                boxShadow: "inset 0 0 40px rgba(0,0,0,0.03), 0 10px 30px -10px rgba(0,0,0,0.5)"
              }}
            >
              {/* Decorative corners */}
              <div className="absolute top-3 left-3 w-6 h-6 border-t border-l border-amber-900/30" />
              <div className="absolute top-3 right-3 w-6 h-6 border-t border-r border-amber-900/30" />
              <div className="absolute bottom-3 left-3 w-6 h-6 border-b border-l border-amber-900/30" />
              <div className="absolute bottom-3 right-3 w-6 h-6 border-b border-r border-amber-900/30" />

              {/* Title */}
              <div className="text-center mb-6">
                <h3 className="text-amber-950 font-bold text-lg border-b-2 border-amber-900/20 pb-2 inline-block px-4">
                  ฉันขอสัญญาว่า...
                </h3>
              </div>

              {/* Body */}
              <div className="flex-1 h-full relative z-10 block">
                <textarea
                  value={promise}
                  onChange={(e) => setPromise(e.target.value)}
                  placeholder="กรอกคำสัญญาที่นี่"
                  className="w-full h-[180px] md:h-[220px] bg-transparent border-none p-0 text-slate-950 text-lg outline-none resize-none placeholder:text-slate-900/30 font-normal"
                  style={{
                    backgroundImage: "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"100%\" height=\"32\"><line x1=\"0\" y1=\"32\" x2=\"100%\" y2=\"32\" stroke=\"rgba(120,53,15,0.15)\" stroke-width=\"1\" stroke-dasharray=\"4 4\"/></svg>')",
                    backgroundSize: "100% 32px",
                    lineHeight: "32px",
                  }}
                />
              </div>

              {/* Official Seal / Stamp */}
              <div className="absolute bottom-6 right-6 opacity-90 flex items-center justify-center pointer-events-none select-none">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-[3px] border-red-600/60 flex items-center justify-center p-1 relative rotate-15">
                  <div className="w-full h-full rounded-full border-2 border-red-600/40 flex items-center justify-center text-red-600/80 font-bold text-xs md:text-sm text-center tracking-tighter shadow-sm">
                    PROMISE<br />APPROVED
                  </div>
                  <div className="absolute -inset-1.5 border border-red-600/20 rounded-full border-dashed mix-blend-multiply"></div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      );
    }

    if (currentStepIndex >= 2 && currentStepIndex < 2 + crafts.length) {
      const craft = crafts[currentStepIndex - 2];
      const items = craftItems.filter(i => i.craftId === craft.id || i.sisCraftId === craft.id);

      return (
        <motion.div
          key={`craft-${craft.id}`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="flex flex-col h-auto md:min-h-[500px] py-1 md:py-6 relative"
        >
          {/* Intro text for the very first craft challenge */}
          {currentStepIndex === 2 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 md:mb-8 text-center px-2"
            >
              <p className="text-yellow-400 font-normal text-base md:text-lg leading-relaxed border-y border-yellow-400/20 py-3 bg-yellow-400/5 rounded-xl">
                “เรามีสัญญาแห่งความภูมิใจ เราเลือกวัน D-Day แล้ว!” <br />
                คราวนี้เรามาลอง <span className="underline decoration-yellow-500/50 underline-offset-4">“ซ้อมมือติดอาวุธประจำกาย”</span> ไว้สู้กับเจ้าพ็อตกัน <br />
                <span className="text-lg">ลุย!!!</span>
              </p>
            </motion.div>
          )}

          {/* Top Chat Bubble + Avatar model4 */}
          <div className="flex items-start gap-2 md:gap-4 mb-2 md:mb-4">
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              className="shrink-0 relative w-16 h-16 rounded-full border-2 border-yellow-400 overflow-hidden bg-zinc-800"
            >
              <img
                src="/model/model4.png"
                alt="Avatar"
                className="absolute inset-0 w-full h-full object-cover object-top scale-125 pointer-events-none"
              />
            </motion.div>

            <div>
              <div className="flex justify-between items-center px-1 mb-2">
                <span className="text-lg font-normal text-yellow-500">{craft.title}</span>
              </div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9, x: -10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                className={cn("relative border p-4 md:p-4 rounded-xl rounded-tl-none flex-1", isLightMode ? "bg-white border-slate-200" : "bg-zinc-900 border-white/10")}
              >
                <div className={cn("text-sm font-normal whitespace-pre-wrap", isLightMode ? "text-slate-700" : "text-white")}>
                  <TypewriterText text={craft.message} delay={30} onComplete={() => setIsMessageComplete(true)} />
                </div>
              </motion.div>
            </div>
          </div>


          {/* Selection Items Area */}
          <div className="pb-4 custom-scrollbar">
            <AnimatePresence>
              {isMessageComplete && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-1 gap-2"
                >
                  {items.map((item) => {
                    const checked = selectedItems[craft.id]?.includes(item.id);
                    const disabled = !checked && (selectedItems[craft.id]?.length || 0) >= 3;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => handleSelect(craft.id, item.id)}
                        className={cn(
                          "p-5 rounded-lg border-2 text-left transition-all flex items-center gap-3",
                          checked
                            ? (isLightMode ? "border-yellow-500 bg-yellow-50" : "border-yellow-400 bg-yellow-400/10")
                            : disabled
                              ? (isLightMode ? "border-slate-100 bg-slate-50 opacity-40" : "border-white/5 bg-black opacity-20")
                              : (isLightMode ? "border-slate-200 bg-white hover:border-yellow-500" : "border-white/20 bg-black hover:border-yellow-400/50")
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                          checked
                            ? (isLightMode ? "bg-yellow-500 text-white" : "bg-yellow-400 text-black")
                            : (isLightMode ? "bg-slate-100 text-slate-400" : "bg-white/5 text-white/40")
                        )}>
                          {checked && <Check className="w-5 h-5" />}
                        </div>
                        <span className={cn(
                          "font-normal text-sm leading-tight transition-colors",
                          isLightMode ? (checked ? "text-slate-900 font-bold" : "text-slate-600") : "text-white"
                        )}>{item.message}</span>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      );
    }

    if (isTrashStep) {
      const allPods = [
        "/pod/1.png", "/pod/2.png", "/pod/3.png",
        "/pod/4.png", "/pod/5.png", "/pod/6.png"
      ];

      return (
        <motion.div
          key="trash-step"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex flex-col py-1 relative h-[calc(100dvh-180px)] md:h-[75vh] w-full"
        >
          {/* Header */}
          <div className="flex items-start gap-4 mb-6 z-30 shrink-0">
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", damping: 15 }}
              className="shrink-0 relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-2 border-yellow-400 bg-zinc-800"
            >
              <img
                src="/model/model17.png"
                alt="Avatar"
                className="absolute inset-0 w-full h-full object-cover object-top scale-125 pointer-events-none"
              />
            </motion.div>
            <div className={cn("flex-1 border p-4 rounded-xl rounded-tl-none shadow-lg", isLightMode ? "bg-white border-slate-200" : "bg-zinc-900 border-white/10")}>
              <p className={cn("font-normal text-base md:text-lg leading-snug", isLightMode ? "text-slate-700" : "text-yellow-400")}>
                คราวนี้เรามาฝึกบอกลา เจ้าพวกนี้กัน!!<br />
                อะไรที่เกี่ยวกับพ็อด... <br />
                ลากทิ้งลงหลุมนี้ให้หมดไปเลย!!....<br />
                <span className={cn("mt-1 block", isLightMode ? "text-yellow-600" : "text-white")}>"น้องทำได้แน่นอน"</span>
              </p>
            </div>
          </div>

          {/* Game Area */}
          <div
            ref={dragAreaRef}
            className="flex-1 relative flex flex-col items-center justify-between border border-transparent"
          >
            {/* Draggable Pods Grid (Stable Positions) */}
            <div className="w-full grid grid-cols-3 gap-y-12 md:gap-y-16 place-items-center my-auto z-20 shrink-0">
              {allPods.map((podId, i) => {
                const podStyles = [
                  { scale: 1.5, rotate: -25, y: 0, x: 0 },
                  { scale: 1, rotate: 18, y: -10, x: 5 },
                  { scale: 2, rotate: -12, y: 0, x: 0 },
                  { scale: 1.5, rotate: 25, y: 10, x: -5 },
                  { scale: 1, rotate: -20, y: -5, x: 10 },
                  { scale: 1.5, rotate: 12, y: 10, x: 10 },
                ];
                const style = podStyles[i] || podStyles[0];

                return (
                  <div key={podId} className="relative w-full h-24 flex items-center justify-center">
                    <AnimatePresence mode="wait">
                      {pods.includes(podId) && (
                        <motion.div
                          drag
                          dragConstraints={dragAreaRef}
                          dragElastic={0.05}
                          onDragEnd={(_, info) => {
                            const rect = dragAreaRef.current?.getBoundingClientRect();
                            if (rect) {
                              const isDropped = info.point.y > rect.bottom - 150;
                              if (isDropped) {
                                const audio = new Audio("/sound/whoosh-effect.mp3");
                                audio.play().catch(e => console.error("Audio play failed:", e));
                                handleDropPod(podId);
                              }
                            }
                          }}
                          whileDrag={{
                            scale: 1.1,
                            zIndex: 100,
                            rotate: 0,
                            filter: "brightness(1.1)"
                          }}
                          whileHover={{ scale: 1.05 }}
                          initial={{ scale: 0, opacity: 0, rotate: style.rotate * 2 }}
                          animate={{
                            scale: style.scale,
                            opacity: 1,
                            rotate: style.rotate,
                            x: style.x,
                            y: style.y
                          }}
                          exit={{
                            scale: 0,
                            opacity: 0,
                            transition: { duration: 0.3 }
                          }}
                          className="cursor-grab active:cursor-grabbing p-1 touch-none select-none z-20"
                        >
                          <img
                            src={podId}
                            alt="pod"
                            draggable={false}
                            className="w-24 h-24 sm:w-28 sm:h-28 md:w-36 md:h-36 object-contain pointer-events-none drop-shadow-2xl"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* Empty State / Success */}
            <AnimatePresence>
              {pods.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={cn("absolute inset-x-0 top-0 bottom-24 h-full flex flex-col items-center justify-start z-50", isLightMode ? "bg-white" : "bg-black")}
                >
                  <motion.div
                    initial={{ scale: 4, opacity: 0, rotate: -15, filter: "blur(10px)" }}
                    animate={{ scale: 1, opacity: 1, rotate: 0, filter: "blur(0px)" }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 20,
                      mass: 1.2
                    }}
                    className="flex flex-col items-center gap-6 w-full max-w-sm px-4 mt-12"
                  >
                    <button
                      onClick={nextStep}
                      className="w-full py-5 bg-linear-to-r from-emerald-400 to-teal-500 text-white rounded-xl font-bold text-lg uppercase shadow-[0_0_40px_rgba(16,185,129,0.4)] hover:scale-105 transition-transform active:scale-95"
                    >
                      Clear !
                    </button>
                    <p className="text-emerald-400 font-normal text-lg uppercase tracking-[0.2em] drop-shadow-lg">อิสรภาพรออยู่!</p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* The Hole Visual (Always stuck to bottom) */}
            <div className="w-full mt-auto pb-4 flex flex-col items-center pointer-events-none z-10 shrink-0 relative">
              <motion.div
                animate={{
                  scale: pods.length > 0 ? [1, 1.05, 1] : 1.2,
                  boxShadow: pods.length > 0
                    ? ["0 0 20px rgba(16,185,129,0.2)", "0 0 50px rgba(16,185,129,0.4)"]
                    : "0 0 80px rgba(16,185,129,0.6)",
                  borderColor: pods.length > 0 ? "rgba(16,185,129,0.2)" : "rgba(16,185,129,1)"
                }}
                transition={{ repeat: Infinity, duration: 1.5, repeatType: "mirror" }}
                className="w-4/5 md:w-2/3 h-20 bg-black border-4 border-emerald-500/40 rounded-[100%] flex items-center justify-center overflow-hidden"
              >
                {/* Visual Depth Effect */}
                <div className="absolute inset-x-0 top-0 h-full bg-linear-to-b from-emerald-500/30 to-black rounded-[100%] blur-xl" />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                  className="w-full h-full bg-[radial-gradient(circle,rgba(16,185,129,0.1)_0%,transparent_70%)]"
                />
              </motion.div>

              {pods.length > 0 && (
                <div className="absolute bottom-12 flex flex-col items-center opacity-80 pointer-events-none">
                  <span className="text-emerald-400 text-xs md:text-base font-normal uppercase tracking-[0.2em] drop-shadow-lg">ลากลงหลุมนี้</span>
                  <div className="animate-bounce mt-1 text-emerald-400">
                    <ChevronRight className="rotate-90 w-4 h-4 md:w-6 md:h-6" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      );
    }

    if (isSummaryStep) {
      return (
        <motion.div
          key="summary-step"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col gap-3 relative"
        >
          {/* Row 1: Avatar + Chat Bubble */}
          <div className="flex items-center gap-3">
            <div className="flex items-bottom shrink-0 relative w-1/3 overflow-visible">
              <img
                src="/model/model6.png"
                alt="พี่จริงใจ"
                className="inset-0 w-full object-cover object-top"
              />
            </div>
            <div className={cn("relative border p-4 rounded-xl rounded-tl-none flex-1", isLightMode ? "bg-white border-slate-200" : "bg-zinc-900 border-white/10")}>
              <p className={cn("text-base leading-snug font-normal", isLightMode ? "text-slate-700" : "text-white")}>
                พี่ภูมิใจในตัวน้องมาก กับความตั้งใจจริงในครั้งนี้ และนี่คือสิ่งที่มาจากความตั้งใจของน้องจ้ะ
              </p>
            </div>
          </div>

          {/* Row 2: D-Day & Promise 2-Column Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className={cn("border p-4 rounded-xl", isLightMode ? "bg-white border-slate-200" : "bg-yellow-500/10 border-yellow-500/10")}>
              <div className="flex items-center gap-2 mb-2">
                <CalendarIcon className="w-3.5 h-3.5 text-yellow-500" />
                <span className={cn("text-base font-bold uppercase tracking-tighter", isLightMode ? "text-slate-700" : "text-white")}>วัน D-DAY</span>
              </div>
              <p className={cn("text-lg font-semibold truncate", isLightMode ? "text-slate-700" : "text-white")}>
                {quitDate ? new Date(quitDate).toLocaleDateString('th-TH', {
                  day: 'numeric',
                  month: 'short',
                  year: '2-digit'
                }).replace(' 25', ' ') : "-"}
              </p>
            </div>
            <div
              onClick={() => setModalData({
                title: "ฉันสัญญาว่า...",
                content: <p className={cn("text-lg leading-relaxed text-center font-normal", isLightMode ? "text-slate-700" : "text-white")}>"{promise || "-"}"</p>
              })}
              className={cn("border p-4 rounded-xl cursor-pointer transition-colors group relative flex flex-col justify-between", isLightMode ? "bg-white border-slate-200 hover:bg-slate-50" : "bg-yellow-500/10 border-yellow-500/10")}
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn("text-base font-bold uppercase tracking-tighter", isLightMode ? "text-slate-700" : "text-white")}>คำสัญญา</span>
                </div>
                <p className={cn("text-lg font-normal line-clamp-1 leading-tight", isLightMode ? "text-slate-700" : "text-white")}>
                  "{promise || "-"}"
                </p>
              </div>
              <div className="text-xs text-yellow-500 font-normal uppercase mt-auto self-end opacity-0 group-hover:opacity-100 transition-opacity">Click to view</div>
            </div>
          </div>

          {/* Row 3: SOS-KITS Carousel */}
          <div className="flex-1 min-h-0 flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-yellow-400 rounded-full" />
                <span className="text-lg font-normal text-yellow-400 uppercase tracking-wide">อาวุธลับ ”SOS-KITS” ของน้อง</span>
              </div>
              <div className="flex gap-1.5">
                {crafts.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCarouselIndex(i)}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      i === carouselIndex ? "bg-yellow-400 w-6" : "bg-white/20 hover:bg-white/40 w-1.5"
                    )}
                  />
                ))}
              </div>
            </div>

            <div className={cn("relative flex-1 overflow-hidden rounded-2xl border touch-none min-h-[190px]", isLightMode ? "bg-white border-slate-200 shadow-sm" : "bg-yellow-500/5 border-yellow-500/10")}>
              <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={1}
                onDragEnd={(_, info) => {
                  const swipe = info.offset.x;
                  const velocity = info.velocity.x;
                  
                  if (swipe < -50 || velocity < -500) {
                    if (carouselIndex < crafts.length - 1) setCarouselIndex(prev => prev + 1);
                  } else if (swipe > 50 || velocity > 500) {
                    if (carouselIndex > 0) setCarouselIndex(prev => prev - 1);
                  }
                }}
                animate={{ x: `-${carouselIndex * 100}%` }}
                transition={{ type: "spring", stiffness: 300, damping: 35 }}
                className="flex h-full cursor-grab active:cursor-grabbing"
              >
                {crafts.map((craft) => {
                  const items = selectedItems[craft.id]?.map(itemId => craftItems.find(it => it.id === itemId)).filter(Boolean);
                  return (
                    <div
                      key={craft.id}
                      onClick={() => {
                        setModalData({
                          title: craft.title,
                          content: (
                            <div className="flex flex-col gap-4">
                              <p className={cn("text-lg font-normal leading-relaxed", isLightMode ? "text-slate-600" : "text-white/70")}>{craft.message}</p>
                              <div className="flex flex-wrap gap-2">
                                {items?.map((item: any) => (
                                  <span key={item.id} className="px-4 py-2 bg-yellow-400/10 text-yellow-400 text-lg font-semibold rounded-xl border border-yellow-400/20">
                                    {item.message}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )
                        });
                      }}
                      className="w-full shrink-0 h-full p-5 flex flex-col cursor-pointer group/modal relative"
                    >
                      <div className="flex justify-between items-start mb-2 group-hover/modal:translate-x-1 transition-transform">
                        <span className={cn("text-sm font-normal uppercase tracking-widest", isLightMode ? "text-slate-500" : "text-yellow-500/60")}>
                          {craft.title}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-yellow-500 font-normal uppercase opacity-40 group-hover/modal:opacity-100 transition-opacity">
                          <span>คลิกเพื่อดูรายละเอียด</span>
                          <ChevronRight className="w-2.5 h-2.5" />
                        </div>
                      </div>
                      <p className={cn("text-lg font-bold mb-4 leading-snug group-hover/modal:text-yellow-600 transition-colors", isLightMode ? "text-slate-800" : "text-white")}>
                        {craft.message}
                      </p>
                      <div className="flex flex-wrap gap-2 overflow-y-auto pr-1 flex-1 content-start">
                        {selectedItems[craft.id]?.map(itemId => {
                          const item = craftItems.find(it => it.id === itemId);
                          return (
                            <span key={itemId} className={cn("px-3 py-1.5 text-sm rounded-xl border transition-all duration-200", 
                              isLightMode 
                                ? "bg-yellow-50 text-yellow-700 border-yellow-200 group-hover/modal:border-yellow-400 shadow-xs" 
                                : "bg-yellow-400/5 text-yellow-400/90 border-yellow-400/10 group-hover/modal:border-yellow-400/30"
                            )}>
                              {item?.message}
                            </span>
                          );
                        }) || (
                          <div className={cn("flex flex-col items-center justify-center w-full py-2 opacity-20", isLightMode ? "text-slate-400" : "text-white")}>
                            <span className="text-sm italic font-normal">ยังไม่ได้เลือกอาวุธในส่วนนี้</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </motion.div>

              {/* Carousel Controls Overlay (Desktop hint) */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCarouselIndex(p => Math.max(0, p - 1));
                }}
                className="absolute hidden md:flex left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md items-center justify-center text-white opacity-0 hover:opacity-100 disabled:opacity-0 transition-opacity z-10 border border-white/10"
                disabled={carouselIndex === 0}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCarouselIndex(p => Math.min(crafts.length - 1, p + 1));
                }}
                className="absolute hidden md:flex right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md items-center justify-center text-white opacity-0 hover:opacity-100 disabled:opacity-0 transition-opacity z-10 border border-white/10"
                disabled={carouselIndex === crafts.length - 1}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Row 4: Closing Narrative */}
          <div className={cn("border p-4 rounded-xl shadow-inner mb-4", isLightMode ? "bg-emerald-50 border-emerald-100" : "bg-emerald-500/5 border-emerald-500/20")}>
            <p className={cn("text-sm leading-tight font-normal", isLightMode ? "text-slate-700" : "text-white")}>
              ตอนนี้น้องสาวพี่พร้อมก้าวเข้าสู่ <span className="text-yellow-600 underline decoration-yellow-400/20 underline-offset-4 font-normal">"วันแห่งอิสรภาพ"</span> แล้วนะคะ..<br />
              <span className={cn("font-normal", isLightMode ? "text-slate-500" : "opacity-70")}>มากดปุ่มเริ่มนับถอยหลังสู่ชีวิตใหม่ที่น้องออกแบบเองได้เลยจ้ะ!</span>
            </p>
          </div>
        </motion.div>
      );
    }
  };

  const isNextDisabled = () => {
    if (currentStepIndex === 0) return !quitDate;
    if (currentStepIndex === 1) return !promise || promise.length < 5;
    if (currentStepIndex >= 2 && currentStepIndex < 2 + crafts.length) {
      const craft = crafts[currentStepIndex - 2];
      return !selectedItems[craft.id] || selectedItems[craft.id].length === 0;
    }
    if (isTrashStep) return pods.length > 0;
    return false;
  };

  return (
    <div className={cn(
      "flex flex-col relative max-w-lg mx-auto animate-in fade-in duration-500",
      isLightMode ? "bg-[#f8fafc]" : "bg-black"
    )}>
      {!isTrashStep && (
        <div className={cn("flex items-center gap-4 mb-4 border-b relative z-10 w-full pb-4", isLightMode ? "border-slate-200" : "border-white/5")}>
          {currentStepIndex > 0 ? (
            <button
              onClick={prevStep}
              disabled={isSubmitting}
              aria-label="ย้อนกลับ"
              className={cn("w-14 h-14 rounded-xl border flex items-center justify-center transition-all shrink-0", isLightMode ? "bg-white border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600" : "bg-white/5 border-yellow/10 text-white/40 hover:bg-white/10 hover:text-white")}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          ) : (
            <div className="w-14 shrink-0" />
          )}

          {!isSummaryStep ? (
            <button
              onClick={nextStep}
              disabled={isNextDisabled()}
              className="flex-1 h-14 bg-yellow-400 text-black font-medium text-lg rounded-xl hover:bg-yellow-300 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-20"
            >
              ถัดไป
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 h-14 bg-yellow-400 text-black font-normal text-lg rounded-xl hover:bg-yellow-300 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
              {isSubmitting ? "กำลังบันทึก..." : "เริ่มนับถอยหลัง"}
            </button>
          )}
        </div>
      )}

      <div>
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
      </div>

      {/* Floating Reaction Toast */}
      <AnimatePresence>
        {reactionMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-100 flex items-center gap-4 bg-yellow-400 p-6 md:p-8 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] w-[92vw] pointer-events-auto"
          >
            <div className="shrink-0 relative w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-black/10 overflow-visible bg-zinc-800 shadow-inner">
              <img
                src="/model/model13.png"
                alt="Reaction Avatar"
                className="absolute inset-0 w-full h-[125%] object-cover object-top scale-125 top-[-10px]"
              />
            </div>
            <div className="text-black text-lg leading-tight font-bold flex-1">
              {reactionMessage}
            </div>
            <button
              onClick={() => setReactionMessage("")}
              className="absolute top-3 right-3 p-2 text-black/40 hover:text-black hover:bg-black/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click-to-Expand Modal */}
      <AnimatePresence>
        {modalData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-150 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalData(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={cn("relative w-full max-w-lg border p-6 rounded-3xl shadow-2xl overflow-hidden", isLightMode ? "bg-white border-slate-200" : "bg-zinc-900 border-white/10")}
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-yellow-400 rounded-full" />
                  <h3 className={cn("text-lg font-bold uppercase tracking-widest", isLightMode ? "text-slate-800" : "text-white")}>{modalData.title}</h3>
                </div>
                <button
                  onClick={() => setModalData(null)}
                  className={cn("w-10 h-10 rounded-xl border flex items-center justify-center transition-colors", isLightMode ? "bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600" : "bg-white/5 border-white/10 text-white/40 hover:text-white")}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                {modalData.content}
              </div>

              <div className="mt-8 pt-6 border-t border-white/5">
                <button
                  onClick={() => setModalData(null)}
                  className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl text-white font-normal hover:bg-white/10 transition-all active:scale-95"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
