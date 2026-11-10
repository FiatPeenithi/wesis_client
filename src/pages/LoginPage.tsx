import { useState, useEffect, useRef } from 'react'
import { useGoogleLogin } from '@react-oauth/google'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { useAuthStore } from '../store/useAuthStore'
import { motion, AnimatePresence } from 'framer-motion'
import { KeyRound, Mail, ChevronLeft, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react'
import { detectInAppBrowser, redirectToExternalBrowser } from '../lib/inAppBrowser'
import { consumePendingRoute } from '../lib/pendingRoute'

function getPolicyConsent() {
  try {
    const consent = JSON.parse(localStorage.getItem('wesis_consent_details') || 'null')
    if (consent?.policy1 && consent?.policy2 && consent?.policy3 && consent?.policy4) return consent
  } catch { /* Consent is optional for returning sessions that already completed the policy flow. */ }
  return undefined
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { user, setUser, isAuthenticated } = useAuthStore()
  const [inAppInfo] = useState(() => detectInAppBrowser())
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (inAppInfo.isInApp) {
      redirectToExternalBrowser(inAppInfo)
    }
  }, [inAppInfo])

  // PIN Login State
  const [loginMode, setLoginMode] = useState<'google' | 'pin'>('google')
  const [pinStep, setPinStep] = useState<1 | 2>(1)
  const [email, setEmail] = useState('')
  const [pin, setPin] = useState('')
  const pinInputs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      api.get(`/auth/progress/${user.id}`).then(res => {
        const progress = res.data.data
        const redirectTo = progress.redirectTo || '/dashboard/'
        const pendingRoute = progress.step === 'complete' ? consumePendingRoute() : null
        navigate(pendingRoute || redirectTo)
      })
    }
  }, [isAuthenticated, user?.id, navigate])

  const handleGoogleLogin = useGoogleLogin({
    flow: 'auth-code',
    onSuccess: async (codeResponse) => {
      setStatus('loading')
      try {
        const response = await api.post('/auth/google', { code: codeResponse.code, consent: getPolicyConsent() })
        const userData = response.data.data
        handleLoginSuccess(userData)
      } catch (err: any) {
        handleLoginError(err)
      }
    },
    onError: () => {
      setStatus('error')
      setMessage('Google Login Failed')
    },
  })

  const handlePinLogin = async () => {
    if (pin.length !== 6) return
    setStatus('loading')
    try {
      const response = await api.post('/auth/pin', { email, pin, consent: getPolicyConsent() })
      const userData = response.data.data
      handleLoginSuccess(userData)
    } catch (err: any) {
      handleLoginError(err)
      setPin('')
    }
  }

  const handleLoginSuccess = (userData: any) => {
    setStatus('success')
    setMessage('เข้าสู่ระบบ WESIS สำเร็จ!')
    setTimeout(() => {
      const normalizedUser = {
        ...userData,
        currentStage: userData.currentStage ?? userData.profile?.currentStage,
        defaultStage: userData.defaultStage ?? userData.profile?.defaultStage,
        stage4At: userData.stage4At ?? userData.profile?.stage4At,
        avatarId: userData.avatarId ?? userData.profile?.avatarId,
        type: userData.type ?? userData.profile?.type,
        attributes: userData.attributes ?? userData.profile?.attributes,
      }
      setUser(normalizedUser)
      localStorage.setItem('wesis_user', JSON.stringify(normalizedUser))
    }, 1500)
  }

  const handleLoginError = (err: any) => {
    console.error(err)
    setStatus('error')
    setMessage(err.response?.data?.error?.message || err.response?.data?.message || 'เกิดข้อผิดพลาดในการยืนยันตัวตน')
  }

  const handlePinInput = (index: number, value: string) => {
    const val = value.replace(/[^0-9]/g, '').slice(0, 1)
    const newPin = pin.split('')
    newPin[index] = val
    const pinStr = newPin.join('')
    setPin(pinStr)

    if (val && index < 5) {
      pinInputs.current[index + 1]?.focus()
    }

    if (pinStr.length === 6 && val) {
      // Auto submit or wait for button? Let's use the button for clarity but allow auto-trigger
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      pinInputs.current[index - 1]?.focus()
    }
  }

  if (inAppInfo.isInApp) {
    return null
  }

  return (
    <div className="min-h-dvh bg-black flex items-center justify-center font-prompt selection:bg-yellow-400 selection:text-black overflow-hidden relative">

      {/* Success Toast */}
      <AnimatePresence>
        {status === 'success' && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-50 px-6 py-4 bg-emerald-500/90 text-white rounded-full shadow-2xl shadow-emerald-500/20 backdrop-blur-md flex items-center gap-3 font-bold border border-emerald-400/50"
          >
            <ShieldCheck className="w-5 h-5" />
            {message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cinematic Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-yellow-400/5 blur-[120px] rounded-full" />
        {[200, 350, 500, 650, 800].map((size, i) => (
          <div
            key={size}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/5"
            style={{ width: size, height: size, opacity: 1 - i * 0.15 }}
          />
        ))}
      </div>

      <div className="w-full max-w-[420px] h-dvh flex flex-col items-center relative z-10 px-6 pt-12 pb-10 justify-between">

        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center space-y-4"
        >
          <img src="/wesis-icon.png" alt="WESIS" className="w-24 h-24 object-contain drop-shadow-[0_0_20px_rgba(250,204,21,0.4)]" />
          <h2 className="text-lg font-bold text-yellow-400 tracking-tighter leading-tight uppercase px-4">
            พี่จริงใจอาสา..<br />พาทวงคืนชีวิตไร้ควัน
          </h2>
        </motion.div>

        {/* Hero / Mascot Section (Smaller if in PIN mode) */}
        <div className="flex-1 flex flex-col items-center justify-center relative w-full overflow-hidden">
          <AnimatePresence mode="wait">
            {loginMode === 'google' ? (
              <motion.div
                key="mascot"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute bottom-0 w-full pointer-events-none z-0"
              >
                <img src="/model/model1.png" alt="Mascot" className="w-full h-64 object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]" />
              </motion.div>
            ) : (
              <motion.div
                key="pin-form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full p-8 bg-zinc-900 shadow-2xl border border-white/5 rounded-[2.5rem] relative z-10"
              >
                <button
                  onClick={() => {
                    if (pinStep === 2) setPinStep(1)
                    else setLoginMode('google')
                  }}
                  className="absolute top-6 left-6 p-2 rounded-full bg-white/5 text-zinc-500 hover:text-white transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="pt-6 space-y-6">
                  <div className="space-y-2 text-center">
                    <h3 className="text-2xl font-bold text-white">
                      {pinStep === 1 ? 'เข้าสู่ระบบด้วย PIN' : 'ระบุรหัสผ่าน PIN'}
                    </h3>
                    <p className="text-sm text-zinc-500">
                      {pinStep === 1 ? 'กรอกอีเมลที่คุณใช้เชื่อมต่อกับ WESIS' : 'กรอกรหัส PIN 6 หลักเพื่อดำเนินการต่อ'}
                    </p>
                  </div>

                  {pinStep === 1 ? (
                    <div className="space-y-4">
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-yellow-400 transition-colors" />
                        <input
                          type="email"
                          placeholder="อีเมลของคุณ..."
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-700 outline-none focus:border-yellow-400 focus:bg-black/60 transition-all"
                        />
                      </div>
                      <button
                        onClick={() => email.includes('@') && setPinStep(2)}
                        disabled={!email.includes('@')}
                        className="w-full h-14 bg-yellow-400 hover:bg-yellow-300 disabled:bg-zinc-800 disabled:text-zinc-600 text-black rounded-2xl flex items-center justify-center gap-2 font-bold transition-all active:scale-95"
                      >
                        ยืนยันอีเมล <ArrowRight className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex justify-center gap-2">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <input
                            key={i}
                            ref={el => { pinInputs.current[i] = el }}
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={1}
                            value={pin[i] || ''}
                            onChange={(e) => handlePinInput(i, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(i, e)}
                            className="w-10 h-14 bg-black border border-white/10 rounded-xl text-center text-2xl font-bold text-yellow-400 outline-none focus:border-yellow-400 transition-all placeholder:text-zinc-800"
                            style={{ WebkitTextSecurity: 'disc' } as any}
                            autoFocus={i === 0}
                          />
                        ))}
                      </div>
                      <button
                        onClick={handlePinLogin}
                        disabled={pin.length !== 6 || status === 'loading' || status === 'success'}
                        className="w-full h-16 bg-yellow-400 hover:bg-yellow-300 disabled:bg-zinc-800 disabled:text-zinc-600 text-black rounded-2xl flex items-center justify-center gap-2 font-bold transition-all active:scale-95 shadow-lg shadow-yellow-400/20"
                      >
                        {status === 'loading' ? <Loader2 className="w-6 h-6 animate-spin" /> : <><ShieldCheck className="w-6 h-6" /> เข้าสู่ระบบ</>}
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer / Login Actions */}
        <div className="w-full flex flex-col items-center space-y-4">
          <AnimatePresence mode="wait">
            {status === 'error' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="w-full p-4 border text-sm font-medium text-center rounded-2xl bg-rose-500/10 border-rose-500/20 text-rose-500"
              >
                {message}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {loginMode === 'google' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full space-y-3"
              >
                <button
                  onClick={() => handleGoogleLogin()}
                  disabled={status === 'loading' || status === 'success'}
                  className="w-full h-16 bg-white hover:bg-zinc-100 text-black rounded-2xl flex items-center justify-center gap-4 font-bold text-xl uppercase transition-all active:scale-95 disabled:opacity-50 shadow-2xl relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-yellow-400/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-7 h-7">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    <path fill="none" d="M0 0h48v48H0z" />
                  </svg>
                  <span className="relative z-10">{status === 'loading' ? 'Loading...' : 'Login with Google'}</span>
                </button>

                <button
                  onClick={() => setLoginMode('pin')}
                  className="w-full h-14 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 rounded-2xl flex items-center justify-center gap-3 font-medium transition-all active:scale-95 border border-white/5"
                >
                  <KeyRound className="w-5 h-5" />
                  <span>เข้าสู่ระบบด้วย PIN</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-sm text-zinc-600 font-medium uppercase tracking-widest text-center mt-2">
            ข้อมูลจะถูกเก็บเป็นความลับและใช้ในงานวิจัยเท่านั้น
          </p>
        </div>
      </div>
    </div>
  )
}
