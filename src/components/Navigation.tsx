import React, { useState, useEffect, Suspense, lazy } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import api from "../lib/api";
import {
  User as UserIcon,
  LogOut,
  Phone,
  Bell,
  NotebookPen,
  Book,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuthStore } from "../store/useAuthStore";
import { usePushNotifications } from "../hooks/usePushNotifications";
import { useUnreadCount } from "../hooks/useUnreadCount";
import { cn } from "../lib/utils";

// Lazy-load notification UI so a framer-motion / Notification API crash on
// old phones cannot break the initial boot bundle. Suspense fallback is null.
const PushOptIn = lazy(() =>
  import("./PushOptIn").then((m) => ({ default: m.PushOptIn })),
);
const NotificationToast = lazy(() =>
  import("./NotificationToast").then((m) => ({ default: m.NotificationToast })),
);

// Mapping directly to real routes where possible
export const MENU_ITEMS = [
  { id: "profile", href: "/", label: "โปรไฟล์", icon: UserIcon },
  { id: "diary-feeling", href: "/diary", label: "บันทึกความรู้สึก", icon: NotebookPen },
  { id: "library", href: "/library", label: "คลังความรู้", icon: Book },
  { id: "contact", href: "/contact", label: "ติดต่อ", icon: Phone },
];

function NotificationBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] px-1 rounded-full bg-rose-500 text-white text-[11px] font-black flex items-center justify-center border-2 border-inherit shadow-lg">
      {count > 99 ? '99+' : count}
    </span>
  );
}

export function DesktopSidebar({ isLightMode }: { isLightMode?: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const { logout } = useAuthStore();
  const { unread } = useUnreadCount();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={cn(
      "hidden md:flex flex-col w-[245px] xl:w-[335px] h-screen sticky top-0 border-r px-3 py-10 z-50 transition-colors duration-1000",
      isLightMode ? "bg-zinc-50 border-slate-200" : "bg-black border-white/5"
    )}>
      <div className="px-4 mb-14">
        <Link to="/" className="flex items-center gap-4">
          <div className="relative w-20 h-20 shrink-0 shadow-[0_0_30px_rgba(250,204,21,0.2)]">
            <img src="/wesis-icon.png" alt="WeSIS Logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col">
            <h2 className={cn("font-mitr font-bold text-xl tracking-tighter leading-none", isLightMode ? "text-slate-900" : "text-white")}>
              WESIS
            </h2>
            <p className={cn("text-sm font-prompt font-medium uppercase tracking-widest mt-1", isLightMode ? "text-slate-400" : "text-zinc-500")}>quit together</p>
          </div>
        </Link>
      </div>

      <div className="flex justify-end px-4 mb-6">
        <Link
          to="/notifications"
          className={cn(
            "w-full flex items-center gap-5 px-5 py-4 rounded-2xl transition-all group relative duration-300 active:scale-95",
            pathname === '/notifications'
              ? (isLightMode ? "font-prompt font-medium text-amber-600 bg-amber-50 shadow-inner" : "font-prompt font-medium text-yellow-400 bg-yellow-400/5 shadow-inner")
                  : (isLightMode ? "font-prompt font-medium text-slate-400 hover:bg-slate-100 hover:text-slate-600" : "font-prompt font-medium text-zinc-500 hover:bg-white/5 hover:text-zinc-300")
              )}
        >
          <Bell className="w-6 h-6" />
          <NotificationBadge count={unread} />
          <span className="text-base uppercase tracking-tighter">การแจ้งเตือน</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-3 px-2">
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              to={item.href}
              key={item.id}
              className={cn(
                "w-full flex items-center gap-5 px-5 py-4 rounded-2xl transition-all group relative duration-300 active:scale-95",
                isActive
                  ? (isLightMode ? "font-prompt font-medium text-amber-600 bg-amber-50 shadow-inner" : "font-prompt font-medium text-yellow-400 bg-yellow-400/5 shadow-inner")
                  : (isLightMode ? "font-prompt font-medium text-slate-400 hover:bg-slate-100 hover:text-slate-600" : "font-prompt font-medium text-zinc-500 hover:bg-white/5 hover:text-zinc-300")
              )}
            >
              <Icon
                className={cn(
                  "w-7 h-7 transition-all duration-300",
                  isActive ? "scale-110 stroke-[3px] drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" : "group-hover:scale-110"
                )}
              />
              <span className="text-base uppercase tracking-tighter">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="active-indicator"
                  className={cn("absolute left-[-12px] w-1.5 h-8 rounded-full", isLightMode ? "bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]" : "bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)]")}
                />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-5 px-5 py-4 rounded-2xl text-zinc-600 hover:bg-rose-500/10 hover:text-rose-500 transition-all group font-prompt font-medium text-base"
        >
          <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="tracking-widest">Logout</span>
        </button>
      </div>
    </aside>
  );
}

export function BottomAppNav({ isLightMode }: { isLightMode?: boolean }) {
  const location = useLocation();
  const pathname = location.pathname;
  const { unread } = useUnreadCount();
  const isNotifActive = pathname === '/notifications';

  return (
    <nav className={cn(
      "md:hidden fixed bottom-0 left-0 right-0 h-20 flex items-center justify-around px-4 z-999 pb-2 transition-colors duration-1000",
      isLightMode ? "bg-zinc-50/90 backdrop-blur-2xl border-t border-slate-200 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]" : "bg-black/80 backdrop-blur-2xl border-t border-white/5 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]"
    )}>
      {MENU_ITEMS.filter((item) => item.id !== "notification").map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
        return (
          <Link
            key={item.id}
            to={item.href}
            aria-label={item.label}
            className="flex flex-col items-center justify-center gap-1 w-full h-full relative"
          >
            <div className="relative">
              <Icon
                className={cn(
                  "w-7 h-7 transition-all duration-300",
                  isActive
                    ? (isLightMode ? "text-amber-500 stroke-[3px] scale-110 drop-shadow-[0_0_10px_rgba(245,158,11,0.2)]" : "text-yellow-400 stroke-[3px] scale-110 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]")
                    : (isLightMode ? "text-slate-400" : "text-zinc-600")
                )}
              />
              {isActive && (
                <motion.div
                  layoutId="active-dot"
                  className={cn(
                    "absolute -bottom-3 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(250,204,21,0.6)]",
                    isLightMode ? "bg-amber-500" : "bg-yellow-400"
                  )}
                />
              )}
            </div>
            <span className={cn(
              "font-prompt text-[10px] leading-tight text-center whitespace-nowrap",
              isActive
                ? (isLightMode ? "text-amber-600" : "text-yellow-400")
                : (isLightMode ? "text-slate-500" : "text-zinc-500")
            )}>
              {item.label}
            </span>
          </Link>
        );
      })}

      <Link
        to="/notifications"
        aria-label="การแจ้งเตือน"
        className="flex flex-col items-center justify-center gap-1 w-full h-full relative"
      >
          <Bell
           className={cn(
                  "w-7 h-7 transition-all duration-300",
                  isNotifActive
                    ? (isLightMode ? "text-amber-500 stroke-[3px] scale-110 drop-shadow-[0_0_10px_rgba(245,158,11,0.2)]" : "text-yellow-400 stroke-[3px] scale-110 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]")
                    : (isLightMode ? "text-slate-400" : "text-zinc-600")
                )}
          />
          <NotificationBadge count={unread} />
          <span className={cn(
            "font-prompt text-[10px] leading-tight text-center whitespace-nowrap",
            isNotifActive
              ? (isLightMode ? "text-amber-600" : "text-yellow-400")
              : (isLightMode ? "text-slate-500" : "text-zinc-500")
          )}>
            การแจ้งเตือน
          </span>
      </Link>
    </nav>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, setUser } = useAuthStore();
  usePushNotifications();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate, isMounted]);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      api.get(`/profiles/user/${user.id}`).then(res => {
        const profileData = res.data.data;
        if (profileData) {
          // Sync to auth store so children see the latest stage without logging in again
          setUser({
            ...user,
            currentStage: profileData.currentStage,
            defaultStage: profileData.defaultStage,
            stage4At: profileData.stage4At,
            avatarId: profileData.avatarId,
            type: profileData.type,
            attributes: profileData.attributes
          } as any);
        }
      }).catch(err => {
        console.error("Failed to fetch profile in AppLayout:", err);
      });
    }
  }, [isAuthenticated, user?.id, location.pathname]);

  if (!isMounted || !isAuthenticated || !user) {
    // Never return bare null: bare null + early __WESIS_BOOTED__ looks like
    // a white screen on slow old phones. Render dark placeholder instead.
    return <div className="min-h-screen bg-black" />;
  }

  const isLightMode = (user as any)?.currentStage === 5;
  const isQuestionnaire = location.pathname.startsWith('/questionnaire');

  return (
    <div className={cn(
      "min-h-screen bg-black flex flex-col md:flex-row text-white font-prompt selection:bg-yellow-400 selection:text-black transition-colors duration-1000",
      isLightMode && "bg-zinc-50 text-zinc-950 shadow-inner"
    )}>
      {!isQuestionnaire && <DesktopSidebar isLightMode={isLightMode} />}
      <main className="flex-1 flex flex-col min-h-screen pb-20 md:pb-0 relative">
        <div className={cn("flex-1 mx-auto w-full", isQuestionnaire ? "max-w-full p-0" : "max-w-[800px] p-4")}>
          {children}
        </div>
        {!isQuestionnaire && <BottomAppNav isLightMode={isLightMode} />}
      </main>
      <Suspense fallback={null}>
        <PushOptIn />
      </Suspense>
      <Suspense fallback={null}>
        <NotificationToast />
      </Suspense>
    </div>
  );
}
