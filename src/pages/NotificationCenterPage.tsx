import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../lib/api"
import { motion } from "framer-motion"
import {
  Bell,
  ArrowRight,
  MessageCircle,
} from "lucide-react"
import { useAuthStore } from "../store/useAuthStore"
import { cn } from "../lib/utils"

interface PushLog {
  id: string
  title: string
  body: string
  url?: string | null
  tag?: string | null
  sentAt: string
  clickedAt?: string | null
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)

  if (mins < 1) return "เมื่อสักครู่"
  if (mins < 60) return `${mins} นาทีที่แล้ว`

  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`

  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} วันที่แล้ว`

  return new Date(iso).toLocaleDateString("th-TH")
}

function decodeHtmlEntities(value: string): string {
  const textarea = document.createElement("textarea")
  textarea.innerHTML = value
  return textarea.value
}

export default function NotificationCenterPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [pushHistory, setPushHistory] = useState<PushLog[]>([])
  const [loading, setLoading] = useState(true)

  const userId = user?.id ?? null

  useEffect(() => {
    if (!userId) return

    let active = true

    api
      .get(`/push/history/${userId}`)
      .then((res) => {
        if (active) {
          setPushHistory(res.data.data ?? [])
          setLoading(false)
        }
      })
      .catch((err) => {
        console.error("Failed to load push history:", err)

        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [userId])

  const openNotification = async (notification: PushLog) => {
    // Optimistic update to change status from Not Clicked ("ยังไม่กด") to Clicked ("กดแล้ว")
    setPushHistory((prev) =>
      prev.map((item) =>
        item.id === notification.id
          ? {
              ...item,
              clickedAt: item.clickedAt ?? new Date().toISOString(),
            }
          : item
      )
    )

    // บันทึกว่าผู้ใช้กด notification แล้ว
    try {
      await api.post('/push/clicked', {
        logId: notification.id,
        userId: user?.id,
      })
    } catch (err) {
      console.error("Failed to mark push notification as clicked:", err)
    }

    if (notification.url) {
      navigate(notification.url)
    }
  }

  return (
    <div className="max-w-md mx-auto py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 px-2">
        <div className="w-11 h-11 rounded-full bg-yellow-400/10 flex items-center justify-center">
          <Bell className="w-6 h-6 text-yellow-400" />
        </div>

        <h1 className="text-2xl font-black tracking-tight">
          การแจ้งเตือน
        </h1>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-zinc-400 font-medium">
            รอแป๊บนึงนะจ๊ะ...
          </p>
        </div>
      ) : pushHistory.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="bg-white/5 p-6 rounded-full mb-5">
            <Bell className="size-12 text-zinc-600" />
          </div>

          <h2 className="text-xl font-bold mb-2">
            ยังไม่มีการแจ้งเตือน
          </h2>

          <p className="text-zinc-500">
            ข้อความใหม่จากพี่จริงใจจะแสดงที่นี่จ้ะ
          </p>
        </div>
      ) : (
        /* Notification History */
        <div className="space-y-3">
          {pushHistory.map((notification, i) => {
            const clicked = !!notification.clickedAt
            const clickable = !!notification.url
            const title = decodeHtmlEntities(notification.title)
            const body = decodeHtmlEntities(notification.body)

            return (
              <motion.button
                key={notification.id}
                type="button"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => openNotification(notification)}
                className={cn(
                  "w-full text-left rounded-2xl p-5 flex items-start gap-4 border transition-all cursor-pointer",
                  "active:scale-[0.98]",
                  clicked
                    ? "bg-white/[0.03] border-white/5 opacity-70"
                    : "bg-yellow-400/[0.06] border-yellow-400/20 shadow-lg shadow-yellow-400/5 hover:border-yellow-400/40"
                )}
              >
                {/* Icon */}
                <div
                  className={cn(
                    "w-10 h-10 rounded-full shrink-0 flex items-center justify-center",
                    clicked
                      ? "bg-white/5 text-zinc-500"
                      : "bg-yellow-400 text-black"
                  )}
                >
                  <MessageCircle className="w-5 h-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={cn(
                        "font-bold",
                        !clicked && "text-yellow-400"
                      )}
                    >
                      {title}
                    </p>

                    {!clicked && (
                      <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 shrink-0 mt-1.5" />
                    )}
                  </div>

                  <p className="text-sm text-zinc-400 mt-1 line-clamp-2 leading-relaxed whitespace-pre-line">
                    {body}
                  </p>

                  <div className="flex items-center gap-3 mt-2">
                    <p className="text-xs text-zinc-600">
                      {timeAgo(notification.sentAt)}
                    </p>

                    <span
                      className={cn(
                        "text-xs font-bold px-2 py-0.5 rounded-full",
                        clicked
                          ? "bg-white/5 text-zinc-500"
                          : "bg-yellow-400/15 text-yellow-400"
                      )}
                    >
                      {clicked ? "กดแล้ว" : "ยังไม่กด"}
                    </span>
                  </div>
                </div>

                {/* Arrow */}
                {clickable && (
                  <ArrowRight
                    className={cn(
                      "w-5 h-5 shrink-0 mt-1",
                      clicked ? "text-zinc-600" : "text-yellow-400/60"
                    )}
                  />
                )}
              </motion.button>
            )
          })}
        </div>
      )}
    </div>
  )
}
