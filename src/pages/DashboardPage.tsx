import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock as LockIcon,
  X,
  Loader2,
  Sparkles,
  Calendar as CalendarIcon,
  Clock,
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import confetti from "canvas-confetti";
import api from "../lib/api";
import { useAuthStore } from "../store/useAuthStore";
import { cn } from "../lib/utils";
import { getStage5Message } from "../lib/stage5Messages";
import { RankCard } from "../components/RankCard";

type AnyRecord = Record<string, any>;

/**
 * ดึงข้อมูลจาก API Response โดยรองรับทั้ง Axios Response ดั้งเดิม 
 * และ Response ที่โดน Interceptor Unwrap ค่ามาแล้ว
 */
function getApiData<T = any>(response: any): T {
  if (!response) return null as unknown as T;

  // กรณี response เป็น Array
  if (Array.isArray(response)) {
    return response as unknown as T;
  }

  // กรณีเป็น Axios Response หรือ { success: true, data: ... }
  const data = response?.data !== undefined ? response.data : response;

  if (Array.isArray(data)) {
    return data as unknown as T;
  }

  return data as unknown as T;
}

/**
 * ดึง Record ล่าสุด โดยจับคู่ userId ทั้งแบบ ID สั้นและแบบ CUID เต็ม
 */
function getLatestRecord<T extends AnyRecord>(
  data: unknown,
  userId?: string
): T | null {
  if (!data) return null;

  let list: any[] = [];

  if (Array.isArray(data)) {
    list = data;
  } else if (data && typeof data === "object" && Array.isArray((data as any).data)) {
    list = (data as any).data;
  } else if (data && typeof data === "object") {
    return data as T;
  } else {
    return null;
  }

  if (list.length === 0) return null;

  // กรองตาม userId ยืดหยุ่นทั้ง ID สั้นและ ID ยาว
  const userRecords = userId
    ? list.filter((item) => {
      if (!item || typeof item !== "object") return false;
      if (!item.userId) return true;

      const currentUId = String(userId);
      const itemUId = String(item.userId);

      return (
        itemUId === currentUId ||
        itemUId.startsWith(currentUId) ||
        currentUId.startsWith(itemUId)
      );
    })
    : list;

  const records = userRecords.length > 0 ? userRecords : list;

  return (
    [...records].sort((a, b) => {
      const aDate = new Date(a?.createdAt ?? a?.updatedAt ?? 0).getTime();
      const bDate = new Date(b?.createdAt ?? b?.updatedAt ?? 0).getTime();
      return bDate - aDate;
    })[0] ?? null
  );
}

function getLocalDateFromApiDate(value?: string | null): Date | null {
  if (!value) return null;

  const datePart = value.split("T")[0];
  if (!datePart) return null;

  const date = new Date(`${datePart}T00:00:00`);
  return isNaN(date.getTime()) ? null : date;
}

export default function DashboardPage() {
  const { user, setUser } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<AnyRecord | null>(null);
  const [craftSummary, setCraftSummary] = useState<AnyRecord | null>(null);
  const [clearLog, setClearLog] = useState<AnyRecord | null>(null);
  const [rankings, setRankings] = useState<AnyRecord[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalContent, setModalContent] = useState("");

  /*
   * Clock
   */
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchFirstValid = async (urls: string[]) => {
      for (const url of urls) {
        try {
          const res = await api.get(url);
          if (res) return res;
        } catch (e) {
          // สลับไปลอง URL ถัดไป
        }
      }
      return null;
    };

    const fetchData = async () => {
      setLoading(true);

      try {
        const [
          profileRes,
          clearRes,
          craftRes,
          rankingsRes,
        ] = await Promise.all([
          fetchFirstValid([`/profiles/user/${user.id}`, `/profiles/${user.id}`]),
          fetchFirstValid([`/sis/clear/logs/${user.id}`, `/sis/clear/logs`]),
          fetchFirstValid([`/sis/craft/logs/${user.id}`, `/sis/craft/logs`]),
          fetchFirstValid([`/rankings`]),
          fetchFirstValid([`/auth/progress/${user.id}`]),
        ]);

        if (cancelled) return;
        /*
         * Profile (unwrap {success,data} envelope — api.ts has no interceptor)
         */
        const profileEnvelope = getApiData<AnyRecord>(profileRes);
        const profileData = (profileEnvelope as AnyRecord)?.data ?? profileEnvelope;
        if (profileData && (profileData as AnyRecord).id) {
          setProfile(profileData);
          setUser({
            ...user,
            defaultStage: profileData.defaultStage ?? (user as any).defaultStage,
            currentStage: profileData.currentStage ?? (user as any).currentStage,
            stage4At: profileData.stage4At ?? (user as any).stage4At,
            type: profileData.type ?? (user as any).type,
            attributes: profileData.attributes ?? (user as any).attributes,
            avatarId: profileData.avatarId ?? (user as any).avatarId,
          } as any);
          console.log(profileData)
          if (profileData.type === 2 && location.pathname !== "/secondary-group") {
            navigate("/secondary-group");
          }
        } else {
          setProfile(null);
        }

        /*
         * Clear Log
         */
        const clearData = getApiData<unknown>(clearRes);
        const latestClear = getLatestRecord<AnyRecord>(clearData, user.id);
        setClearLog(latestClear);

        /*
         * Craft Log
         */
        const craftData = getApiData<unknown>(craftRes);
        const latestCraft = getLatestRecord<AnyRecord>(craftData, user.id);

        if (latestCraft) {
          setCraftSummary({
            log: latestCraft,
            items: Array.isArray(latestCraft.sisCraftItemLogs)
              ? latestCraft.sisCraftItemLogs
              : [],
          });
        } else {
          setCraftSummary(null);
        }

        /*
         * Rankings
         */
        const rankingsData = getApiData<AnyRecord[]>(rankingsRes) ?? [];
        setRankings(Array.isArray(rankingsData) ? rankingsData : []);

      } catch (error) {
        console.error("Dashboard fetch error:", error);
        if (!cancelled) {
          setProfile(null);
          setClearLog(null);
          setCraftSummary(null);
          setRankings([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.currentStage, location.pathname, navigate]);

  /*
   * Stage 4 Celebration
   */
  useEffect(() => {
    if (
      !loading &&
      profile?.currentStage === 4 &&
      !profile?.stage4At &&
      !profile?.isAdmin &&
      user?.id
    ) {
      const timer = setTimeout(async () => {
        try {
          const now = new Date().toISOString();

          await api.patch(`/profiles/user/${user.id}`, {
            stage4At: now,
          });

          setProfile((prev) =>
            prev
              ? {
                ...prev,
                stage4At: now,
              }
              : prev
          );

          setUser({
            ...user,
            stage4At: now,
          } as any);

          const audio = new Audio("/sound/firework.mp3");
          const audio2 = new Audio("/sound/firework.mp3");
          const audio3 = new Audio("/sound/congrat.mp3");

          audio.play().catch((err) => console.log("Audio play blocked:", err));
          audio2.play().catch((err) => console.log("Audio play blocked:", err));
          audio3.play().catch((err) => console.log("Audio play blocked:", err));
        } catch (error) {
          console.error("Celebration error:", error);
        }

        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: [
            "#ef4444",
            "#3b82f6",
            "#facc15",
            "#34d399",
            "#ec4899",
            "#a855f7",
          ],
        });
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [
    loading,
    profile?.currentStage,
    profile?.stage4At,
    user,
    setUser,
  ]);

  /*
   * Current Craft Log & Fallback Data Binding
   */
  const currentCraftLog = craftSummary?.log ?? null;

  /*
   * D-Day, Promise, and Goal Message Mapping
   */
  const quitDate = currentCraftLog?.quit_date ?? clearLog?.quit_date ?? null;

  const promise = currentCraftLog?.promise ?? clearLog?.promise ?? "";

  // ดึงข้อความเป้าหมาย โดยอ่านจาก clearLog.message หรือดึงจาก sisCraftItemLogs
  const goalMessage =
    clearLog?.message ??
    clearLog?.goal ??
    (Array.isArray(currentCraftLog?.sisCraftItemLogs) && currentCraftLog.sisCraftItemLogs.length > 0
      ? currentCraftLog.sisCraftItemLogs
        .map((item: any) => item?.sisCraftItem?.message || item?.sisCraft?.message)
        .filter(Boolean)
        .join(" • ")
      : "") ??
    "";

  const timerData = useMemo(() => {
    const targetDate = getLocalDateFromApiDate(quitDate);

    if (!targetDate) {
      return null;
    }

    const diff = targetDate.getTime() - currentTime.getTime();
    const absDiff = Math.abs(diff);

    const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((absDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((absDiff % (1000 * 60)) / 1000);

    return {
      days,
      hours,
      minutes,
      seconds,
      isPast: diff <= 0,
      targetDate,
    };
  }, [quitDate, currentTime]);

  /*
   * Current Stage
   */
  const currentStepNumber =
    Number(
      profile?.currentStage ??
      user?.currentStage ??
      (user as any)?.profile?.currentStage ??
      1
    ) || 1;

  /*
   * Auto Stage 5 เมื่อถึง D-Day
   */
  useEffect(() => {
    if (
      timerData?.isPast &&
      currentStepNumber === 4 &&
      user?.id
    ) {
      const updateStage = async () => {
        try {
          await api.patch(
            `/profiles/user/${user.id}`,
            {
              currentStage: 5,
            }
          );

          setProfile((prev) =>
            prev
              ? {
                ...prev,
                currentStage: 5,
              }
              : prev
          );

          setUser({
            ...user,
            currentStage: 5,
          } as any);
        } catch (error) {
          console.error("Failed to auto-update stage to 5:", error);
        }
      };

      updateStage();
    }
  }, [
    timerData?.isPast,
    currentStepNumber,
    user,
    setUser,
  ]);

  /*
   * Stage 5 Light Mode
   */
  useEffect(() => {
    if (currentStepNumber >= 5) {
      document.body.classList.add("light-mode");
    } else {
      document.body.classList.remove("light-mode");
    }

    return () => {
      document.body.classList.remove("light-mode");
    };
  }, [currentStepNumber]);

  /*
   * Loading
   */
  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-yellow-400 animate-spin" />
        <p className="font-medium text-white uppercase text-sm">
          กำลังเตรียมบอร์ดของคุณ...
        </p>
      </div>
    );
  }

  /*
   * Progress Status
   */
  let statusText = "";
  if (currentStepNumber === 1) statusText = "0%";
  else if (currentStepNumber === 2) statusText = "50%";
  else if (currentStepNumber === 3) statusText = "90%";
  else if (currentStepNumber === 4) statusText = "100%";

  /*
   * Dynamic values
   */
  const avatarId = profile?.avatarId ?? user?.avatarId ?? 1;
  const email = user?.email ?? profile?.email ?? "-";
  const userId = user?.id ?? profile?.userId ?? "";

  return (
    <div className="max-w-xl mx-auto">
      {/* Profile */}
      <Link
        to="/profile"
        className="flex justify-between items-center mb-2 p-2 rounded-lg border border-slate-300"
      >
        <div className="relative flex items-center gap-2">
          <div className="relative w-16 h-16 md:w-18 md:h-18 rounded-full overflow-hidden border-2 border-slate-300">
            <img
              src={`/avatar/${avatarId}.jpg`}
              alt="Profile"
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = "/avatar/1.jpg";
              }}
            />
          </div>

          <div className="text-start">
            <h2
              className={cn(
                "text-base md:text-xl font-bold leading-tight line-clamp-1",
                currentStepNumber === 5
                  ? "text-slate-800"
                  : "text-yellow-500"
              )}
            >
              {email}
            </h2>

            <div
              className={cn(
                "text-sm md:text-lg flex items-center gap-1 mt-1 font-normal",
                currentStepNumber === 5
                  ? "text-slate-500"
                  : "text-white"
              )}
            >
              ID: {userId.substring(0, 8)}
            </div>
          </div>
        </div>

        <h2
          className={cn(
            "font-semibold text-base md:text-xl",
            currentStepNumber === 5
              ? "text-slate-800"
              : "text-white"
          )}
        >
          Profile
        </h2>
      </Link>

      <div className="grid grid-cols-2 gap-1 relative">
        {/* Stage 5 NPC */}
        {currentStepNumber >= 5 &&
          (() => {
            const days = timerData?.days ?? 0;
            const npcMsg = getStage5Message(days);

            return (
              <motion.div
                initial={{
                  opacity: 0,
                  y: 20,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration: 0.6,
                  ease: "easeOut",
                }}
                className="col-span-2 relative overflow-hidden min-h-[150px]"
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-2 border-yellow-400 bg-black">
                      <img
                        src="/model/model16.png"
                        alt="P'JingJai"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  <motion.div
                    initial={{
                      opacity: 0,
                      scale: 0.9,
                      x: 10,
                    }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      x: 0,
                    }}
                    transition={{
                      delay: 0.3,
                      duration: 0.5,
                    }}
                    className="flex-1 relative mb-2"
                  >
                    <div
                      className="absolute left-[-8px] top-4 w-0 h-0"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(250,204,21,0.12) 0%, rgba(250,204,21,0.05) 100%)",
                      }}
                    />

                    <div
                      className="rounded-2xl rounded-bl-md p-4 relative overflow-hidden"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(250,204,21,0.12) 0%, rgba(250,204,21,0.05) 100%)",
                      }}
                    >
                      <p
                        className={cn(
                          "text-sm md:text-lg font-medium mb-1.5 leading-tight",
                          "text-yellow-600"
                        )}
                      >
                        พี่จริงใจ
                      </p>

                      <div
                        className="text-sm md:text-lg font-normal leading-relaxed text-slate-700"
                        dangerouslySetInnerHTML={{
                          __html: npcMsg.message,
                        }}
                      />

                      <div className="mt-3 flex items-center gap-2">
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-sm font-medium uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                          <span>
                            ผ่านไปแล้ว{" "}
                            {timerData?.days ?? 0} วัน
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            );
          })()}

        {/* Progress */}
        {currentStepNumber < 5 && (
          <motion.div
            initial={{
              opacity: 0,
              y: 10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="col-span-2 bg-white/5 border border-white/10 rounded-xl p-2 flex flex-col gap-1"
          >
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-normal text-white/50 uppercase tracking-widest">
                  สถานะความพร้อม
                </span>
              </div>

              <span
                className={cn(
                  "text-sm font-medium uppercase py-0.5 px-2 rounded-xl text-black",
                  currentStepNumber === 1
                    ? "bg-red-500"
                    : currentStepNumber === 2
                      ? "bg-orange-500"
                      : currentStepNumber === 3
                        ? "bg-yellow-400"
                        : "bg-emerald-500 text-white"
                )}
              >
                {statusText}
              </span>
            </div>

            <div className="relative h-2 bg-white/5 rounded-full overflow-hidden border border-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${currentStepNumber === 1
                    ? 0
                    : currentStepNumber === 2
                      ? 50
                      : currentStepNumber === 3
                        ? 90
                        : 100
                    }%`,
                }}
                className={cn(
                  "h-full transition-all duration-1000 ease-out",
                  currentStepNumber === 1
                    ? "bg-red-500"
                    : currentStepNumber === 2
                      ? "bg-orange-500"
                      : currentStepNumber === 3
                        ? "bg-yellow-400"
                        : "bg-emerald-500"
                )}
              />
            </div>
          </motion.div>
        )}
 {/* SOS */}
        {currentStepNumber >= 4 && (
          <div className="col-span-2 flex justify-center mt-2">
            <motion.button
              whileHover={{
                scale: 1.02,
              }}
              whileTap={{
                scale: 0.98,
              }}
              onClick={() =>
                navigate("/sos-kits")
              }
              className="w-full px-6 py-3 rounded-xl flex items-center justify-center gap-3 border border-slate-300 transition-all group bg-white"
            >
              <div className="w-16 h-16 rounded-full flex items-center justify-center overflow-hidden bg-rose-700/20">
                <img
                  src="/model/model14.png"
                  alt="SOS Kits"
                  className="w-full h-full object-cover"
                  style={{
                    transform: "scale(2.4)",
                    transformOrigin:
                      "50% 3%",
                  }}
                />
              </div>

              <div className="text-start">
                <p className="text-3xl font-medium leading-none text-red-700">
                  SOS
                </p>

                <p className="text-xs font-medium text-black opacity-90 mt-1">
                  ถ้าอยากดูด หยุดดูแผนก่อน กดเลย
                </p>
              </div>
            </motion.button>
          </div>
        )}

        {/* Continue Button */}
        {(currentStepNumber < 4 ||
          (currentStepNumber === 4 &&
            !quitDate)) && (
            <div className="col-span-2 flex flex-col items-center justify-center gap-4 mt-4">
              <p
                className={cn(
                  "font-medium text-center",
                  currentStepNumber >= 5
                    ? "text-slate-800"
                    : "text-white"
                )}
              >
                {currentStepNumber === 1
                  ? "คุณพร้อมเริ่มต้นการเลิกใช้พ็อตหรือยัง?"
                  : currentStepNumber === 2
                    ? "คุณพร้อมที่จะตั้งเป้าหมายในการเลิกพ็อตแล้วหรือยัง?"
                    : currentStepNumber === 3
                      ? "คุณพร้อมที่จะวางแผนและกำหนดวัน D-Day แล้วหรือยัง?"
                      : "กรุณากำหนดวัน D-Day และคำสัญญาของคุณ"}
              </p>

              <button
                onClick={() => {
                  if (currentStepNumber === 1) {
                    navigate("/sis/check");
                  } else if (
                    currentStepNumber === 2
                  ) {
                    navigate("/sis-clear");
                  } else {
                    navigate("/sis-craft");
                  }
                }}
                className="w-full h-14 bg-yellow-400 text-black font-medium text-xl uppercase tracking-[0.2em] rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                {currentStepNumber === 1
                  ? "คลิกเพื่อเริ่ม"
                  : "ดำเนินการต่อ"}
              </button>
            </div>
          )}
        {/* Goals */}
        {currentStepNumber < 5 && (
          <motion.div
            initial={{
              opacity: 0,
              x: 20,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            onClick={() => {
              if (!clearLog && !goalMessage) return;

              setModalTitle("GOALS");
              setModalContent(
                goalMessage ||
                "ยังไม่ได้บันทึกเป้าหมาย"
              );
              setIsModalOpen(true);
            }}
            className={cn(
              "col-span-2 border rounded-xl p-2 relative overflow-hidden flex flex-col justify-center min-h-[100px] transition-all",
              clearLog || goalMessage
                ? "bg-white/5 border-white/10 cursor-pointer group active:scale-95"
                : "bg-white/5 border-white/10 opacity-50 cursor-not-allowed"
            )}
          >
            <div className="absolute top-2 right-4 text-yellow-500 font-medium text-xs pointer-events-none uppercase group-hover:text-white/10 transition-colors">
              Goals
            </div>

            {goalMessage ? (
              <p className="text-white text-lg font-normal line-clamp-3 w-[85%]">
                {goalMessage}
              </p>
            ) : (
              <div className="flex flex-col items-center gap-2 text-white/50">
                <LockIcon className="w-5 h-5" />

                <p className="text-sm font-medium uppercase tracking-widest text-center">
                  ยังไม่มีข้อมูลเป้าหมาย
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* D-Day */}
        {currentStepNumber < 5 && (
          <motion.div
            initial={{
              opacity: 0,
              y: 15,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.1,
            }}
            className={cn(
              "col-span-1 border rounded-xl p-2 flex flex-col items-center justify-center text-center relative group overflow-hidden transition-all",
              quitDate
                ? "bg-white/5 border-white/10"
                : "bg-white/5 border-white/10 opacity-50"
            )}
          >
            {quitDate ? (
              <>
                <div className="absolute inset-0 bg-yellow-400/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="bg-yellow-400/10 w-8 h-8 rounded-xl flex items-center justify-center mb-1">
                  <CalendarIcon className="w-4 h-4 text-yellow-400" />
                </div>

                <p className="text-white/50 uppercase mb-0.5 text-sm font-medium">
                  วัน D-Day เลิกพ็อต
                </p>

                <div className="font-normal text-white">
                  {timerData?.targetDate
                    ? timerData.targetDate.toLocaleDateString(
                      "th-TH",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )
                    : "-"}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-1 text-white/50">
                <CalendarIcon className="w-5 h-5 mb-1" />

                <p className="text-sm font-medium uppercase tracking-widest">
                  ยังไม่มีวัน D-Day
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Promise */}
        <motion.div
          initial={{
            opacity: 0,
            y: 15,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.2,
          }}
          onClick={() => {
            if (!promise) return;

            setModalTitle("ฉันขอสัญญาว่า");
            setModalContent(promise);
            setIsModalOpen(true);
          }}
          className={cn(
            currentStepNumber >= 5
              ? "col-span-2 min-h-auto"
              : "col-span-1 min-h-[140px]",
            "text-center rounded-xl p-2 flex flex-col justify-center relative overflow-hidden transition-all",
            promise
              ? "bg-yellow-400/80 hover:bg-yellow-400 cursor-pointer group active:scale-95 border border-yellow-500/30"
              : "bg-white/5 border border-white/10 opacity-50 cursor-not-allowed"
          )}
        >
          {promise ? (
            <>
              <p className="font-medium text-black mb-1">
                ฉันขอสัญญาว่า
              </p>

              <p
                className={cn(
                  "text-base font-normal text-black",
                  currentStepNumber === 5
                    ? ""
                    : "line-clamp-3"
                )}
              >
                {promise}
              </p>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 text-white/50">
              <Sparkles className="w-5 h-5" />

              <p className="text-sm font-medium uppercase tracking-widest">
                ยังไม่มีคำสัญญา
              </p>
            </div>
          )}
        </motion.div>

        {/* Ranking */}
        {currentStepNumber === 5 && (
          <motion.div
            initial={{
              opacity: 0,
              y: 10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.2,
            }}
            className="col-span-2"
          >
            {(() => {
              const days = timerData?.days ?? 0;

              const sortedRankings = [...rankings]
                .filter(
                  (rank) =>
                    typeof rank?.period === "number"
                )
                .sort(
                  (a, b) =>
                    b.period - a.period
                );

              const currentRankIndex =
                sortedRankings.findIndex(
                  (rank) =>
                    days >= rank.period
                );

              const currentRank =
                currentRankIndex !== -1
                  ? sortedRankings[
                  currentRankIndex
                  ]
                  : {
                    name: "Classic",
                    period: 1,
                  };

              const nextRank =
                currentRankIndex > 0
                  ? sortedRankings[
                  currentRankIndex - 1
                  ]
                  : null;

              return (
                <RankCard
                  name={currentRank.name}
                  period={days}
                  nextRankDays={
                    nextRank?.period
                  }
                  nextRankName={
                    nextRank?.name
                  }
                  size="lg"
                  className="w-full justify-center border border-black/5"
                />
              );
            })()}
          </motion.div>
        )}

        {/* Timer */}
        <motion.div
          initial={{
            opacity: 0,
            scale: 0.98,
          }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          transition={{
            delay: 0.3,
          }}
          className={cn(
            "col-span-2 border-2 rounded-xl p-2 flex flex-col items-center justify-center relative overflow-hidden transition-all",
            currentStepNumber >= 5
              ? timerData
                ? "bg-white border-zinc-200"
                : "bg-white border-zinc-200 opacity-50"
              : timerData
                ? "bg-black border-white/10"
                : "bg-white/5 border-white/10 opacity-50"
          )}
        >
          {timerData ? (
            <>
              <p
                className={cn(
                  "text-lg mb-1 font-normal",
                  currentStepNumber >= 5
                    ? "text-slate-500"
                    : "text-white/50"
                )}
              >
                {timerData.isPast
                  ? "น้องได้ชีวิตที่สดใสกลับคืนมา"
                  : "อีก"}
              </p>

              <div className="flex items-center gap-3 scale-90 md:scale-125">
                <Clock className="w-12 h-12 text-yellow-500 mr-2" />

                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      "text-3xl md:text-3xl font-black tabular-nums",
                      currentStepNumber >= 5
                        ? "text-slate-800"
                        : "text-white"
                    )}
                  >
                    {timerData.days}
                  </span>

                  <span className="text-sm md:text-sm font-semibold text-yellow-500 uppercase mt-0.5">
                    วัน
                  </span>
                </div>

                <span className="text-3xl font-normal text-white/20 -mt-4">
                  :
                </span>

                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      "text-3xl md:text-3xl font-black tabular-nums",
                      currentStepNumber >= 5
                        ? "text-slate-800"
                        : "text-white"
                    )}
                  >
                    {timerData.hours
                      .toString()
                      .padStart(2, "0")}
                  </span>

                  <span className="text-sm md:text-sm font-semibold text-yellow-500 uppercase mt-0.5">
                    ชั่วโมง
                  </span>
                </div>

                <span className="text-3xl font-normal text-white/20 -mt-4">
                  :
                </span>

                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      "text-3xl md:text-3xl font-black tabular-nums",
                      currentStepNumber >= 5
                        ? "text-slate-800"
                        : "text-white"
                    )}
                  >
                    {timerData.minutes
                      .toString()
                      .padStart(2, "0")}
                  </span>

                  <span className="text-sm md:text-sm font-semibold text-yellow-500 uppercase mt-0.5">
                    นาที
                  </span>
                </div>

                <span className="text-3xl font-normal text-white/20 -mt-4">
                  :
                </span>

                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      "text-3xl md:text-3xl font-black tabular-nums",
                      currentStepNumber >= 5
                        ? "text-slate-800"
                        : "text-white"
                    )}
                  >
                    {timerData.seconds
                      .toString()
                      .padStart(2, "0")}
                  </span>

                  <span className="text-sm md:text-sm font-semibold text-yellow-500 uppercase mt-0.5">
                    วินาที
                  </span>
                </div>
              </div>

              <p
                className={cn(
                  "text-lg mt-3 font-normal",
                  currentStepNumber === 5
                    ? "text-slate-500"
                    : "text-white/50"
                )}
              >
                {timerData.isPast
                  ? ""
                  : "จะเป็นอิสระแล้ว"}
              </p>
            </>
          ) : (
            <div
              className={cn(
                "flex flex-col items-center gap-3 py-4",
                currentStepNumber >= 5
                  ? "text-slate-500"
                  : "text-white/50"
              )}
            >
              <Clock className="w-5 h-5 animate-pulse" />

              <p className="text-sm font-medium uppercase tracking-[0.2em]">
                กำลังรอนับถอยหลังสู่ D-Day
              </p>
            </div>
          )}
        </motion.div>

       
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.9,
                y: 20,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.9,
                y: 20,
              }}
              className={cn(
                "relative w-full max-w-lg bg-zinc-900 border border-white/10 rounded-3xl p-8 overflow-hidden",
                modalTitle ===
                "ฉันขอสัญญาว่า" &&
                "bg-slate-700/80 border-none"
              )}
            >
              <button
                onClick={() =>
                  setIsModalOpen(false)
                }
                className={cn(
                  "absolute top-4 right-4 p-2 rounded-xl transition-colors",
                  modalTitle ===
                    "ฉันขอสัญญาว่า"
                    ? "text-white/40 hover:bg-black/10"
                    : "text-yellow-400"
                )}
              >
                <X className="w-6 h-6" />
              </button>

              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-6 rounded-full bg-yellow-400" />

                  <h3 className="text-base font-bold uppercase tracking-widest text-yellow-400">
                    {modalTitle}
                  </h3>
                </div>

                <div
                  className={cn(
                    "text-xl md:text-lg font-medium leading-relaxed",
                    modalTitle ===
                      "ฉันขอสัญญาว่า"
                      ? "text-white"
                      : currentStepNumber === 5
                        ? "text-slate-200"
                        : "text-white"
                  )}
                  dangerouslySetInnerHTML={{
                    __html: modalContent,
                  }}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
