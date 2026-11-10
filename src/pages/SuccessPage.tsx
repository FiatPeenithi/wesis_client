import { useSearchParams, useNavigate } from 'react-router-dom'
import { CheckCircle2, Home, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuthStore } from '../store/useAuthStore'
import { cn } from '../lib/utils'

export default function SuccessPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const message = searchParams.get('message') || 'ขอบคุณสำหรับการตอบกลับจ้ะ'
  const target = searchParams.get('target')

  
  const { user } = useAuthStore()
  const isLightMode = (user?.currentStage || 1) >= 5
  
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "max-w-md w-full rounded-[2.5rem] p-6 text-center space-y-6 relative overflow-hidden backdrop-blur-xl shadow-2xl",
          isLightMode ? "bg-white border-slate-200" : "bg-white/5 border-white/10"
        )}
      >
        {/* Decorative background glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-[80px]" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-yellow-500/10 rounded-full blur-[80px]" />

        <div className="flex justify-center relative">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.2 }}
            className="bg-emerald-500/20 p-6 rounded-full border border-emerald-500/30"
          >
            <CheckCircle2 className="size-16 text-emerald-400" />
          </motion.div>
        </div>
        
        <div className="space-y-3 relative">
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className={cn("text-lg font-bold tracking-tight", isLightMode ? "text-slate-900" : "text-white")}
          >
            สำเร็จแล้วจ้ะ!
          </motion.h1>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className={cn(
              "text-lg leading-relaxed font-normal py-4 px-6 rounded-2xl border italic",
              isLightMode ? "bg-slate-50 border-slate-100 text-slate-600" : "text-zinc-400 bg-white/5 border-white/5"
            )}
            dangerouslySetInnerHTML={{ __html: message }}
          />
        </div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="pt-4 flex flex-col gap-4 relative"
        >
          {target ? (
            <button 
              className="w-full h-14 text-lg font-bold bg-yellow-400 text-black rounded-2xl gap-3 flex items-center justify-center uppercase tracking-widest shadow-[0_8px_0_rgb(202,138,4)] hover:shadow-[0_4px_0_rgb(202,138,4)] hover:translate-y-[4px] active:translate-y-[8px] active:shadow-none transition-all duration-75"
              onClick={() => navigate(target)}
            >
              ไปยังหน้าถัดไป <ArrowRight className="size-6" />
            </button>
          ) : (
            <button 
              className={cn(
                "w-full h-14 text-lg font-bold rounded-2xl gap-3 flex items-center justify-center uppercase tracking-widest transition-all",
                isLightMode 
                  ? "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200" 
                  : "bg-white/5 border border-white/10 text-white hover:bg-white/10 active:scale-[0.98]"
              )}
              onClick={() => navigate('/dashboard')}
            >
              <Home className="size-6" /> กลับหน้าหลัก
            </button>
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}
