import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { cn } from "../lib/utils";

interface AppNotification {
  id: string;
  title: string;
  body: string;
  url?: string | null;
  readAt?: string | null;
  createdAt: string;
}

const POLL_MS = 30000;
const TOAST_DURATION_MS = 8000;

export function NotificationToast() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const userId = user?.id ?? null;
  const [current, setCurrent] = useState<AppNotification | null>(null);
  const lastSeenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!userId) {
      lastSeenRef.current = null;
      return;
    }
    let active = true;

    const poll = () => {
      api
        .get(`/notifications/user/${userId}`)
        .then((res) => {
          if (!active) return;
          const items: AppNotification[] = res.data.data ?? [];
          const newest = items[0];
          if (!newest) return;

          // First poll: seed lastSeen without toasting existing history.
          if (lastSeenRef.current === null) {
            lastSeenRef.current = newest.createdAt;
            return;
          }

          // Only toast genuinely new notifications (newer than last seen).
          if (new Date(newest.createdAt).getTime() > new Date(lastSeenRef.current).getTime()) {
            lastSeenRef.current = newest.createdAt;
            if (!newest.readAt) {
              setCurrent(newest);
            }
          }
        })
        .catch(() => {});
    };

    poll();
    const interval = setInterval(poll, POLL_MS);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [userId]);

  // Auto-dismiss after a few seconds.
  useEffect(() => {
    if (!current) return;
    const t = setTimeout(() => setCurrent(null), TOAST_DURATION_MS);
    return () => clearTimeout(t);
  }, [current]);

  const openToast = () => {
    const n = current;
    setCurrent(null);
    if (!n) return;
    if (userId && n.id) {
      api.post(`/notifications/${n.id}/read`, { userId }).catch(() => {});
    }
    if (n.url) {
      navigate(n.url);
    }
  };

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          initial={{ opacity: 0, y: -60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -60, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[999] w-[92%] max-w-[400px]"
        >
          <div
            className={cn(
              "relative rounded-2xl p-5 flex items-start gap-4 border shadow-2xl cursor-pointer backdrop-blur-md",
              "bg-zinc-900/95 border-yellow-400/30 hover:border-yellow-400/60"
            )}
            onClick={openToast}
          >
            <div className="w-10 h-10 rounded-full bg-yellow-400 text-black flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-yellow-400">{current.title || "การแจ้งเตือนใหม่"}</p>
              <p className="text-sm text-zinc-300 mt-1 line-clamp-2 leading-relaxed whitespace-pre-line">
                {current.body}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrent(null);
              }}
              className="shrink-0 text-zinc-500 hover:text-zinc-200 transition-colors"
              aria-label="ปิด"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
