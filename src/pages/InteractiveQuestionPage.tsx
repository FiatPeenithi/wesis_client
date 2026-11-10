import { useState, useEffect } from "react"
import { useParams, useSearchParams, useNavigate } from "react-router-dom"
import api, { baseURL } from "../lib/api"
import { motion } from "framer-motion"
import { MessageCircle, ArrowRight } from "lucide-react"
import { useAuthStore } from "../store/useAuthStore"
import { cn } from "../lib/utils"

export default function InteractiveQuestionPage() {
  const { user } = useAuthStore()
  const currentStage = user?.currentStage || 1
  const isLightMode = currentStage >= 5
  
  const { messageKey } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')
  const nid = searchParams.get('nid')

  const effectiveToken = token || (user?.id && user?.email
    ? btoa(JSON.stringify({ userId: user.id, email: user.email }))
    : null)

  // Mark the originating notification as read when opened from a push notification
  useEffect(() => {
    if (!nid || !user?.id) return
    api.post(`/notifications/${nid}/read`, { userId: user.id }).catch(err => {
      console.warn("Failed to mark notification as read:", err)
    })
  }, [nid, user?.id])

  const [question, setQuestion] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!messageKey) return
    api.get(`/question-sets/item/${messageKey}`)
      .then(res => {
        setQuestion(res.data.data)
        setLoading(false)
      })
      .catch(err => {
        console.error("Failed to fetch interactive question:", err)
        setError("ไม่พบข้อมูลชุดคำถามจ้ะ")
        setLoading(false)
      })
  }, [messageKey])

  const handleChoice = async (index: number) => {
    if (!effectiveToken || !messageKey || submitting) return
    setSubmitting(true)
    try {
      // Use format=json so the backend returns { redirect: "/path?..." }
      // instead of a 302. Browsers block cross-origin 302 redirects in
      // fetch(), which caused NEXT / GOTO_MESSAGE / SET_STAGE to silently fail.
      const actionUrl = `${baseURL}/question-sets/action?token=${effectiveToken}&messageKey=${messageKey}&choiceIndex=${index}&format=json`
      const res = await fetch(actionUrl)
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const data = await res.json()
      if (data?.redirect) {
        // data.redirect may be an absolute URL (from FRONTEND_URL env);
        // extract just path+search so React Router stays in SPA mode.
        try {
          const parsed = new URL(data.redirect)
          navigate(parsed.pathname + parsed.search)
        } catch {
          // Already a relative path
          navigate(data.redirect)
        }
      }
    } catch (err) {
      console.error('Failed to submit choice:', err)
      setError('เกิดข้อผิดพลาดในการส่งคำตอบ กรุณาลองใหม่อีกครั้งจ้ะ')
    } finally {
      setSubmitting(false)
    }
  }


  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
       <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
       <p className="mt-4 text-zinc-400 font-medium">รอแป๊บนึงนะจ๊ะ...</p>
    </div>
  )

  if (error || !question) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 text-center">
       <div className="bg-rose-500/10 p-4 rounded-full mb-4">
         <MessageCircle className="size-10 text-rose-500" />
       </div>
       <h1 className="text-2xl font-bold mb-2">อุ๊ย! มีบางอย่างผิดพลาด</h1>
       <p className="text-zinc-400 mb-6">{error || "หาข้อมูลไม่เจอจ้ะ"}</p>
       <button onClick={() => navigate('/dashboard')} className="px-8 py-3 bg-white/5 rounded-2xl font-bold">กลับหน้าหลัก</button>
    </div>
  )

  const buttons = (question.buttons as any[]) || []

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className={cn(
          "max-w-md w-full backdrop-blur-2xl rounded-[2.5rem] p-10 relative overflow-hidden shadow-2xl",
          isLightMode ? "bg-white border-slate-200" : "bg-white/5 border-white/10"
        )}
      >
        {/* Glow */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-yellow-400/10 blur-[60px] rounded-full" />
        
        <div className="relative space-y-8">
          <div className="flex items-center gap-4">
             <div className="w-14 h-14 rounded-full bg-yellow-400 flex items-center justify-center text-black font-black text-2xl shadow-lg shadow-yellow-400/20">
               W
             </div>
             <div>
               <h3 className="font-black text-lg">พี่จริงใจ</h3>
               <p className="text-sm uppercase tracking-widest text-yellow-400/80 font-bold">WESIS Assistant</p>
             </div>
          </div>

          <div className={cn(
            "rounded-3xl p-6 relative",
            isLightMode ? "bg-slate-50 border border-slate-100" : "bg-white/5 border border-white/5"
          )}>
            <div className={cn(
              "absolute -left-2 top-6 w-4 h-4 border-l border-t -rotate-45",
              isLightMode ? "bg-slate-50 border-slate-100" : "bg-[#1a1a1a] border-white/10"
            )} />
            <div 
              className={cn(
                "text-base",
                isLightMode ? "text-slate-700" : "text-white"
              )}
              dangerouslySetInnerHTML={{ __html: question.question }}
            />
          </div>

          <div className="grid gap-3 pt-4">
            {buttons.length > 0 ? (
              buttons.map((btn: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => handleChoice(idx)}
                  disabled={submitting}
                  className="w-full py-5 rounded-2xl flex items-center justify-between px-8 font-black text-base uppercase tracking-widest transition-all hover:-translate-y-0.5 active:translate-y-px group shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ 
                    backgroundColor: btn.color || (isLightMode ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.05)'), 
                    color: btn.color ? 'black' : (isLightMode ? '#334155' : 'white'),
                    boxShadow: btn.color ? `0 4px 0 ${btn.color}88` : (isLightMode ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'),
                    border: !btn.color && isLightMode ? '1px solid #e2e8f0' : 'none'
                  }}
                >
                  {btn.label}
                  <ArrowRight className="size-5 opacity-50 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                </button>
              ))
            ) : (
                <>
                  <button 
                    onClick={() => handleChoice(0)}
                    disabled={submitting}
                    className="w-full py-5 bg-emerald-500 text-black rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {question.acceptChoice || 'ตกลง'}
                  </button>
                  <button 
                    onClick={() => handleChoice(1)}
                    disabled={submitting}
                    className={cn(
                      "w-full py-5 rounded-2xl font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed",
                      isLightMode 
                        ? "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200" 
                        : "bg-white/5 border border-white/10 text-white hover:bg-white/10"
                    )}
                  >
                    {question.denyChoice || 'ยังไม่แน่ใจ'}
                  </button>
                </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
