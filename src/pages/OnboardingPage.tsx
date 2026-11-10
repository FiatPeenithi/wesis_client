import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { Check, ChevronRight, Loader2, Phone, MessageSquare, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from '../store/useAuthStore'
import { consumePendingRoute } from '../lib/pendingRoute'
import { cn } from '../lib/utils'


const AVATARS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

type ContactType = 'LINE' | 'PHONE'

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [contactType, setContactType] = useState<ContactType>('LINE')
  const [contactValue, setContactValue] = useState('')
  const [convenientTime, setConvenientTime] = useState('สะดวกทุกเวลา')


  const [pin, setPin] = useState(['', '', '', '', '', ''])
  const [confirmPin, setConfirmPin] = useState(['', '', '', '', '', ''])
  const [pinStep, setPinStep] = useState<'set' | 'confirm'>('set')

  const [selectedAvatar, setSelectedAvatar] = useState<number | null>(null)

  useEffect(() => {
    if (!user?.id) {
      navigate('/login')
    }
  }, [user?.id, navigate])

  const handlePinInput = (index: number, value: string, isConfirm = false) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 6).split('')
      const filled = [...Array(6)].map((_, i) => digits[i] || '')
      isConfirm ? setConfirmPin(filled) : setPin(filled)
      const lastIdx = Math.min(digits.length, 5)
      setTimeout(() => {
        document.getElementById(`${isConfirm ? 'confirm' : 'pin'}-${lastIdx}`)?.focus()
      }, 0)
      return
    }

    if (!/^\d?$/.test(value)) return
    const target = isConfirm ? [...confirmPin] : [...pin]
    target[index] = value
    isConfirm ? setConfirmPin(target) : setPin(target)

    if (value && index < 5) {
      setTimeout(() => {
        document.getElementById(`${isConfirm ? 'confirm' : 'pin'}-${index + 1}`)?.focus()
      }, 0)
    }
  }

  const handlePinKeyDown = (e: React.KeyboardEvent, index: number, isConfirm = false) => {
    if (e.key === 'Backspace') {
      const target = isConfirm ? [...confirmPin] : [...pin]
      if (!target[index] && index > 0) {
        const prev = document.getElementById(`${isConfirm ? 'confirm' : 'pin'}-${index - 1}`)
        prev?.focus()
      }
    }
  }

  const validateStep = (): boolean => {
    setError(null)
    if (step === 1) {
      if (!contactValue.trim()) {
        setError(contactType === 'LINE' ? 'กรุณากรอก LINE ID' : 'กรุณากรอกเบอร์โทรศัพท์')
        return false
      }
      if (contactType === 'PHONE' && !/^0\d{8,9}$/.test(contactValue.trim())) {
        setError('เบอร์โทรศัพท์ไม่ถูกต้อง (เช่น 0812345678)')
        return false
      }
      return true
    }
    if (step === 2) {
      const pinStr = pin.join('')
      const confirmStr = confirmPin.join('')
      if (pinStep === 'set') {
        if (pinStr.length !== 6) {
          setError('กรุณากรอก PIN ให้ครบ 6 หลัก')
          return false
        }
        setPinStep('confirm')
        return false
      }
      if (confirmStr.length !== 6) {
        setError('กรุณายืนยัน PIN ให้ครบ 6 หลัก')
        return false
      }
      if (pinStr !== confirmStr) {
        setError('PIN ไม่ตรงกัน กรุณาลองใหม่')
        setConfirmPin(['', '', '', '', '', ''])
        return false
      }
      return true
    }
    if (step === 3) {
      if (!selectedAvatar) {
        setError('กรุณาเลือกรูปโปรไฟล์')
        return false
      }
      return true
    }
    return true
  }

  const nextStep = () => {
    if (validateStep()) {
      setStep(s => Math.min(s + 1, 3))
      setError(null)
    }
  }

  const prevStep = () => {
    if (step === 2 && pinStep === 'confirm') {
      setPinStep('set')
      setConfirmPin(['', '', '', '', '', ''])
      setError(null)
      return
    }
    setStep(s => Math.max(s - 1, 1))
    setError(null)
  }

  const handleSubmit = async () => {
    if (!validateStep()) return
    setIsSubmitting(true)
    setError(null)
    try {
      await api.post('/onboarding/complete', {
        userId: user!.id,
        contactType,
        contactValue: contactValue.trim(),
        convenientTime,
        pin: pin.join(''),
        avatarId: selectedAvatar,
      })

      navigate(consumePendingRoute() || '/')
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setIsSubmitting(false)
    }
  }

  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-3 mb-10">
      {[1, 2, 3].map(s => (
        <div
          key={s}
          className={`h-2 rounded-full transition-all duration-500 ${s === step ? 'w-12 bg-yellow-400' : s < step ? 'w-6 bg-yellow-400/30' : 'w-6 bg-zinc-800'
            }`}
        />
      ))}
    </div>
  )

  const PinGrid = ({ values, isConfirm = false }: { values: string[]; isConfirm?: boolean }) => (
    <div className="flex gap-4 justify-center">
      {values.map((v, i) => (
        <input
          key={i}
          id={`${isConfirm ? 'confirm' : 'pin'}-${i}`}
          type="password"
          inputMode="numeric"
          maxLength={1}
          autoFocus={i === 0}
          value={v}
          onChange={e => handlePinInput(i, e.target.value, isConfirm)}
          onKeyDown={e => handlePinKeyDown(e, i, isConfirm)}
          className={`w-12 h-16 text-center text-lg font-prompt font-medium bg-zinc-900 border-2 rounded-2xl focus:outline-none transition-all ${v ? 'border-yellow-400 text-white shadow-[0_0_20px_rgba(250,204,21,0.2)]' : 'border-white/5 text-zinc-700'
            } focus:border-yellow-400 focus:shadow-[0_0_25px_rgba(250,204,21,0.4)]`}
        />
      ))}
    </div>
  )

  return (
    <div className="min-h-dvh bg-black text-white font-prompt flex flex-col items-center selection:bg-yellow-400 selection:text-black">
      <div className="w-full max-w-[420px] flex flex-col min-h-dvh px-8">

        <div className="flex flex-col items-center pt-4 pb-4">
          <img src="/wesis-icon.png" alt="WESIS" className="w-24 h-24 object-contain drop-shadow-[0_0_20px_rgba(250,204,21,0.3)]" />
        </div>

        <div className="flex-1 flex flex-col">
          {step === 1 && (
            <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center mb-4">
                <div className="inline-flex items-center gap-2 text-sm font-medium tracking-[0.4em] text-yellow-400 uppercase mb-4 px-4 py-1.5 bg-yellow-400/5 rounded-full border border-yellow-400/10">
                  <Check className="w-4 h-4" /> Step 1: Contact
                </div>
                <h2 className="text-xl font-bold text-white mb-3 tracking-tighter uppercase">ช่องทางติดต่อ</h2>
                <p className="text-zinc-500 text-sm font-medium ">เลือกช่องทางที่สะดวกให้ติดต่อกลับจ้ะ</p>
              </div>

              <StepIndicator />

              <div className="flex bg-zinc-900/50 border-2 border-white/5 rounded-2xl p-1.5 mb-10 mt-4 backdrop-blur-sm shadow-2xl">
                <button
                  onClick={() => { setContactType('LINE'); setContactValue(''); setError(null) }}
                  className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-xl text-base font-medium transition-all ${contactType === 'LINE'
                    ? 'bg-yellow-400 text-black shadow-2xl shadow-yellow-400/20 italic uppercase tracking-widest'
                    : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                >
                  <MessageSquare className="w-5 h-5 text-emerald-400" /> LINE ID
                </button>
                <button
                  onClick={() => { setContactType('PHONE'); setContactValue(''); setError(null) }}
                  className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-xl text-base font-medium transition-all ${contactType === 'PHONE'
                    ? 'bg-yellow-400 text-black shadow-2xl shadow-yellow-400/20 italic uppercase tracking-widest'
                    : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                >
                  <Phone className="w-5 h-5" />
                  PHONE
                </button>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-zinc-600 uppercase tracking-[0.3em] ml-4 ">
                  {contactType === 'LINE' ? 'LINE ID' : 'Mobile Number'}
                </label>
                <input
                  type={contactType === 'PHONE' ? 'tel' : 'text'}
                  value={contactValue}
                  onChange={e => setContactValue(e.target.value)}
                  placeholder={contactType === 'LINE' ? '@line_id' : '081-xxx-xxxx'}
                  className="w-full bg-zinc-900/40 border-2 border-white/5 rounded-2xl px-6 py-5 text-lg text-white placeholder:text-zinc-800 focus:outline-none focus:border-yellow-400 transition-all shadow-xl font-medium "
                />
              </div>

              <div className="mt-8 space-y-4">
                <label className="text-sm font-medium text-zinc-600 uppercase tracking-[0.3em] ml-4">
                  เวลาที่สะดวกติดต่อ
                </label>
                <div className="grid grid-cols-2 gap-3 pb-6">
                  {[
                    "ช่วงเช้า 7-12 น.",
                    "ช่วงบ่าย 13-16 น.",
                    "ช่วงกลางคืน 17-24 น.",
                    "สะดวกทุกเวลา"
                  ].map((time) => (
                    <button
                      key={time}
                      onClick={() => setConvenientTime(time)}
                      className={cn(
                        "p-4 rounded-xl border-2 text-sm font-medium transition-all text-center",
                        convenientTime === time
                          ? "bg-yellow-400/10 border-yellow-400 text-yellow-400 shadow-lg"
                          : "bg-zinc-900/40 border-white/5 text-zinc-500 hover:border-white/10"
                      )}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}


          {step === 2 && (
            <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 text-sm font-medium tracking-[0.4em] text-yellow-400 uppercase mb-4 px-4 py-1.5 bg-yellow-400/5 rounded-full border border-yellow-400/10">
                  <Check className="w-4 h-4" /> Step 2: Security
                </div>
                <h2 className="text-xl font-bold text-yellow-400 mb-3 tracking-tighter uppercase whitespace-nowrap">
                  {pinStep === 'set' ? 'ตั้งรหัสผ่าน 6 หลัก' : 'ยืนยันรหัสผ่าน'}
                </h2>
                <p className="text-zinc-500 text-sm font-medium leading-tight px-6">
                  {pinStep === 'set' ? 'พิมเลขที่น้องจำได้ขึ้นใจ เพื่อความปลอดภัยของข้อมูลนะจ๊ะ' : 'กรุณากรอก PIN อีกครั้งเพื่อความถูกต้องจ้ะ'}
                </p>
              </div>

              <StepIndicator />

              <div className="mt-10 mb-8">
                {pinStep === 'set' ? (
                  <PinGrid values={pin} />
                ) : (
                  <PinGrid values={confirmPin} isConfirm />
                )}
              </div>

              <p className="text-center text-zinc-700 text-sm font-medium uppercase tracking-[0.3em] animate-pulse ">
                ตัวเลข 6 หลักสำหรับเข้าสู่ระบบ
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-4 duration-500 px-2">
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 text-sm font-medium tracking-[0.4em] text-yellow-400 uppercase mb-4 px-4 py-1.5 bg-yellow-400/5 rounded-full border border-yellow-400/10">
                  <Check className="w-4 h-4" /> Step 3: Profile
                </div>
                <h2 className="text-xl font-bold text-white mb-3 tracking-tighter uppercase">เลือกรูปโปรไฟล์</h2>
                <p className="text-zinc-500 text-sm font-medium ">เลือกรูปที่น้องชอบที่สุดได้เลยจ้ะ</p>
              </div>

              <StepIndicator />

              <div className="grid grid-cols-3 gap-6 mt-8">
                {AVATARS.map(id => (
                  <button
                    key={id}
                    onClick={() => setSelectedAvatar(id)}
                    className={`relative aspect-square rounded-3xl overflow-hidden border-[3px] transition-all duration-300 shadow-2xl ${selectedAvatar === id
                      ? 'border-yellow-400 scale-110 shadow-yellow-400/30'
                      : 'border-zinc-900 group hover:border-zinc-600 hover:scale-[1.05]'
                      }`}
                  >
                    <img
                      src={`/avatar/${id}.jpg`}
                      alt={`Avatar ${id}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <AnimatePresence>
                      {selectedAvatar === id && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-yellow-400/10 flex items-center justify-center">
                          <div className="bg-yellow-400 rounded-full p-1.5 shadow-[0_0_15px_rgba(250,204,21,1)]">
                            <Check className="w-5 h-5 text-black" strokeWidth={5} />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm font-medium text-center rounded-2xl px-6 py-4 mb-4 shadow-2xl">
            {error}
          </motion.div>
        )}

        <div className="pb-16 pt-6 flex items-center gap-5">
          {step > 1 && (
            <button
              onClick={prevStep}
              className="w-16 h-16 rounded-2xl bg-zinc-900/50 border border-white/5 flex items-center justify-center text-zinc-600 hover:text-white transition-all shadow-xl active:scale-90"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}

          <button
            onClick={step === 3 ? handleSubmit : nextStep}
            disabled={isSubmitting}
            className="flex-1 h-16 bg-yellow-400 text-black rounded-2xl font-prompt font-medium text-lg uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-yellow-300 transition-all active:scale-[0.98] disabled:opacity-50 shadow-[0_15px_40px_rgba(250,204,21,0.25)]"
          >
            {isSubmitting ? (
              <Loader2 className="w-7 h-7 animate-spin" />
            ) : step === 3 ? (
              <>ยืนยันข้อมูล <Check className="w-6 h-6" strokeWidth={4} /></>
            ) : (
              <>ดำเนินการต่อ <ChevronRight className="w-6 h-6" strokeWidth={4} /></>
            )}
          </button>
        </div>

        <p className="text-center text-sm font-medium text-zinc-700 uppercase tracking-widest pb-8 opacity-40">
          ข้อมูลทั้งหมดจะถูกใช้ในการวิจัยเท่านั้น
        </p>
      </div>
    </div>
  )
}
