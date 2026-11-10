import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import api from "../lib/api";
import {
  Lock as LockIcon,
  X,
  ChevronRight,
  LogOut,
  ChevronLeft,
  Search,
  Sparkles,
  Hammer,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Download,
  PencilLine
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { cn } from "../lib/utils";
import { usePWA } from "../hooks/usePWA";

// PWA Install component mock (You can replace this with your actual PWA component logic later)
function PWAInstall({ isLightMode }: { isLightMode?: boolean }) {
  const { isInstallable, installPWA, showIOSInstruction, setShowIOSInstruction } = usePWA();

  if (!isInstallable) return null;

  return (
    <>
      <button
        onClick={installPWA}
        className={cn(
          "w-full flex items-center justify-between p-3 rounded-2xl transition-all group mt-4 border",
          isLightMode
            ? "bg-white border-slate-200 hover:bg-slate-50"
            : "bg-black border-white/10 hover:bg-white/5"
        )}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <Download className="w-5 h-5" />
          </div>
          <span className={cn("font-normal", isLightMode ? "text-slate-600" : "text-white/70")}>ติดตั้งแอป WESIS</span>
        </div>
        <ChevronRight className={cn("w-5 h-5 group-hover:translate-x-1 transition-transform", isLightMode ? "text-slate-400" : "text-white/50")} />
      </button>

      <AnimatePresence>
        {showIOSInstruction && (
          <div className="fixed inset-0 z-100 flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowIOSInstruction(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className={cn(
                "relative w-full max-w-sm rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 border shadow-2xl",
                isLightMode ? "bg-white border-slate-200" : "bg-zinc-900 border-white/10"
              )}
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className={cn("text-lg font-bold", isLightMode ? "text-slate-900" : "text-white")}>วิธีติดตั้งบน iOS</h3>
                <button onClick={() => setShowIOSInstruction(false)} className={cn("p-2 rounded-full", isLightMode ? "bg-slate-100 text-slate-400" : "bg-white/5 text-white/50")}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-yellow-400 text-black flex items-center justify-center font-bold shrink-0">1</div>
                  <p className={cn("text-base leading-relaxed", isLightMode ? "text-slate-600" : "text-white/70")}>
                    แตะปุ่ม <span className="inline-flex items-center justify-center p-1 bg-white/10 rounded-lg mx-1 translate-y-1"><Download className="w-4 h-4 text-blue-400" /></span> (แชร์) ด้านล่างของเบราว์เซอร์ Safari
                  </p>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-yellow-400 text-black flex items-center justify-center font-bold shrink-0">2</div>
                  <p className={cn("text-base leading-relaxed", isLightMode ? "text-slate-600" : "text-white/70")}>
                    เลือก <span className="font-bold underline text-yellow-400">"เพิ่มไปยังหน้าจอโฮม"</span> (Add to Home Screen)
                  </p>
                </div>

                <button
                  onClick={() => setShowIOSInstruction(false)}
                  className="w-full py-4 bg-yellow-400 text-black rounded-2xl font-bold text-base uppercase tracking-widest mt-4 active:scale-95 transition-all"
                >
                  รับทราบ
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

function PinChangeFlow({ onBack, user, isLightMode }: { onBack: () => void, user: any, isLightMode?: boolean }) {
  const [step, setStep] = useState(1);
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const PIN_LENGTH = 6;

  const updatePin = (val: string) => {
    setError("");
    if (step === 1) setOldPin(val);
    else if (step === 2) setNewPin(val);
    else if (step === 3) setConfirmPin(val);
  };

  const getCurrentPin = () => {
    if (step === 1) return oldPin;
    if (step === 2) return newPin;
    return confirmPin;
  };

  const activeField = step === 1 ? "old" : step === 2 ? "new" : "confirm";
  const activeValue = getCurrentPin();

  const handlePinDigitChange = (index: number, value: string) => {
    const digit = value.replace(/[^0-9]/g, "");
    if (!digit && value !== "") return;

    const currentArr = activeValue.split("");
    const newArr = Array(6).fill("");
    for (let i = 0; i < currentArr.length; i++) newArr[i] = currentArr[i];

    if (digit) {
      newArr[index] = digit;
      const nextInput = document.getElementById(`${activeField}-${index + 1}`);
      if (nextInput && index < 5) (nextInput as HTMLInputElement).focus();
    } else {
      newArr[index] = "";
    }

    updatePin(newArr.join("").trim());
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !activeValue[index] && index > 0) {
      const prevInput = document.getElementById(`${activeField}-${index - 1}`);
      if (prevInput) {
        (prevInput as HTMLInputElement).focus();
        const currentArr = activeValue.split("");
        currentArr[index - 1] = "";
        updatePin(currentArr.join("").trim());
      }
    }
  };

  const handlePinPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, 6);
    if (pasted) {
      updatePin(pasted);
      const lastIdx = Math.min(pasted.length, 5);
      const lastInput = document.getElementById(`${activeField}-${lastIdx}`);
      if (lastInput) (lastInput as HTMLInputElement).focus();
    }
  };

  React.useEffect(() => {
    if (oldPin.length === PIN_LENGTH) {
      setTimeout(() => setStep(2), 300);
    }
  }, [oldPin]);

  React.useEffect(() => {
    if (newPin.length === PIN_LENGTH) {
      setTimeout(() => setStep(3), 300);
    }
  }, [newPin]);

  React.useEffect(() => {
    if (confirmPin.length === PIN_LENGTH) {
      if (confirmPin === newPin) {
        // Change PIN via API
        const submitPin = async () => {
          setIsLoading(true);
          try {
            await api.patch(`/profiles/user/${user.id}`, { pin: confirmPin });
            setIsSuccess(true);
            setTimeout(() => onBack(), 2000);
          } catch (err) {
            setError("เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน");
            setConfirmPin("");
            const firstInput = document.getElementById("confirm-0");
            if (firstInput) (firstInput as HTMLInputElement).focus();
          } finally {
            setIsLoading(false);
          }
        }
        submitPin();
      } else {
        setError("PIN ใหม่ไม่ตรงกัน กรุณาลองใหม่");
        setConfirmPin("");
        const firstInput = document.getElementById("confirm-0");
        if (firstInput) (firstInput as HTMLInputElement).focus();
      }
    }
  }, [confirmPin, newPin, onBack, user]);

  const titles = ["กรอก PIN เดิม", "กรอก PIN ใหม่", "ยืนยัน PIN ใหม่"];
  const subtitles = [
    "กรุณากรอกรหัสผ่านเดิมเพื่อดำเนินการต่อ",
    "ตั้งรหัสผ่านใหม่ที่จำได้ง่ายแต่คาดเดายาก",
    "กรอกรหัสผ่านใหม่อีกครั้งเพื่อยืนยัน"
  ];

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500"
        >
          <CheckCircle2 className="w-12 h-12" />
        </motion.div>
        <div className="text-center space-y-2">
          <h2 className={cn("text-lg font-bold tracking-tight", isLightMode ? "text-slate-900" : "text-white")}>เปลี่ยน PIN สำเร็จ!</h2>
          <p className={cn("font-normal", isLightMode ? "text-slate-500" : "text-white/50")}>รหัสใหม่ของคุณพร้อมใช้งานแล้วจ้ะ</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto flex flex-col min-h-[80vh] px-6 relative">
      <div className="flex items-center gap-4 mb-4 mt-6">
        <button onClick={onBack} disabled={isLoading} className={cn("p-2 -ml-2 transition-colors", isLightMode ? "text-slate-400 hover:text-slate-700" : "text-white/50 hover:text-white")}>
          <ChevronLeft className="w-6 h-6" />
        </button>
        <span className={cn("text-lg font-medium", isLightMode ? "text-slate-900" : "text-white")}>ความปลอดภัย</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full space-y-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6 text-center"
            >
              <div className="space-y-2">
                <div className={cn(
                  "inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium uppercase tracking-[0.2em] mx-auto",
                  step === 1 ? "bg-amber-400/10 text-amber-500" :
                    step === 2 ? "bg-emerald-400/10 text-emerald-500" :
                      "bg-indigo-400/10 text-indigo-500"
                )}>
                  <ShieldCheck className="h-3 w-3" />
                  Step {step}: {step === 1 ? "Authentication" : step === 2 ? "New Secret" : "Confirmation"}
                </div>
                <h2 className={cn("text-lg font-bold tracking-tight", isLightMode ? "text-slate-900" : "text-white")}>{titles[step - 1]}</h2>
                <p className={cn("font-normal", isLightMode ? "text-slate-500" : "text-white/50")}>{subtitles[step - 1]}</p>
              </div>

              <div className="flex justify-center gap-2">
                {[1, 2, 3].map((s) => (
                  <div key={s} className={cn(
                    "h-1.5 w-8 rounded-full transition-all",
                    step === s ? (
                      step === 1 ? "bg-amber-500" :
                        step === 2 ? "bg-emerald-500" :
                          "bg-indigo-500"
                    ) : step > s ? (
                      s === 1 ? "bg-amber-200" :
                        s === 2 ? "bg-emerald-200" :
                          "bg-indigo-200"
                    ) : (isLightMode ? "bg-slate-200" : "bg-white/10")
                  )} />
                ))}
              </div>

              <div className="flex justify-center gap-2.5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <input
                    key={`${activeField}-${i}`}
                    id={`${activeField}-${i}`}
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={activeValue[i] || ""}
                    onChange={(e) => handlePinDigitChange(i, e.target.value)}
                    onKeyDown={(e) => handlePinKeyDown(i, e)}
                    onPaste={handlePinPaste}
                    onFocus={(e) => e.target.select()}
                    autoFocus={i === 0}
                    disabled={isLoading}
                    className={cn(
                      "w-12 h-14 rounded-xl border-2 text-center text-lg font-normal transition-all outline-none focus:ring-0",
                      activeValue[i]
                        ? step === 1 ? "border-amber-400 bg-amber-400/10 text-amber-500 shadow-md shadow-amber-900/20" :
                          step === 2 ? "border-emerald-400 bg-emerald-400/10 text-emerald-500 shadow-md shadow-emerald-900/20" :
                            "border-indigo-400 bg-indigo-400/10 text-indigo-500 shadow-md shadow-indigo-900/20"
                        : (isLightMode ? "border-slate-200 bg-white text-slate-400 focus:border-slate-400 focus:bg-white" : "border-white/10 bg-black text-white/50 focus:border-white/30 focus:bg-black"),
                      isLoading && "opacity-50 cursor-not-allowed"
                    )}
                    style={{ caretColor: "transparent", WebkitTextSecurity: "disc" } as React.CSSProperties}
                  />
                ))}
              </div>

              {isLoading && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={cn("text-base font-semibold flex items-center justify-center gap-2", isLightMode ? "text-slate-500" : "text-white/50")}
                >
                  <Loader2 className="h-4 w-4 animate-spin" /> กำลังบันทึก...
                </motion.p>
              )}

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-rose-500 text-base font-semibold flex items-center justify-center gap-1.5"
                >
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </motion.p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout, setUser } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  const avatars = Array.from({ length: 12 }, (_, i) => i + 1);

  useEffect(() => {
    if (!user?.id) return;

    const fetchProfile = async () => {
      try {
        const res = await api.get(`/profiles/user/${user.id}`);
        setProfile(res.data.data);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user?.id]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (loading || !user) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-6">
        <Loader2 className="w-12 h-12 text-yellow-400 animate-spin" strokeWidth={3} />
      </div>
    );
  }

  const currentStage = profile?.currentStage || 1;
  const defaultStage = profile?.defaultStage || 1;
  const isLightMode = currentStage >= 5;

  const handleAvatarSelect = async (id: number) => {
    try {
      await api.patch(`/profiles/user/${user.id}`, { avatarId: id });
      setProfile((prev: any) => ({ ...prev, avatarId: id }));
      // Sync with Auth Store for global components like Navigation
      if (user) {
        setUser({ ...user, avatarId: id } as any);
      }
      setIsAvatarModalOpen(false);
    } catch (err) {
      console.error("Failed to update avatar:", err);
    }
  };

  if (isChangingPin) {
    return <PinChangeFlow onBack={() => setIsChangingPin(false)} user={user} isLightMode={isLightMode} />;
  }

  return (
    <div className={cn("max-w-2xl mx-auto space-y-6 px-4 py-2", isLightMode ? "bg-zinc-50" : "bg-black")}>
      <div className="flex items-center gap-4">
        <button onClick={() => navigate("/dashboard")} className={cn(isLightMode ? "text-slate-800" : "text-white")}>
          <ChevronLeft className="w-6 h-6" />
        </button>
        <p className={cn("text-lg font-bold", isLightMode ? "text-slate-900" : "text-white")}>My Profile</p>
      </div>

      <div className={cn(isLightMode ? "bg-zinc-50" : "bg-black", "border-none")}>
        <div className="space-y-2">
          {/* User Preview */}
          <div className={cn("flex items-center justify-between p-4 rounded-2xl border", isLightMode ? "bg-white border-slate-200 shadow-sm" : "bg-white/5 border-white/10")}>
            <div className="flex items-center gap-4">
              <div className={cn("w-16 h-16 rounded-xl overflow-hidden relative border-2 shadow-sm", isLightMode ? "border-slate-200" : "border-white/10")}>
                <img src={`/avatar/${profile?.avatarId ?? user?.avatarId ?? 1}.jpg`} alt="Avatar" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = "/avatar/1.jpg"; }} />
              </div>
              <div>
                <p className={cn("font-medium", isLightMode ? "text-slate-900" : "text-white")}>{user.email}</p>
                <p className={cn("text-sm font-medium uppercase tracking-widest", isLightMode ? "text-slate-400" : "text-white/50")}>User ID: {user.id.substring(0, 8)}</p>
              </div>
            </div>
            <button
              onClick={() => setIsAvatarModalOpen(true)}
              className={cn("px-4 py-2 rounded-xl text-sm font-medium uppercase tracking-widest transition-all active:scale-95 border", isLightMode ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700" : "bg-white/5 hover:bg-white/10 border-white/10 text-white")}
            >
              <PencilLine />
            </button>
          </div>

          <AnimatePresence>
            {isAvatarModalOpen && (
              <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsAvatarModalOpen(false)}
                  className="absolute inset-0 bg-black/80 backdrop-blur-md"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className={cn("relative w-full max-w-sm rounded-[2.5rem] p-8 border shadow-2xl", isLightMode ? "bg-white border-slate-200" : "bg-zinc-900 border-white/10")}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className={cn("text-lg font-bold", isLightMode ? "text-slate-900" : "text-white")}>เลือกรูปโปรไฟล์</h3>
                    <button onClick={() => setIsAvatarModalOpen(false)} className={cn("p-2 rounded-full", isLightMode ? "bg-slate-100 text-slate-400" : "bg-white/5 text-white/50")}>
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-4 overflow-y-auto px-1 custom-scrollbar">
                    {avatars.map((id) => (
                      <button
                        key={id}
                        onClick={() => handleAvatarSelect(id)}
                        className={cn(
                          "relative rounded-2xl overflow-hidden aspect-square border-2 transition-all active:scale-95 hover:border-yellow-400 group",
                          profile?.avatarId === id ? "border-yellow-400" : "border-transparent"
                        )}
                      >
                        <img src={`/avatar/${id}.jpg`} alt={`Avatar ${id}`} className="w-full h-full object-cover" />
                        {profile?.avatarId === id && (
                          <div className="absolute inset-0 bg-yellow-400/20 flex items-center justify-center">
                            <div className="bg-yellow-400 text-black p-1 rounded-full">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white text-sm font-bold uppercase tracking-widest">เลือก</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* PIN Settings */}
          <section className="space-y-4">
            <h3 className={cn("text-base font-bold uppercase tracking-widest", isLightMode ? "text-slate-400" : "text-white/50")}>ความปลอดภัย</h3>
            <button
              onClick={() => setIsChangingPin(true)}
              className={cn("w-full flex items-center justify-between p-3 rounded-2xl transition-colors group border", isLightMode ? "bg-white border-slate-200 hover:bg-slate-50" : "bg-black border-white/10 hover:bg-white/5")}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-yellow-400 text-black flex items-center justify-center">
                  <LockIcon className="w-5 h-5" />
                </div>
                <span className={cn("font-normal", isLightMode ? "text-slate-600" : "text-white/70")}>เปลี่ยนรหัสผ่าน PIN</span>
              </div>
              <ChevronRight className={cn("w-5 h-5 group-hover:translate-x-1 transition-transform", isLightMode ? "text-slate-400" : "text-white/50")} />
            </button>
            <PWAInstall isLightMode={isLightMode} />
          </section>

          {/* SIS Steps */}
          <section className="space-y-4">
            <h3 className={cn("text-base font-bold uppercase tracking-widest", isLightMode ? "text-slate-400" : "text-white/50")}>Status</h3>
            <div className="space-y-2">
              {[
                { id: 1, name: "SIS check", path: "/sis/check", icon: Search, color: "blue" },
                { id: 2, name: "SIS clear", path: "/sis-clear", icon: Sparkles, color: "emerald" },
                { id: 3, name: "SIS craft", path: "/sis-craft", icon: Hammer, color: "yellow" }
              ].filter(step => defaultStage <= step.id).map(step => {
                const isLocked = currentStage < step.id;
                const Icon = step.icon;

                const content = (
                  <div className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                        isLocked
                          ? (isLightMode ? "bg-slate-100 text-slate-300" : "bg-white/5 text-white/20")
                          : `bg-${step.color}-500/10 text-${step.color}-500`
                      )}>
                        {isLocked ? <LockIcon className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                      </div>
                      <span className={cn(
                        "font-normal",
                        isLocked
                          ? (isLightMode ? "text-slate-300" : "text-white/20")
                          : (isLightMode ? "text-slate-600" : "text-white/70")
                      )}>
                        {step.name}
                        {isLocked && <span className="ml-2 py-0.5 px-2 rounded-full bg-rose-500/10 text-rose-500 text-xs font-bold uppercase tracking-tighter border border-rose-500/20">Locked</span>}
                      </span>
                    </div>
                    {!isLocked && <ChevronRight className={cn("w-5 h-5 group-hover:translate-x-1 transition-transform", isLightMode ? "text-slate-400" : "text-white/50")} />}
                  </div>
                );

                if (isLocked) {
                  return (
                    <div
                      key={step.id}
                      className={cn(
                        "w-full rounded-2xl border cursor-not-allowed transition-all",
                        isLightMode ? "bg-white/50 border-slate-100" : "bg-white/2 border-white/5"
                      )}
                    >
                      {content}
                    </div>
                  );
                }

                return (
                  <Link
                    key={step.id}
                    to={step.path}
                    className={cn(
                      "w-full block rounded-2xl transition-colors group border",
                      isLightMode ? "bg-white border-slate-200 hover:bg-slate-50" : "bg-white/5 border-white/10 hover:bg-white/10"
                    )}
                  >
                    {content}
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Actions */}
          <section className={cn("pt-4 border-t", isLightMode ? "border-slate-200" : "border-white/10")}>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-4 p-3 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500/20 border border-rose-500/20 transition-all font-medium uppercase text-sm tracking-[0.2em] justify-center shadow-lg"
            >
              <LogOut className="w-5 h-5" />
              ออกจากระบบ
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
