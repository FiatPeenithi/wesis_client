import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import api from "../lib/api";
import { Sparkles, ChevronLeft, Shield } from "lucide-react";
import { cn } from "../lib/utils";

export default function SosKitsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const isLightMode = (user as any)?.currentStage >= 5;

  useEffect(() => {
    if (user?.id) {
      const fetchData = async () => {
        try {
          const [logsRes, craftsRes] = await Promise.all([
            api.get(`/sis/craft/logs/${user.id}`),
            api.get("/sis/craft")
          ]);

          const logs = logsRes.data.data;
          const crafts = craftsRes.data.data;

          if (logs && logs.length > 0) {
            const latestLog = logs[0];
            setData({ 
              log: latestLog, 
              crafts, 
              logItems: latestLog.sisCraftItemLogs || [] 
            });
          }
        } catch (error) {
          console.error("Failed to fetch SOS strategies:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [user?.id]);

  return (
    <div className="flex flex-col gap-6 pt-2 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center border transition-colors",
            isLightMode ? "bg-white border-slate-200 hover:bg-slate-50" : "bg-white/5 border-white/10 hover:bg-white/10"
          )}
        >
          <ChevronLeft className={cn("w-5 h-5", isLightMode ? "text-slate-700" : "text-white")} />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-yellow-400 flex items-center justify-center">
            <Shield className="w-5 h-5 text-black" />
          </div>
          <h1 className={cn("text-lg font-bold tracking-tight", isLightMode ? "text-slate-900" : "text-white")}>SOS-KITS</h1>
        </div>
        <div className="w-10" />
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center min-h-[50vh]">
          <div className="w-8 h-8 border-3 border-yellow-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !data ? (
        <div className={cn(
          "flex-1 flex flex-col items-center justify-center text-center p-6 rounded-3xl border border-dashed min-h-[40vh]",
          isLightMode ? "bg-white border-slate-200" : "bg-white/5 border-white/10"
        )}>
          <div className={cn("w-16 h-16 rounded-full flex items-center justify-center mb-6", isLightMode ? "bg-slate-100" : "bg-white/5")}>
            <Sparkles className={cn("w-8 h-8", isLightMode ? "text-slate-300" : "text-white/20")} />
          </div>
          <p className={cn("text-lg font-normal", isLightMode ? "text-slate-500" : "text-white/50")}>ยังไม่มีแผนการที่คุณบันทึกไว้</p>
          <button 
            onClick={() => navigate("/sis-craft")}
            className="mt-6 px-6 py-2 bg-yellow-400 text-black rounded-xl font-bold text-base uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
          >
            ไปหน้า SIS Craft
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* My Promise Card */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-400 text-black p-6 rounded-4xl shadow-xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12">
              <Shield className="w-20 h-20" />
            </div>
            <div className="relative z-10">
              <span className="text-xs font-bold uppercase tracking-[0.2em] opacity-60">My Promise</span>
              <p className="text-lg font-bold italic mt-2 leading-tight">
                "{data.log.promise}"
              </p>
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-black/10 rounded-full">
                <span className="text-xs font-bold">D-Day: {data.log.quit_date}</span>
              </div>
            </div>
          </motion.div>

          {/* Strategy Groups */}
          <div className="grid grid-cols-1 gap-4">
            {data.crafts.map((craft: any, index: number) => {
              const selections = data.logItems.filter((li: any) => li.sisCraftId === craft.id);
              if (selections.length === 0) return null;

              return (
                <motion.div
                  key={craft.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "p-5 rounded-3xl border flex flex-col group transition-colors",
                    isLightMode ? "bg-white border-slate-200 hover:bg-slate-50" : "bg-white/5 border-white/10 hover:bg-white/10"
                  )}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-yellow-400/20 rounded-xl flex items-center justify-center border border-yellow-400/30">
                      <span className="text-base">🔥</span>
                    </div>
                    <h3 className={cn("font-bold text-lg tracking-tight", isLightMode ? "text-slate-900" : "text-white")}>{craft.title}</h3>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {selections.map((li: any) => (
                      <div
                        key={li.id}
                        className={cn(
                          "px-4 py-2 text-base font-bold rounded-2xl border shadow-sm",
                          isLightMode ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-yellow-400/10 text-yellow-400 border-yellow-400/20"
                        )}
                      >
                        {li.sisCraftItem?.message}
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="pt-6">
            <button
               onClick={() => navigate("/dashboard")}
               className={cn(
                 "w-full py-4 rounded-2xl text-sm font-bold uppercase tracking-[0.3em] transition-all active:scale-95 border",
                 isLightMode ? "bg-white border-slate-200 text-slate-400 hover:bg-slate-50" : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"
               )}
            >
              กลับหน้าหลัก
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
