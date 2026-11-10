import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { useAuthStore } from "../store/useAuthStore";
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Sparkles,
  Brain,
  Heart,
  Smile,
  ShieldCheck,
  Zap,
  Loader2,
  X,
  Star,
  Trophy,
  Target,
  Flame,
  Sun,
  Moon,
  Rocket,
  Lightbulb
} from "lucide-react";
import { cn } from "../lib/utils";
import { trackStageButtonClick } from "../lib/stageButtonTracking";

const ICON_MAP: Record<string, any> = {
  ShieldCheck, Zap, Heart, Brain, Smile, Star, Trophy, Target, Flame, Sun, Moon, Rocket, Lightbulb
};

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

export default function SisClearPage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const currentStage = (user as any)?.currentStage || 1;
  const isLightMode = currentStage === 5;

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedVersion, setSelectedVersion] = useState("");
  const [showNotReadyModal, setShowNotReadyModal] = useState(false);
  const [customVersion, setCustomVersion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [versions, setVersions] = useState<any[]>([]);
  const [questionText, setQuestionText] = useState("ถ้าน้องมีโอกาสเลือกตัวตนของตัวเองใหม่ น้องอยากเห็นตัวเองในเวอร์ชันไหนมากที่สุด?");

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // 1. Fetch Dynamic Choices
        const qRes = await api.get('/sis/clear/config');
        if (qRes.data.data) {
          const config = qRes.data.data;
          setQuestionText(config.question);
          const buttons = Array.isArray(config.choices) ? config.choices.map((b: any, i: number) => ({
            id: b.id || `v${i}`,
            text: b.label,
            icon: ICON_MAP[b.icon] || Smile,
            color: b.color || '#eab308'
          })) : [];
          setVersions(buttons);

          // 2. Load Existing User Log
          if (user?.id) {
            const res = await api.get(`/sis/clear/logs/${user.id}`);
            const logs = res.data.data;
            if (logs && logs.length > 0) {
              const log = logs[0];
              const foundVersion = buttons.find((v: any) => v.text === log.message);
              if (foundVersion) {
                setSelectedVersion(log.message);
              } else {
                setSelectedVersion("other");
                setCustomVersion(log.message);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error loading SIS Clear data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user?.id]);

  useEffect(() => {
    let timer: any;
    if (showNotReadyModal) {
      timer = setTimeout(() => {
        handleHesitantExit();
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [showNotReadyModal]);

  const nextStep = () => setCurrentStep(prev => prev + 1);
  const prevStep = () => setCurrentStep(prev => prev - 1);

  const saveLogAndStage = async () => {
    if (!user) return;
    setIsSubmitting(true);
    const finalMessage = selectedVersion === "other" ? customVersion : selectedVersion;

    try {
      if (finalMessage) {
        await api.post('/sis/clear/log', {
          userId: user.id,
          message: finalMessage
        });
      }

      const currentStage = (user as any).currentStage || 1;
      if (currentStage < 3) {
        await api.patch(`/profiles/user/${user.id}`, { currentStage: 3 });
        setUser({ ...user, currentStage: 3 } as any);
      }
    } catch (error) {
      console.error("Error saving clear log:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleHesitantExit = async () => {
    navigate("/library");
  };

  const handleFinish = async (path: string = "/sis-craft") => {
    await saveLogAndStage();
    navigate(path);
  };


  if (isLoading) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-6 gap-4", isLightMode ? "bg-[#f8fafc]" : "bg-black")}>
        <Loader2 className="w-10 h-10 text-yellow-400 animate-spin" />
        <p className={cn("font-normal uppercase tracking-widest text-sm", isLightMode ? "text-slate-400" : "text-white/40")}>กำลังเตรียมข้อมูล...</p>
      </div>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            key="step1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col space-y-6 md:space-y-6 pb-6"
          >
            {/* Chat 1: model6 (Left) */}
            <div className="flex items-start gap-3 md:gap-4 mt-6">
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
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "border rounded-xl rounded-tl-none p-4 md:p-6 max-w-[85%]",
                  isLightMode ? "bg-blue-50 border-blue-100" : "bg-blue-500/20 border-blue-500/20"
                )}
              >
                <p className={cn("text-base md:text-lg font-normal leading-relaxed", isLightMode ? "text-blue-900" : "text-blue-100")}>
                  น้องเก่งมากที่ก้าวข้ามจุดวัดใจมาได้ .... <br />
                  พี่รู้ว่าตอนนี้ใจน้องอาจจะยังกังวล ลังเลอยู่ใจว่า <br />
                  <span className="text-pink-400">'ถ้าไม่มีเขา (พอต) แล้วเราจะรับมือชีวิตยังไง'</span> ใช่ไหมจ๊ะ
                </p>
              </motion.div>
            </div>

            {/* Chat 2: model4 (Right) */}
            <div className="flex items-start gap-3 md:gap-4 flex-row-reverse">
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
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.0 }}
                className={cn(
                  "border rounded-xl rounded-tr-none p-4 md:p-6 max-w-[85%] text-right",
                  isLightMode ? "bg-purple-50 border-purple-100" : "bg-purple-500/20 border-purple-500/20"
                )}
              >
                <p className={cn("text-base md:text-lg font-normal leading-relaxed", isLightMode ? "text-purple-900" : "text-purple-100")}>
                  ความลังเลไม่ใช่เรื่องผิด แต่มันคือสัญญาณว่าน้อง <br />
                  <span className="text-blue-400">'รักตัวเอง'</span> และอยากมีชีวิตที่ดีขึ้น
                </p>
              </motion.div>
            </div>

            {/* Plain Text Section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.0 }}
              className="text-center py-4 space-y-2 mt-4"
            >
              <p className={cn("text-lg font-bold", isLightMode ? "text-slate-800" : "text-white")}>
                เพื่อให้น้องหายลังเล....
              </p>
              <p className={cn("text-lg font-normal", isLightMode ? "text-slate-500" : "text-zinc-400")}>
                งั้นเรามาลองใช้ <span className="text-yellow-500 font-normal underline underline-offset-4 decoration-yellow-500/30">“Filter-scan”</span> เคลียร์ใจให้ใสปิ๊ง <br />
                ไปพร้อมกันนะจ๊ะ...คลิกได้เลยจ้า
              </p>
            </motion.div>

            {/* Bottom Action: model14 | Filter Button */}
            <div className="flex items-center justify-between gap-4 mt-auto">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 3.0 }}
                className="relative w-40 h-56 md:w-64 md:h-80 grow-0"
              >
                <img
                  src="/model/model14.png"
                  alt="Character Start"
                  className="w-full h-[125%] object-contain scale-125 bottom-0"
                />
              </motion.div>

              <motion.button
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                transition={{ delay: 4.0, type: "spring", damping: 12 }}
                onClick={nextStep}
                className={cn(
                  "w-32 h-32 md:w-48 md:h-48 rounded-xl bg-linear-to-br from-yellow-300 to-yellow-500 border-4 flex items-center justify-center flex-col gap-1 p-4 text-center cursor-pointer group z-10",
                  isLightMode ? "border-slate-200 shadow-xl shadow-yellow-500/20" : "border-white shadow-[0_0_40px_rgba(250,204,21,0.5)]"
                )}
              >
                <Sparkles className="w-8 h-8 md:w-12 md:h-12 text-black/40 group-hover:text-black transition-colors" />
                <span className="text-black font-bold text-sm md:text-lg uppercase tracking-tighter line-clamp-2">
                  Filter-scan
                </span>
                <ChevronRight className="w-5 h-5 md:w-8 md:h-8 text-black/30 group-hover:text-black transition-transform group-hover:translate-x-1" />
              </motion.button>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col space-y-2 relative mt-6"
          >
            <h2 className={cn("text-base font-bold text-center mb-2", isLightMode ? "text-slate-800" : "text-white")}>
              Friends-scan
            </h2>

            <div className="flex items-end gap-3 md:gap-4 relative z-10 w-full">
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 15 }}
                className="shrink-0 relative w-16 h-16 md:w-24 md:h-24 rounded-full overflow-hidden border-2 border-yellow-400 bg-zinc-800"
              >
                <img
                  src="/model/model6.png"
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
                    text="นี่คือ สิ่งที่เพื่อนๆรอบข้างอยากจะบอกน้องจ๊ะ"
                    delay={40}
                  />
                </div>
              </motion.div>
            </div>

            <div className="relative p-4 md:p-6 rounded-xl bg-blue-400/10 border border-blue-400/20 overflow-hidden flex flex-col space-y-2 shadow-inner">
              <div className="absolute inset-0 bg-radial-gradient from-blue-400/5 to-transparent opacity-50" />

              <motion.div
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 200, damping: 20 }}
                className={cn(
                  "self-start max-w-[85%] p-2 rounded-2xl rounded-tl-none border relative z-10 shadow-md",
                  isLightMode ? "bg-white border-slate-200 text-slate-800" : "bg-white/10 border-white/10 text-white"
                )}
              >
                <p className="text-xs font-normal leading-relaxed">
                  <span className="font-bold text-sm text-yellow-500">เพื่อนๆ</span> บอกว่า น้องในเวอร์ชันที่ไม่สูบ จะน่าเชื่อถือในสายตาเพื่อนๆ มากขึ้นอีกเยอะเลยนะจ๊ะ
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ delay: 1.5, type: "spring", stiffness: 200, damping: 20 }}
                className={cn(
                  "self-end max-w-[85%] p-2 rounded-2xl rounded-tr-none border text-right relative z-10 shadow-md",
                  isLightMode ? "bg-blue-400 text-white border-blue-600" : "bg-blue-500/30 text-white border-blue-500/30"
                )}
              >
                <p className="text-xs font-normal leading-relaxed text-start">
                  ถึงจะเจอเพื่อนบางคนชวนสูบ... แต่หันมาทางนี้สิจ๊ะ มี <span className="font-bold text-sm text-yellow-500">เพื่อนๆ</span> อีกหลายคนที่คอยคุยถึงเรื่องดีๆ ตอนน้องเลิกได้ และพร้อมจะอยู่ข้างน้องเสมอนะจ๊ะ
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ delay: 2.5, type: "spring", stiffness: 200, damping: 20 }}
                className={cn(
                  "self-start max-w-[85%] p-2 rounded-2xl rounded-tl-none border relative z-10 shadow-md",
                  isLightMode ? "bg-white border-slate-200 text-slate-800" : "bg-white/10 border-white/10 text-white"
                )}
              >
                <p className="text-xs font-normal leading-relaxed">
                  ลองนึกภาพวันที่น้องทำสำเร็จสิจ๊ะ... <span className="font-bold text-sm text-yellow-500">เพื่อนๆ</span> ต้องทึ่งและภูมิใจในตัวน้องมากแน่ๆ
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ delay: 3.5, type: "spring", stiffness: 200, damping: 20 }}
                className={cn(
                  "self-end max-w-[85%] p-2 rounded-2xl rounded-tr-none border text-right relative z-10 shadow-md",
                  isLightMode ? "bg-blue-400 text-white border-blue-600" : "bg-blue-500/30 text-white border-blue-500/30"
                )}
              >
                <p className="text-xs font-normal leading-relaxed">
                  <span className="font-bold text-sm text-yellow-500">เพื่อนๆ</span> อยากให้น้องสุขภาพดี
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ delay: 4.5, type: "spring", stiffness: 200, damping: 20 }}
                className={cn(
                  "self-start max-w-[85%] p-2 rounded-2xl rounded-tl-none border relative z-10 shadow-md",
                  isLightMode ? "bg-white border-slate-200 text-slate-800" : "bg-white/10 border-white/10 text-white"
                )}
              >
                <p className="text-xs font-normal leading-relaxed">
                  <span className="font-bold text-sm text-yellow-500">เพื่อนๆ</span> ก็อยากได้รับอากาศที่บริสุทธิ์เวลาอยู่ใกล้น้องด้วยนะจ๊ะ
                </p>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 5.5 }}
              className="text-center px-4 mt-6"
            >
              <p className="text-blue-400 text-sm font-normal leading-tight">
                น้องไม่ได้สู้คนเดียวนะ แรงใจของเพื่อนๆ <br />
                คือพลังวิเศษที่สุดยอดเลย ไม่ต้องกังวลเรื่อง <br />
                เพื่อนน้าาา
              </p>
            </motion.div>

            <div className="flex items-end justify-between mt-auto pt-6 gap-2">
              <div className="flex flex-col items-center">
                <div className="flex flex-col items-center mb-2 animate-bounce">
                  <span className="text-black font-bold text-base uppercase tracking-widest bg-yellow-400 px-3 py-0.5 rounded-xl">click</span>
                  <ChevronRight className="rotate-90 w-5 h-5 text-yellow-500" />
                  <ChevronRight className="rotate-90 w-5 h-5 text-yellow-500 -mt-3" />
                </div>
                <button
                  onClick={nextStep}
                  className="w-32 h-14 bg-yellow-400 text-black border-2 border-black rounded-xl transition-all flex items-center justify-center hover:bg-yellow-300"
                >
                  <span className="text-black font-bold text-lg ">clear!</span>
                </button>
              </div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="relative w-48 h-32 grow-0"
              >
                <img
                  src="/model/model8.png"
                  alt="Character Guide"
                  className="inset-0 w-full h-[150%] object-contain scale-125 origin-bottom relative]"
                />
              </motion.div>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col relative mt-6"
          >
            <div className="flex items-center gap-3 md:gap-4 mb-6">
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 15 }}
                className="shrink-0 relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-2 border-yellow-400 bg-zinc-800"
              >
                <img
                  src="/model/model15.png"
                  alt="Avatar"
                  className="absolute inset-0 w-full h-full object-cover object-left scale-125 pointer-events-none"
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn("border rounded-xl rounded-tl-none p-3 max-w-[85%]", isLightMode ? "bg-yellow-50 border-yellow-100" : "bg-yellow-500/20 border-yellow-500/20")}
              >
                <p className={cn("text-base font-normal leading-relaxed", isLightMode ? "text-yellow-700" : "text-yellow-100")}>
                  เรามาเคลียร์สิ่งที่น้องกังวลกัน......
                </p>
              </motion.div>
            </div>

            <div className="space-y-2 mb-4 w-full">
              {/* Item 1 */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className={cn("p-4 border rounded-xl backdrop-blur-md flex flex-col gap-3 shadow-lg", isLightMode ? "bg-white border-slate-200" : "bg-zinc-900/40 border-white/5")}
              >
                <div className="flex items-center flex-wrap gap-x-2 gap-y-1">
                  <h4 className="font-bold text-yellow-400 text-sm md:text-base uppercase tracking-widest">อยากสูบมากๆ</h4>
                  <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 1.0, type: "spring", stiffness: 200 }}
                    className="flex items-center justify-center bg-red-500/20 text-red-400 w-5 h-5 md:w-6 md:h-6 rounded-full border border-red-500/30 shadow-sm"
                  >
                    <X className="w-3.5 h-3.5 stroke-[3]" />
                  </motion.div>
                  <h4 className="font-bold text-yellow-400 text-sm md:text-base uppercase tracking-widest">ต้องสูบ</h4>
                </div>
                <div className="flex items-start gap-2.5 border-l-2 border-green-500/30 pl-3">
                  <motion.div
                    initial={{ scale: 0, rotate: 20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 1.2, type: "spring", stiffness: 200 }}
                    className="shrink-0 mt-0.5"
                  >
                    <Check className="w-4 h-4 md:w-5 md:h-5 text-green-400 stroke-[3]" />
                  </motion.div>
                  <p className={cn("font-normal text-sm md:text-base leading-relaxed", isLightMode ? "text-slate-600" : "text-white/80")}>
                    "ความจริงคือ... อาการอยากบุหรี่ จะเกิดขึ้นเพียง 3-5 นาที เท่านั้น แล้วจะค่อยๆ บรรเทาลง....ความอยากมันอยู่ไม่นานเดี๋ยวมันจะผ่านไป"
                  </p>
                </div>
              </motion.div>

              {/* Item 2 */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.0 }}
                className={cn("p-4 border rounded-xl backdrop-blur-md flex flex-col gap-3 shadow-lg", isLightMode ? "bg-white border-slate-200" : "bg-zinc-900/40 border-white/5")}
              >
                <div className="flex items-center flex-wrap gap-x-2 gap-y-1">
                  <h4 className="font-bold text-yellow-400 text-sm md:text-base uppercase tracking-widest">หงุดหงิด</h4>
                  <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 2.5, type: "spring", stiffness: 200 }}
                    className="flex items-center justify-center bg-red-500/20 text-red-400 w-5 h-5 md:w-6 md:h-6 rounded-full border border-red-500/30 shadow-sm"
                  >
                    <X className="w-3.5 h-3.5 stroke-[3]" />
                  </motion.div>
                  <h4 className="font-bold text-yellow-400 text-sm md:text-base uppercase tracking-widest">ต้องสูบ</h4>
                </div>
                <div className="flex items-start gap-2.5 border-l-2 border-green-500/30 pl-3">
                  <motion.div
                    initial={{ scale: 0, rotate: 20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 2.7, type: "spring", stiffness: 200 }}
                    className="shrink-0 mt-0.5"
                  >
                    <Check className="w-4 h-4 md:w-5 md:h-5 text-green-400 stroke-[3]" />
                  </motion.div>
                  <p className={cn("font-normal text-sm md:text-base leading-relaxed", isLightMode ? "text-slate-600" : "text-white/80")}>
                    "ความจริงคือความหงุดหงิดอยู่กับเราแค่ประมาณ 15นาทีเท่านั้น เดี๋ยวมันจะหายไป..น้องลองสูดหายใจลึกๆ ยาวๆ, เคี้ยวหมากฝรั่งหรืออมลูกอมรสเปรี้ยวๆ เย็นๆ หรือ ดมยาดมให้สดชื่น มันช่วยได้มากๆเลยจ๊ะ"
                  </p>
                </div>
              </motion.div>

              {/* Item 3 */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 3.5 }}
                className={cn("p-4 border rounded-xl backdrop-blur-md flex flex-col gap-3 shadow-lg", isLightMode ? "bg-white border-slate-200" : "bg-zinc-900/40 border-white/5")}
              >
                <div className="flex items-center flex-wrap gap-x-2 gap-y-1">
                  <h4 className="font-bold text-yellow-400 text-sm md:text-base uppercase tracking-widest">เหล้าเข้าปาก</h4>
                  <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 4.0, type: "spring", stiffness: 200 }}
                    className="flex items-center justify-center bg-red-500/20 text-red-400 w-5 h-5 md:w-6 md:h-6 rounded-full border border-red-500/30 shadow-sm"
                  >
                    <X className="w-3.5 h-3.5 stroke-[3]" />
                  </motion.div>
                  <h4 className="font-bold text-yellow-400 text-sm md:text-base uppercase tracking-widest">ต้องสูบ</h4>
                </div>
                <div className="flex items-start gap-2.5 border-l-2 border-green-500/30 pl-3">
                  <motion.div
                    initial={{ scale: 0, rotate: 20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 4.2, type: "spring", stiffness: 200 }}
                    className="shrink-0 mt-0.5"
                  >
                    <Check className="w-4 h-4 md:w-5 md:h-5 text-green-400 stroke-[3]" />
                  </motion.div>
                  <p className={cn("font-normal text-sm md:text-base leading-relaxed", isLightMode ? "text-slate-600" : "text-white/80")}>
                    "ความจริงคือ... ความสนุกมันอยู่ที่บรรยากาศและเพื่อนรอบข้าง"
                  </p>
                </div>
              </motion.div>

              {/* Item 4 */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 5.0 }}
                className={cn("p-4 border rounded-xl backdrop-blur-md flex flex-col gap-3 shadow-lg", isLightMode ? "bg-white border-slate-200" : "bg-zinc-900/40 border-white/5")}
              >
                <div className="flex items-center flex-wrap gap-x-2 gap-y-1">
                  <h4 className="font-bold text-yellow-400 text-sm md:text-base uppercase tracking-widest">นอยด์ เครียด อารมณ์ขุ่น</h4>
                  <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 5.5, type: "spring", stiffness: 200 }}
                    className="flex items-center justify-center bg-red-500/20 text-red-400 w-5 h-5 md:w-6 md:h-6 rounded-full border border-red-500/30 shadow-sm"
                  >
                    <X className="w-3.5 h-3.5 stroke-[3]" />
                  </motion.div>
                  <h4 className="font-bold text-yellow-400 text-sm md:text-base uppercase tracking-widest">ต้องสูบ</h4>
                </div>
                <div className="flex items-start gap-2.5 border-l-2 border-green-500/30 pl-3">
                  <motion.div
                    initial={{ scale: 0, rotate: 20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 5.7, type: "spring", stiffness: 200 }}
                    className="shrink-0 mt-0.5"
                  >
                    <Check className="w-4 h-4 md:w-5 md:h-5 text-green-400 stroke-[3]" />
                  </motion.div>
                  <p className={cn("font-normal text-sm md:text-base leading-relaxed", isLightMode ? "text-slate-600" : "text-white/80")}>
                    "ความจริงคือ... เรื่องดราม่า (อกหัก/สอบตก) มันผ่านเข้ามาแล้วก็ไป... แต่ใจของน้องแกร่งกว่าสารเคมีพวกนั้นเยอะจ้ะ น้องผ่านมันไปได้ด้วยเองแน่นอน"
                  </p>
                </div>
              </motion.div>
            </div>

            <div className="mt-auto pt-4 flex flex-col gap-3 pb-2 z-10">
              <button
                onClick={nextStep}
                className="w-full h-14 bg-yellow-400 text-black font-normal text-lg uppercase tracking-tight rounded-xl hover:bg-yellow-300 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-yellow-400/20"
              >
                clear <ChevronRight className="w-5 h-5" />
              </button>
              <button
                onClick={prevStep}
                className={cn("w-14 h-12 rounded-xl border flex items-center justify-center transition-colors", isLightMode ? "bg-white border-slate-200 text-slate-400 hover:bg-slate-50" : "bg-zinc-900/50 border-white/10 text-white/30 hover:bg-zinc-800")}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col relative mt-6"
          >
            <div className="flex items-center gap-3 md:gap-4 mb-4">
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
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn("border rounded-xl rounded-tl-none p-4 max-w-[85%]", isLightMode ? "bg-yellow-50 border-yellow-100" : "bg-yellow-500/20 border-yellow-500/20")}
              >
                <p className={cn("text-base md:text-lg font-normal leading-relaxed whitespace-pre-wrap", isLightMode ? "text-yellow-700" : "text-yellow-100")}>
                  "{questionText}"<br />
                  <span className={cn("text-xs uppercase font-normal tracking-widest mt-2 block", isLightMode ? "text-yellow-500" : "text-yellow-400")}>คลิกได้เลย</span>
                </p>
              </motion.div>
            </div>

            <div className="flex-1 space-y-3 relative z-10 pb-4">
              {versions.map((v, i) => (
                <motion.button
                  key={v.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelectedVersion(v.text)}
                  className={cn(
                    "w-full p-4 md:p-6 rounded-xl border-2 text-left transition-all flex items-center gap-4 group relative overflow-hidden",
                    selectedVersion === v.text
                      ? (isLightMode ? "shadow-xl border-opacity-100" : "shadow-lg")
                      : (isLightMode ? "border-slate-200 bg-white hover:bg-slate-50" : "border-white/5 bg-zinc-900/60 hover:bg-zinc-800")
                  )}
                  style={selectedVersion === v.text ? {
                    borderColor: v.color,
                    backgroundColor: isLightMode ? `${v.color}08` : `${v.color}15`,
                    boxShadow: isLightMode ? `0 10px 30px -10px ${v.color}44` : `0 0 20px ${v.color}33`
                  } : {}}
                >
                  <div
                    className={cn(
                      "w-10 h-10 md:w-14 md:h-14 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                      selectedVersion === v.text ? "text-black border-2 border-black" : "bg-white/5 text-white/50 border border-white/10"
                    )}
                    style={selectedVersion === v.text ? { backgroundColor: v.color } : {}}
                  >
                    <v.icon className="w-5 h-5 md:w-6 md:h-6" strokeWidth={selectedVersion === v.text ? 3 : 2} />
                  </div>
                  <span
                    className={cn(
                      "font-normal text-base md:text-lg flex-1 leading-snug transition-colors",
                      selectedVersion === v.text ? "" : (isLightMode ? "text-slate-600" : "text-zinc-400")
                    )}
                    style={selectedVersion === v.text ? { color: v.color } : {}}
                  >{v.text}</span>
                  {selectedVersion === v.text && <Check className="w-5 h-5 md:w-6 md:h-6" style={{ color: v.color }} strokeWidth={3} />}
                </motion.button>
              ))}

              <div className={cn(
                "p-4 md:p-6 rounded-xl border-2 transition-all flex flex-col gap-3",
                selectedVersion === "other"
                  ? "border-yellow-400 bg-yellow-400/10 shadow-[0_0_20px_rgba(250,204,21,0.2)]"
                  : (isLightMode ? "border-slate-200 bg-white" : "border-white/5 bg-zinc-900/60")
              )}>
                <button
                  onClick={() => setSelectedVersion("other")}
                  className="flex items-center gap-4 text-left w-full"
                >
                  <div className={cn(
                    "w-10 h-10 md:w-14 md:h-14 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                    selectedVersion === "other" ? "bg-yellow-400 text-black border-2 border-black" : "bg-white/5 text-white/50 border border-white/10"
                  )}>
                    <Smile className="w-5 h-5 md:w-6 md:h-6" strokeWidth={selectedVersion === "other" ? 3 : 2} />
                  </div>
                  <span className={cn(
                    "font-normal text-base md:text-lg flex-1 transition-colors",
                    selectedVersion === "other" ? "text-yellow-500" : (isLightMode ? "text-slate-500" : "text-zinc-400")
                  )}>ถ้าข้างบนยังไม่โดนใจ พิมพ์บอกพี่ตรงนี้ได้เลยจ๊ะ</span>
                </button>
                {selectedVersion === "other" && (
                  <textarea
                    value={customVersion}
                    onChange={(e) => setCustomVersion(e.target.value)}
                    placeholder="ฉันที่..."
                    className="w-full bg-black/50 border border-yellow-400/50 rounded-xl p-4 text-lg font-normal text-yellow-400 outline-none resize-none min-h-[120px] focus:border-yellow-400 placeholder:text-yellow-400/20"
                  />
                )}
              </div>
            </div>

            <div className={cn("mt-auto pt-6 flex items-end justify-between gap-4 sticky bottom-0 pb-4 z-20", isLightMode ? "bg-linear-to-t from-[#f8fafc] via-[#f8fafc]/90 to-transparent" : "bg-linear-to-t from-black via-black/90 to-transparent")}>
              <div className="flex-1 flex flex-col gap-3 w-full">
                <button
                  onClick={nextStep}
                  disabled={isSubmitting || !selectedVersion || (selectedVersion === "other" && !customVersion)}
                  className="w-full h-14 bg-yellow-400 text-black font-bold text-lg uppercase tracking-tight rounded-xl hover:bg-yellow-300 disabled:opacity-20 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(250,204,21,0.3)] disabled:shadow-none"
                >
                  {selectedVersion ? "ยืนยัน" : "เลือกเวอร์ชัน"} <ChevronRight className="w-5 h-5" />
                </button>
                <button
                  onClick={prevStep}
                  className={cn("w-14 h-12 rounded-xl border flex items-center justify-center transition-colors", isLightMode ? "bg-white border-slate-200 text-slate-400 hover:bg-slate-50" : "bg-zinc-900/50 border-white/10 text-white/30 hover:bg-zinc-800")}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        );

      case 5:
        return (
          <motion.div
            key="step5"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center text-center space-y-8 py-4 relative"
          >
            <div className="relative w-full z-10 mt-6">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("border-2 p-6 rounded-xl relative backdrop-blur-md", isLightMode ? "bg-white border-slate-200 shadow-xl" : "bg-zinc-900/60 border-white/10")}
              >
                <div className="absolute top-0 left-0 w-20 h-20 border-l-4 border-t-4 border-yellow-400/50 rounded-tl-xl -m-[2px]" />

                <div className="space-y-4">
                  {[
                    "น้องได้เห็นทีมสนับสนุนของน้อง",
                    "น้องได้เลือกตัวตนที่น้องอยากเป็น",
                    "น้องได้เคลียร์พื้นที่แห่งความกลัว"
                  ].map((txt, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + (i * 0.1) }}
                      className={cn("text-lg font-normal", isLightMode ? "text-slate-700" : "text-white")}
                    >
                      {txt}
                    </motion.div>
                  ))}
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className={cn("text-lg font-bold mt-6 border-t pt-6 uppercase tracking-wider", isLightMode ? "text-yellow-500 border-slate-100" : "text-yellow-400 border-white/10")}
                  >
                    “กำแพงที่น้องกังวล...ไม่ได้สูงเกินกว่าที่เราจะก้าวผ่านใช่ไหมคะ?”
                  </motion.p>
                </div>
              </motion.div>
            </div>

            <div className="relative z-10 px-4 w-full">
              <h2 className={cn("text-lg md:text-lg font-bold leading-relaxed mb-4", isLightMode ? "text-slate-800" : "text-white")}>
                ตอนนี้น้องพร้อมจะไปวางแผน<br />
                <span className={cn("border-b-4 pb-1", isLightMode ? "text-yellow-500 border-yellow-500" : "text-yellow-400 border-yellow-400")}>ทวงคืนชีวิตเรา</span><br />
                จากพ็อตใจร้าย
              </h2>
              <p className={cn("font-normal text-lg", isLightMode ? "text-slate-500" : "text-zinc-400")}>กับพี่จริงใจหรือยังคะ????</p>
            </div>

            <div className="w-full relative flex flex-col items-center justify-end flex-1 min-h-[300px]">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="absolute inset-0 flex items-center justify-center -z-0"
              >
                <div className="relative w-full h-full">
                  <img
                    src="/model/model5.png"
                    alt="Assistant JingJai"
                    className="absolute inset-0 w-full object-contain object-bottom origin-bottom"
                  />
                </div>
              </motion.div>

              <div className="relative z-10 w-full flex items-end justify-between px-2 md:px-0 pb-6 gap-4 mt-auto pt-[200px]">
                <div className="flex flex-col items-center gap-2 flex-1 w-full">
                  <div className="flex flex-col items-center mb-1 animate-bounce">
                    <span className="text-xs md:text-sm font-medium uppercase text-white/40 tracking-widest bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">click</span>
                    <ChevronRight className="rotate-90 w-5 h-5 text-pink-500 mt-1" />
                  </div>
                  <button
                    onClick={() => {
                      trackStageButtonClick(user?.id, 2, "SIS_CLEAR", "sis_clear_not_yet", "ยังก่อน", "/library");
                      setShowNotReadyModal(true);
                    }}
                    disabled={isSubmitting}
                    className="w-full bg-white text-black font-bold py-4 px-4 rounded-2xl text-lg border-b-[6px] border-pink-500 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shadow-2xl"
                  >
                    ยังก่อน
                  </button>
                </div>

                <div className="flex flex-col items-center gap-2 flex-1 w-full">
                  <div className="flex flex-col items-center mb-1 animate-bounce">
                    <span className="text-xs md:text-sm font-medium uppercase text-white/40 tracking-widest bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">click</span>
                    <ChevronRight className="rotate-90 w-5 h-5 text-emerald-400 mt-1" />
                  </div>
                  <button
                    onClick={() => {
                      trackStageButtonClick(user?.id, 2, "SIS_CLEAR", "sis_clear_ready", "พร้อมลุย!", "/sis-craft");
                      void handleFinish("/sis-craft");
                    }}
                    disabled={isSubmitting}
                    className="w-full bg-white text-black font-bold py-4 px-4 rounded-2xl text-lg border-b-[6px] border-emerald-400 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-2xl"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-6 h-6 animate-spin text-black/40" />
                    ) : (
                      "พร้อมลุย!"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={cn("max-w-lg mx-auto overflow-hidden", isLightMode ? "bg-[#f8fafc]" : "bg-black")}>
      {/* Header */}
      <div className="w-full flex justify-between items-center mb-6">
        <div className="w-10 h-10">
          <img src="/wesis-icon.png" alt="WESIS" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-yellow-400 font-bold text-lg uppercase tracking-tighter">SIS Clear</h1>
      </div>

      <AnimatePresence mode="wait">
        {renderStep()}
      </AnimatePresence>

      {/* Support Modal */}
      <AnimatePresence>
        {showNotReadyModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNotReadyModal(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-sm bg-zinc-900 border border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col p-6 gap-6 shadow-[0_0_50px_rgba(0,0,0,0.8)]"
            >
              <div className="flex items-end gap-3 mb-2">
                <div className="shrink-0 relative w-16 h-16 rounded-full border-2 border-white/10 bg-zinc-800 shadow-xl overflow-visible">
                  <img
                    src="/model/model13.png"
                    alt="Assistant JingJai"
                    className="absolute inset-0 w-full h-[125%] object-cover object-top scale-125 top-[-10px]"
                  />
                </div>
                <div className="relative bg-zinc-800 border border-white/10 p-4 rounded-xl rounded-bl-none shadow-xl">
                  <p className="text-white text-sm md:text-base leading-relaxed font-normal ">
                    "ไม่เป็นไรเลยจ้ะ... ความลังเลไม่ใช่เรื่องผิดนะ แต่มันแปลว่าน้องกำลังให้ความสำคัญกับเรื่องนี้มากๆ ต่างหาก ....เปลี่ยนใจเมื่อไหร่ก็แวะมาหาพี่น้า พี่อยู่ตรงนี้เสมอจ้า ไว้พี่แวะไปทักทายนะคะ ...."
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-3">
                  <button
                    onClick={handleHesitantExit}
                    disabled={isSubmitting}
                    className="w-full h-14 bg-yellow-400 text-black font-bold text-lg rounded-2xl hover:bg-yellow-300 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(250,204,21,0.2)]"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "ยืนยันการออก"}
                  </button>
                  <button
                    onClick={() => setShowNotReadyModal(false)}
                    disabled={isSubmitting}
                    className="w-full h-12 rounded-xl text-white/50 font-medium text-base transition-colors hover:text-white"
                  >
                    ยกเลิก
                  </button>
                  <p className="text-white/30 text-xs uppercase tracking-widest animate-pulse text-center mt-4">
                    ระบบจะพาไปหน้าหลักใน 3 วินาที...
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
