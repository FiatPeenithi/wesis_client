
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  LogOut,
  BookOpen,
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import api from "../lib/api";



export default function SecondaryGroupPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [quitBotConsent, setQuitBotConsent] = useState<boolean | null>(null);
  const [savingConsent, setSavingConsent] = useState(false);
  const [loadingConsent, setLoadingConsent] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    api.get(`/profiles/secondary-group-consent/${user.id}`)
      .then(({ data }) => setQuitBotConsent(data.data?.consent ?? null))
      .catch((error) => console.error("Failed to load QuitBot consent:", error))
      .finally(() => setLoadingConsent(false));
  }, [user?.id]);

  const recordConsent = async (consent: boolean) => {
    if (!user?.id || savingConsent) return;
    const quitBotWindow = consent ? window.open("about:blank", "_blank") : null;
    setSavingConsent(true);
    try {
      const { data } = await api.post("/profiles/secondary-group-consent", { userId: user.id, consent });
      setQuitBotConsent(data.data?.consent ?? consent);
      if (quitBotWindow) quitBotWindow.location.href = "https://quitbot.thailandquitline.or.th";
    } catch (error) {
      console.error("Failed to save QuitBot consent:", error);
      quitBotWindow?.close();
      window.alert("บันทึกการตัดสินใจไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSavingConsent(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#08070a] text-[#f5f4f0] selection:bg-[#f0b429]/30 overflow-x-hidden pb-20 font-sarabun">
      <div className="w-full h-full flex items-center justify-center">
        <img src="/wesis-icon.png" alt="WESIS" className="w-32 h-32 object-contain" />
      </div>

      <div className="relative max-w-[440px] mx-auto px-6 py-8 flex flex-col gap-12">

        {/* Hero: identity + status, replacing the generic "Welcome" eyebrow */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent px-7 py-9 text-center"
        >
          <div className="mx-auto mb-5 h-20 w-20 relative">
            <div className="absolute inset-0 rounded-full bg-[#f0b429] blur-md opacity-30" />
            <img
              src={`/avatar/${user?.avatarId ?? 1}.jpg`}
              alt="Profile"
              className="relative h-20 w-20 rounded-full object-cover border-2 border-[#f0b429]"
              onError={(e) => { e.currentTarget.src = "/avatar/1.jpg"; }}
            />
          </div>
          <h1 className="font-prompt text-[26px] font-semibold tracking-tight">สวัสดีจ้ะ</h1>
          <p className="mt-1 text-sm text-white/50">{user?.email}</p>
          <span className="mt-4 inline-block rounded-full border border-[#f0b429]/25 bg-[#f0b429]/10 px-3 py-1 font-mono text-xs tracking-wide text-[#f0b429]">
            ID {user?.id}
          </span>
        </motion.section>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="text-center font-prompt text-lg font-medium leading-snug text-[#f0b429]"
        >
          ระบบ WESIS ขออนุญาตส่งต่อน้องๆให้กับทีม น้องวันใหม่ AI QuitBot
          <span className="mt-3 block text-sm font-normal leading-relaxed text-white/70">
            น้องวันใหม่ คือ แชตบอตอัจฉริยะที่พัฒนาโดย สายด่วนเลิกบุหรี่ 1600 เข้าถึงได้ตลอด 24 ชั่วโมง โดยไม่ต้องระบุตัวตน
          </span>
        </motion.p>

        {loadingConsent ? null : quitBotConsent === null ? (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="flex flex-col gap-3"
          >
            <button disabled={savingConsent} onClick={() => void recordConsent(true)} className="rounded-2xl bg-[#2f9e6e] px-5 py-4 font-prompt font-semibold text-white disabled:opacity-50">ยินยอม</button>
            <button disabled={savingConsent} onClick={() => void recordConsent(false)} className="rounded-2xl border border-white/15 bg-white/[0.04] px-5 py-4 font-prompt font-semibold text-white/80 disabled:opacity-50">ไม่ยินยอม</button>
          </motion.section>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-center font-prompt text-sm text-white/70">
              คุณ{quitBotConsent ? "ยินยอม" : "ไม่ยินยอม"}ให้ส่งต่อไปยังน้องวันใหม่ AI QuitBot
            </p>
            <motion.button
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/secondary-group/library")}
              className="group flex items-center gap-4 rounded-2xl border border-[#2f9e6e]/25 bg-[#2f9e6e]/[0.07] px-5 py-5 text-left transition-colors hover:bg-[#2f9e6e]/[0.12]"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#2f9e6e]/15"><BookOpen className="h-5 w-5 text-[#4ade9b]" /></span>
              <span className="flex-1"><span className="block font-prompt text-sm font-semibold text-white">คลังความรู้</span></span>
              <ArrowLeft className="h-4 w-4 rotate-180 text-white/30 transition-transform group-hover:translate-x-0.5" />
            </motion.button>
          </div>
        )}

        {/* Footer */}
        <footer className="flex flex-col items-center gap-6 pt-10 text-center">
          <p className="font-prompt text-xs tracking-[0.35em] text-white/20">WESIS · QUIT TOGETHER</p>
          <button
            onClick={() => {
              logout();
              navigate("/");
            }}
            className="flex items-center gap-2 rounded-full border border-white/10 px-6 py-3 text-xs font-semibold text-white/40 transition-colors hover:border-rose-500/30 hover:text-rose-400"
          >
            <LogOut className="h-3.5 w-3.5" />
            ออกจากระบบ
          </button>
        </footer>

      </div>
    </div>
  );
}
