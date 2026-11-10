import { useEffect, useState } from 'react'
import api from '../lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import { NotebookPen, Trash2, Send, Smile } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import { cn } from '../lib/utils'

interface DiaryPost {
  id: string
  userId: string
  emoji: string
  label?: string
  message: string
  createdAt: string
}

interface Mood {
  emoji: string
  label: string
}

const MOODS: Mood[] = [
  { emoji: '🙂', label: 'มีความสุข' },
  { emoji: '😇', label: 'ได้รับพร' },
  { emoji: '🥰', label: 'เป็นที่รัก' },
  { emoji: '😔', label: 'เศร้า' },
  { emoji: '🥰', label: 'เบิกบาน' },
  { emoji: '😃', label: 'ขอบคุณ' },
  { emoji: '🤩', label: 'ตื่นเต้น' },
  { emoji: '🥰', label: 'ตกหลุมรัก' },
  { emoji: '🤪', label: 'บ้า' },
  { emoji: '😜', label: 'ขอบคุณ' },
  { emoji: '😊', label: 'สุขใจ' },
  { emoji: '😁', label: 'เยี่ยม' },
  { emoji: '😜', label: 'ไร้สาระ' },
  { emoji: '🎄', label: 'รื่นเริง' },
  { emoji: '🙂', label: 'มหัศจรรย์' },
  { emoji: '😎', label: 'เท่' },
  { emoji: '🙂', label: 'ขำขัน' },
  { emoji: '😌', label: 'ผ่อนคลาย' },
  { emoji: '😌', label: 'คิดบวก' },
  { emoji: '😌', label: 'ชิลล์' },
  { emoji: '🌷', label: 'มีความหวัง' },
  { emoji: '😊', label: 'สนุกสนาน' },
  { emoji: '😴', label: 'เหนื่อย' },
  { emoji: '😉', label: 'มีแรงผลักดัน' },
  { emoji: '😉', label: 'ภูมิใจ' },
  { emoji: '😔', label: 'โดดเดี่ยว' },
  { emoji: '🧐', label: 'คิดหนัก' },
  { emoji: '🆗', label: 'โอเค' },
  { emoji: '🧐', label: 'คิดถึงความหลัง' },
  { emoji: '😡', label: 'โมโห' },
  { emoji: '🤒', label: 'ป่วย' },
  { emoji: '😁', label: 'ปลาบปลื้ม' },
  { emoji: '😩', label: 'เหนื่อยล้า' },
  { emoji: '🥺', label: 'อ่อนไหว' },
  { emoji: '😉', label: 'มั่นใจ' },
  { emoji: '😃', label: 'เยี่ยมมาก' },
  { emoji: '😉', label: 'สดชื่น' },
  { emoji: '😈', label: 'เด็ดเดี่ยว' },
  { emoji: '💧', label: 'อ่อนเพลีย' },
  { emoji: '😡', label: 'รำคาญ' },
  { emoji: '🙂', label: 'ดีใจ' },
  { emoji: '🍀', label: 'โชคดี' },
  { emoji: '💔', label: 'อกหัก' },
  { emoji: '😒', label: 'เบื่อ' },
  { emoji: '😴', label: 'ง่วง' },
  { emoji: '😁', label: 'มีพลัง' },
  { emoji: '😮', label: 'หิว' },
  { emoji: '😉', label: 'เป็นงานเป็นการ' },
  { emoji: '😫', label: 'เจ็บปวด' },
  { emoji: '😌', label: 'สงบ' },
  { emoji: '😔', label: 'ผิดหวัง' },
  { emoji: '😉', label: 'มองโลกในแง่ดี' },
  { emoji: '🥶', label: 'หนาว' },
  { emoji: '🥺', label: 'น่ารัก' },
  { emoji: '😎', label: 'เลิศ' },
  { emoji: '😃', label: 'ดีมาก' },
  { emoji: '😔', label: 'เสียใจ' },
  { emoji: '🦸', label: 'สุดยอด' },
  { emoji: '😟', label: 'กังวล' },
  { emoji: '🤓', label: 'ขำ' },
  { emoji: '😔', label: 'แย่' },
  { emoji: '💡', label: 'มีแรงบันดาลใจ' },
  { emoji: '🙂', label: 'พึงพอใจ' },
  { emoji: '😉', label: 'กระตือรือร้น' },
  { emoji: '😌', label: 'ใจเย็น' },
  { emoji: '❓', label: 'สับสน' },
  { emoji: '😜', label: 'บ๊อง' },
  { emoji: '😏', label: 'ขาดไป' },
  { emoji: '🙂', label: 'ดี' },
  { emoji: '😏', label: 'ประชด' },
  { emoji: '😔', label: 'เหงา' },
  { emoji: '🦸', label: 'เข้มแข็ง' },
  { emoji: '😟', label: 'วิตก' },
  { emoji: '🤩', label: 'พิเศษ' },
  { emoji: '😔', label: 'ซึมเศร้า' },
  { emoji: '😊', label: 'ร่าเริง' },
  { emoji: '💡', label: 'สงสัย' },
  { emoji: '😔', label: 'พลังงานน้อย' },
  { emoji: '🙂', label: 'ยินดี' },
  { emoji: '💔', label: 'ใจสลาย' },
  { emoji: '👸', label: 'สวย' },
  { emoji: '🤩', label: 'อัศจรรย์ใจ' },
  { emoji: '😐', label: 'หงุดหงิด' },
  { emoji: '😔', label: 'เครียด' },
  { emoji: '🌓', label: 'ไม่สมบูรณ์' },
  { emoji: '😜', label: 'ไฮเปอร์' },
  { emoji: '😏', label: 'มีแผนร้าย' },
  { emoji: '😁', label: 'ทึ่ง' },
  { emoji: '😡', label: 'เดือด' },
  { emoji: '😫', label: 'เหนื่อยหน่าย' },
  { emoji: '❓', label: 'ฉงน' },
  { emoji: '🤢', label: 'ฉุนจัด' },
  { emoji: '😡', label: 'ปรี๊ดแตก' },
  { emoji: '🙂', label: 'สดชื่นแจ่มใส' },
  { emoji: '😏', label: 'บรรลุความสำเร็จ' },
  { emoji: '😲', label: 'แปลกใจ' },
  { emoji: '❓', label: 'งงงวย' },
  { emoji: '😔', label: 'คับข้องใจ' },
  { emoji: '😶', label: 'เฉยๆ' },
  { emoji: '🥳', label: 'สวยงาม' },
  { emoji: '🙂', label: 'ดีขึ้น' },
  { emoji: '😔', label: 'ผิด' },
  { emoji: '🔒', label: 'ปลอดภัย' },
  { emoji: '🙂', label: 'อิสระ' },
  { emoji: '❓', label: 'เค้งคว้าง' },
  { emoji: '👵', label: 'แก่' },
  { emoji: '😌', label: 'ขี้เกียจ' },
  { emoji: '😔', label: 'แย่กว่าเก่า' },
  { emoji: '😡', label: 'แย่มาก' },
  { emoji: '🙂', label: 'สบายใจ' },
  { emoji: '😴', label: 'โง่เขลา' },
  { emoji: '😔', label: 'ละอายใจ' },
  { emoji: '😔', label: 'หดหู่' },
  { emoji: '😴', label: 'หลับ' },
  { emoji: '🙂', label: 'สบาย' },
  { emoji: '🙂', label: 'มีชีวิตชีวา' },
  { emoji: '😳', label: 'อาย' },
  { emoji: '😐', label: 'ลำบาก' },
  { emoji: '😮', label: 'ประหลาด' },
  { emoji: '🙂', label: 'เหมือนมนุษย์' },
  { emoji: '😫', label: 'เจ็บ' },
  { emoji: '👅', label: 'เลวร้าย' },
  { emoji: '🙂', label: 'ปกติ' },
  { emoji: '🥰', label: 'อบอุ่น' },
  { emoji: '😶', label: 'ไม่ปลอดภัย' },
  { emoji: '😴', label: 'อ่อนแอ' },
  { emoji: '🙂', label: 'ใจดี' },
  { emoji: '🙂', label: 'สบายดี' },
  { emoji: '😴', label: 'โง่' },
  { emoji: '🙂', label: 'ดีเยี่ยม' },
  { emoji: '😏', label: 'สำคัญ' },
  { emoji: '👅', label: 'เปื่อย' },
  { emoji: '😔', label: 'ไม่สบายใจ' },
  { emoji: '😴', label: 'ไม่มีค่า' },
  { emoji: '🙂', label: 'พร้อม' },
  { emoji: '🤓', label: 'แตกต่าง' },
  { emoji: '😔', label: 'ไร้ที่พึ่ง' },
  { emoji: '😶', label: 'อึดอัดใจ' },
  { emoji: '😵', label: 'เมา' },
  { emoji: '😰', label: 'ตื้นตัน' },
  { emoji: '😔', label: 'หมดหวัง' },
  { emoji: '🙂', label: 'สมบูรณ์' },
  { emoji: '😡', label: 'เป็นทุกข์' },
  { emoji: '😡', label: 'โกรธ' },
  { emoji: '🙂', label: 'ลึกซึ้ง' },
  { emoji: '👅', label: 'แหวะ' },
  { emoji: '😔', label: 'ประหม่ำ' },
  { emoji: '🥶', label: 'เศร้าเสียใจ' },
  { emoji: '🙂', label: 'เป็นที่ต้องการ' },
  { emoji: '🙂', label: 'เป็นเกียรติ' },
  { emoji: '🙂', label: 'เบา' },
  { emoji: '👅', label: 'เมาค้าง' },
  { emoji: '🔒', label: 'มั่นคง' },
  { emoji: '🥳', label: 'ล่อนจ้อน' },
  { emoji: '🙂', label: 'สกปรก' },
  { emoji: '😴', label: 'ไม่สำคัญ' },
  { emoji: '😃', label: 'แข็งแกร่ง' },
  { emoji: '🥶', label: 'กลัว' },
  { emoji: '🤢', label: 'อิจฉา' },
  { emoji: '😫', label: 'เมื่อย' },
  { emoji: '😴', label: 'ไม่เป็นที่ต้องการ' },
  { emoji: '😏', label: 'มีคนเห็นค่า' },
  { emoji: '🙂', label: 'อิ่ม' },
  { emoji: '😶', label: 'ยุ่ง' },
  { emoji: '😶', label: 'ต่ำ' },
  { emoji: '💔', label: 'ไม่ถูกรัก' },
  { emoji: '😔', label: 'ไร้ประโยชน์' },
  { emoji: '😏', label: 'เพรียบพร้อม' },
  { emoji: '👅', label: 'ห่อเหี่ยว' },
  { emoji: '😶', label: 'หมดความอดทน' },
  { emoji: '🚬', label: 'มีสิทธิพิเศษ' },
  { emoji: '😶', label: 'ติดกับ' },
  { emoji: '👅', label: 'กระหายน้ำ' },
  { emoji: '🤒', label: 'คลื่นไส้' },
  { emoji: '😔', label: 'ไม่พอใจ' },
  { emoji: '😡', label: 'เคือง' },
  { emoji: '🥶', label: 'ชา' },
  { emoji: '🤩', label: 'เพอร์เฟ็ค' },
  { emoji: '😏', label: 'ถูกท้าทาย' },
  { emoji: '😰', label: 'ถูกข่มขู่' },
  { emoji: '😌', label: 'โล่งอก' },
  { emoji: '😔', label: 'ติดขัด' },
  { emoji: '😮', label: 'แปลกๆ' },
  { emoji: '😳', label: 'อับอาย' },
  { emoji: '😌', label: 'มีแรง' },
  { emoji: '🤓', label: 'ฉลาด' },
  { emoji: '😔', label: 'ถูกโกง' },
  { emoji: '😔', label: 'โดยหักหลัง' },
  { emoji: '😰', label: 'ร้อนรน' },
  { emoji: '😡', label: 'ขุ่นเคือง' },
  { emoji: '😡', label: 'ใจร้าย' },
  { emoji: '😴', label: 'ถูกละเลย' },
  { emoji: '🥰', label: 'สุขภาพดี' },
  { emoji: '🙂', label: 'ใจกว้าง' },
  { emoji: '🤑', label: 'รวย' },
  { emoji: '🥶', label: 'เกรงกลัว' },
  { emoji: '😵', label: 'ถังแตก' },
  { emoji: '❓', label: 'ล่องหน' },
]

function getMoodLabel(emoji: string): string {
  return MOODS.find((m) => m.emoji === emoji)?.label ?? ''
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'เมื่อสักครู่'
  if (mins < 60) return `${mins} นาทีที่แล้ว`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} วันที่แล้ว`
  return new Date(iso).toLocaleDateString('th-TH')
}

function PostAvatar({ avatarId, size }: { avatarId?: number; size?: string }) {
  return (
    <div className={cn("relative shrink-0", size ?? "w-12 h-12")}>
      <div className={cn("w-full h-full rounded-full")}>
        <div className="w-full h-full rounded-full bg-black overflow-hidden border-2 border-slate-300">
          <img src={`/avatar/${avatarId ?? 1}.jpg`} alt="Avatar" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = "/avatar/1.jpg"; }} />
        </div>
      </div>
    </div>
  )
}

export default function DiaryPage() {
  const { user } = useAuthStore()
  const isLightMode = user?.currentStage === 5

  const [posts, setPosts] = useState<DiaryPost[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [showPicker, setShowPicker] = useState(false)
  const [posting, setPosting] = useState(false)
  const [moodQuery, setMoodQuery] = useState('')

  const selectedMood = MOODS[selectedIdx] ?? MOODS[0]
  const filteredMoods = MOODS.map((m, idx) => ({ ...m, idx })).filter(
    (m) => !moodQuery.trim() || m.label.includes(moodQuery.trim()),
  )

  const loadPosts = () => {
    if (!user?.id) return
    api
      .get(`/diary/user/${user.id}`)
      .then(res => {
        setPosts(res.data.data ?? [])
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load diary posts:', err)
        setLoading(false)
      })
  }

  useEffect(() => {
    loadPosts()
  }, [user?.id])

  const createPost = async () => {
    if (!user?.id || !message.trim() || posting) return
    setPosting(true)
    try {
      const res = await api.post('/diary', {
        userId: user.id,
        emoji: selectedMood.emoji,
        label: selectedMood.label, // ส่ง label ของ mood ที่เลือกไปยัง API
        message: message.trim(),
      })
      setPosts(prev => [res.data.data, ...prev])
      setMessage('')
      setMoodQuery('')
      setShowPicker(false)
    } catch (err) {
      console.error('Failed to create diary post:', err)
    } finally {
      setPosting(false)
    }
  }

  const deletePost = async (id: string) => {
    if (!user?.id) return
    setPosts(prev => prev.filter(p => p.id !== id))
    try {
      await api.delete(`/diary/${id}`, { params: { userId: user.id } })
    } catch (err) {
      console.error('Failed to delete diary post:', err)
      loadPosts()
    }
  }

  return (
    <div className="max-w-md mx-auto  space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 px-2">
        <div className="w-11 h-11 rounded-full bg-yellow-400/10 flex items-center justify-center">
          <NotebookPen className="w-6 h-6 text-yellow-400" />
        </div>
        <h1 className={cn("text-2xl font-black tracking-tight", isLightMode && "text-zinc-900")}>
          บันทึกความรู้สึก
        </h1>
      </div>

      {/* Composer — Instagram style */}
      <div className={cn(
        "rounded-2xl border p-4 transition-colors",
        isLightMode ? "bg-white border-slate-200" : "bg-white/[0.03] border-white/10",
      )}>
        <div className="flex items-start gap-3">
          <PostAvatar avatarId={user?.avatarId} size="w-16 h-16" />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="วันนี้รู้สึกยังไงบ้าง..."
            rows={2}
            maxLength={2000}
            className={cn(
              "flex-1 resize-none bg-transparent outline-none text-sm font-medium placeholder:text-zinc-500 pt-2.5",
              isLightMode ? "text-zinc-900" : "text-white",
            )}
          />
        </div>

        <AnimatePresence>
          {showPicker && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className={cn(
                "mt-3 rounded-xl border p-2",
                isLightMode ? "bg-slate-50 border-slate-200" : "bg-black/40 border-white/10",
              )}>
                <input
                  value={moodQuery}
                  onChange={(e) => setMoodQuery(e.target.value)}
                  placeholder="ค้นหาความรู้สึก... เช่น สุข เศร้า โกรธ"
                  className={cn(
                    "w-full mb-2 px-3 py-2 rounded-lg text-sm font-medium bg-transparent outline-none border",
                    isLightMode
                      ? "border-slate-200 text-zinc-900 placeholder:text-slate-400"
                      : "border-white/10 text-white placeholder:text-zinc-500",
                  )}
                />
                <div className="max-h-72 overflow-y-auto flex flex-wrap gap-1.5 pr-1">
                  {filteredMoods.length === 0 ? (
                    <p className={cn(
                      "w-full text-center text-sm font-medium py-6",
                      isLightMode ? "text-slate-400" : "text-zinc-500",
                    )}>
                      ไม่เจอความรู้สึกที่ค้นหา
                    </p>
                  ) : filteredMoods.map((m) => (
                    <button
                      key={`${m.emoji}-${m.label}-${m.idx}`}
                      onClick={() => setSelectedIdx(m.idx)}
                      title={m.label}
                      className={cn(
                        "min-w-14 px-2 py-1.5 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all active:scale-90",
                        selectedIdx === m.idx
                          ? (isLightMode ? "bg-amber-100 ring-2 ring-amber-400" : "bg-yellow-400/15 ring-2 ring-yellow-400")
                          : "hover:bg-white/10",
                      )}
                    >
                      <span className="text-2xl leading-none">{m.emoji}</span>
                      <span className={cn(
                        "text-[11px] font-bold leading-tight",
                        isLightMode ? "text-zinc-700" : "text-zinc-300",
                      )}>
                        {m.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
          <button
            onClick={() => setShowPicker(v => !v)}
            className="flex items-center gap-1.5 text-sm font-bold text-zinc-400 hover:text-yellow-400 transition-colors px-2 py-1.5 active:scale-95"
          >
            <Smile className="w-5 h-5" />
            {selectedMood ? `${selectedMood.emoji} ${selectedMood.label}` : 'เลือกอารมณ์'}
          </button>
          <button
            onClick={createPost}
            disabled={!message.trim() || posting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-yellow-400 text-black text-sm font-black disabled:opacity-30 hover:bg-yellow-300 active:scale-95 transition-all"
          >
            <Send className="w-4 h-4" />
            โพสต์
          </button>
        </div>
      </div>

      {/* Feed */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          <p className={cn("mt-4 font-medium", isLightMode ? "text-slate-500" : "text-zinc-400")}>รอแป๊บนึงนะจ๊ะ...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className={cn("p-6 rounded-full mb-4", isLightMode ? "bg-slate-100" : "bg-white/5")}>
            <NotebookPen className="size-10 text-zinc-500" />
          </div>
          <h2 className={cn("text-lg font-bold mb-1", isLightMode ? "text-zinc-900" : "text-white")}>
            ยังไม่มีบันทึก
          </h2>
          <p className={cn("text-sm", isLightMode ? "text-slate-500" : "text-zinc-500")}>
            เขียนเรื่องราวแรกของวันนี้ด้านบนเลยจ้ะ
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post, i) => {
            const displayLabel = post.label || getMoodLabel(post.emoji)
            return (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
                className={cn(
                  "rounded-2xl border overflow-hidden transition-colors",
                  isLightMode ? "bg-white border-slate-200" : "bg-white/[0.03] border-white/10",
                )}
              >
                {/* Post header */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <PostAvatar avatarId={user?.avatarId} size="w-11 h-11" />
                  <div className="flex-1 min-w-0">
                    <p className={cn("font-bold text-sm leading-tight", isLightMode ? "text-zinc-900" : "text-white")}>
                      {user?.name || user?.email?.split('@')[0] || 'ฉัน'}
                    </p>
                    <p className={cn("text-xs", isLightMode ? "text-slate-400" : "text-zinc-500")}>
                      {timeAgo(post.createdAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => deletePost(post.id)}
                    aria-label="Delete post"
                    className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90",
                      isLightMode ? "text-slate-400 hover:bg-rose-50 hover:text-rose-500" : "text-zinc-600 hover:bg-rose-500/10 hover:text-rose-500",
                    )}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Post body */}
                <div className={cn("px-4 pb-4 select-none")}>
                  <p className={cn(
                    "whitespace-pre-wrap break-words text-[15px] leading-relaxed font-medium",
                    isLightMode ? "text-zinc-800" : "text-zinc-100",
                  )}>
                    {post.message}
                  </p>
                </div>

                {/* Feeling bar — mood chosen when posting */}
                <div className={cn("px-4 py-2.5 flex items-center gap-2 border-t", isLightMode ? "border-slate-100" : "border-white/5")}>
                  <motion.span
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full leading-none",
                      isLightMode ? "bg-amber-50" : "bg-yellow-400/10",
                    )}
                  >
                    <span className="text-lg">{post.emoji}</span>
                    {displayLabel && (
                      <span className={cn(
                        "text-xs font-bold",
                        isLightMode ? "text-zinc-700" : "text-zinc-200",
                      )}>
                        กำลังรู้สึก{displayLabel}
                      </span>
                    )}
                  </motion.span>
                </div>
              </motion.article>
            )
          })}
        </div>
      )}
    </div>
  )
}