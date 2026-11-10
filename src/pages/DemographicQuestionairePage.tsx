import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import {
  ChevronRight,
  ChevronLeft,
  Loader2,
  Clock,
  X
} from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../lib/utils'

interface Option {
  id: string
  label: string
  value: string
}

interface Question {
  id: string
  questionText: string
  helpText?: string
  type: 'SHORT_ANSWER' | 'PARAGRAPH' | 'MULTIPLE_CHOICE' | 'CHECKBOXES' | 'DROPDOWN' | 'LINEAR_SCALE'
  isRequired: boolean
  allowOther?: boolean
  isCalculated?: boolean
  isAgeRestrict?: boolean
  subSection?: string;
  options?: Option[]
}

interface Section {
  id: string
  title: string
  description?: string
  questions: Question[]
}

interface Questionnaire {
  id: string
  title: string
  slug: string
  description?: string
  sections: Section[]
}

export default function DemographicQuestionairePage() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleCancel = () => {

      logout();
      navigate('/login');
  }

  const [loading, setLoading] = useState(true)
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [otherValues, setOtherValues] = useState<Record<string, string>>({})

  const validateAgeRestriction = (questions: Question[]) => {
    const ageQuestion = questions.find(q => q.isAgeRestrict)
    if (!ageQuestion) return null
    const rawAge = answers[ageQuestion.id]
    const ageText = typeof rawAge === 'string' ? rawAge.trim() : ''
    if (!/^\d+$/.test(ageText)) return 'กรุณากรอกอายุเป็นจำนวนเต็มตั้งแต่ 18 ถึง 25 ปี'
    const age = Number(ageText)
    if (age < 18 || age > 25) return 'อายุที่เข้าร่วมโครงการได้คือ 18–25 ปี'
    return null
  }

  useEffect(() => {
    if (!user?.id) {
      navigate('/login')
      return
    }

    api.get(`/auth/progress/${user.id}`).then(res => {
      const { step, redirectTo } = res.data.data
      if (step !== 'demo') {
        navigate(redirectTo)
      }
    }).catch(() => {})

    fetchQuestionnaire()

    const savedProgress = localStorage.getItem('wesis_pre_draft')
    if (savedProgress) {
      setAnswers(JSON.parse(savedProgress))
    }
  }, [user?.id, navigate])

  useEffect(() => {
    if (Object.keys(answers).length === 0) return

    const timeout = setTimeout(() => {
      localStorage.setItem('wesis_pre_draft', JSON.stringify(answers))
    }, 1000)

    return () => clearTimeout(timeout)
  }, [answers])

  const fetchQuestionnaire = async () => {
    try {
      const response = await api.get('/questionnaires/slug/demographic')
      if (response.data.success) {
        setQuestionnaire(response.data.data)
      } else {
        throw new Error('Failed to fetch')
      }
    } catch (err) {
      // Logic for fallback is managed by the server in production
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  const handleOtherTextChange = (questionId: string, text: string) => {
    setOtherValues(prev => ({ ...prev, [questionId]: text }))
    setAnswers(prev => ({ ...prev, [questionId]: `__other__:${text}` }))
  }

  const handleCheckboxChange = (questionId: string, value: string) => {
    setAnswers(prev => {
      const current = Array.isArray(prev[questionId]) ? prev[questionId] : []
      if (current.includes(value)) {
        return { ...prev, [questionId]: current.filter((v: string) => v !== value) }
      } else {
        return { ...prev, [questionId]: [...current, value] }
      }
    })
  }

  const handleOtherCheckboxChange = (questionId: string, text: string) => {
    setOtherValues(prev => ({ ...prev, [questionId]: text }))
    setAnswers(prev => {
      const current = Array.isArray(prev[questionId]) ? prev[questionId] : []
      const filtered = current.filter((v: string) => !v.startsWith('__other__:'))
      if (text.trim() === '') return { ...prev, [questionId]: filtered }
      return { ...prev, [questionId]: [...filtered, `__other__:${text}`] }
    })
  }

  const nextSection = () => {
    if (questionnaire && currentSectionIndex < questionnaire.sections.length - 1) {
      const currentSection = questionnaire.sections[currentSectionIndex]
      const unanswered = currentSection.questions.filter(q => {
        if (!q.isRequired) return false
        const ans = answers[q.id]
        if (Array.isArray(ans)) return ans.length === 0
        return !ans
      })

      if (unanswered.length > 0) {
        setError('กรุณาตอบคำถามที่จำเป็นให้ครบถ้วนในส่วนนี้')
        setTimeout(() => setError(null), 3000)
        return
      }

      const ageError = validateAgeRestriction(currentSection.questions)
      if (ageError) {
        setError(ageError)
        return
      }

      setCurrentSectionIndex(currentSectionIndex + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const prevSection = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleSubmit = async () => {
    const currentSection = questionnaire?.sections[currentSectionIndex]
    if (currentSection) {
      const unanswered = currentSection.questions.filter(q => {
        if (!q.isRequired) return false
        const ans = answers[q.id]
        if (Array.isArray(ans)) return ans.length === 0
        return !ans
      })
      if (unanswered.length > 0) {
        setError('กรุณาตอบคำถามให้ครบก่อนส่งภารกิจ')
        return
      }
    }

    const ageQuestion = questionnaire?.sections.flatMap(section => section.questions).find(q => q.isAgeRestrict)
    if (ageQuestion) {
      const ageError = validateAgeRestriction([ageQuestion])
      if (ageError) {
        setCurrentSectionIndex(questionnaire!.sections.findIndex(section => section.questions.some(q => q.id === ageQuestion.id)))
        setError(ageError)
        return
      }
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const payload = {
        userId: user!.id,
        questionnaireId: questionnaire?.id,
        answers: Object.entries(answers).map(([qId, val]) => ({
          questionId: qId,
          value: Array.isArray(val) ? val.join(',') : String(val)
        }))
      }

      await api.post('/responses', payload)

      localStorage.removeItem('wesis_pre_draft')
      navigate('/questionnaire/pre')
    } catch (err: any) {
      setError('ไม่สามารถบันทึกได้ โปรดลองอีกครั้ง')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-dvh bg-black flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-yellow-400 animate-spin mb-6" strokeWidth={3} />
        <p className="text-zinc-600 font-prompt text-sm uppercase animate-pulse mt-4">กำลังเตรียมข้อมูลล่วงหน้า...</p>
      </div>
    )
  }

  if (!questionnaire) return null

  const currentSection = questionnaire.sections[currentSectionIndex]
  const progress = ((currentSectionIndex + 1) / questionnaire.sections.length) * 100

  return (
    <div className="bg-[#0d0d0d] text-white font-prompt selection:bg-yellow-400 selection:text-black pb-64">

      {/* Heavy Top Progress */}
      <div className="fixed top-0 left-0 w-full h-[6px] bg-zinc-900/50 z-50">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className="h-full bg-yellow-400 shadow-[0_0_25px_rgba(250,204,21,0.6)]"
        />
      </div>

      <div className="max-w-[620px] mx-auto px-6 pt-8">

        {/* Header Card */}
        <header className="mb-4 bg-zinc-900 border-2 border-white/5 rounded-4xl overflow-hidden shadow-2xl relative">
          <div className="absolute top-0 inset-x-0 h-2 bg-yellow-400" />
          <div className="p-4">
            <h1 className="text-lg font-bold text-white mb-3">
              {questionnaire.title}
            </h1>
            <p className="text-zinc-400 text-sm mb-2">
              {questionnaire.description}
            </p>
          </div>
        </header>

        {/* Section Label */}
        <motion.div
          key={currentSection.id + '-label'}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-4 bg-yellow-400 text-black px-6 py-4 font-bold text-base rounded-xl shadow-lg flex items-center justify-between"
        >
          <span>{currentSection.title}</span>

        </motion.div>

        {/* Questions */}
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSection.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              {currentSection.questions.map((q, idx) => {
                const prevQ = currentSection.questions[idx - 1];
                const showSubSection = q.subSection && (idx === 0 || prevQ.subSection !== q.subSection);

                return (
                  <div key={q.id} className="space-y-6">
                    {showSubSection && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="pt-8 pb-2"
                      >
                        <h3 className="text-yellow-400 font-bold uppercase tracking-[0.3em] text-sm flex items-center gap-3">
                          <span className="w-12 h-[1px] bg-yellow-400/40" />
                          {q.subSection}
                        </h3>
                      </motion.div>
                    )}
                    <div
                      className="bg-zinc-900 shadow-xl border border-white/5 p-6 md:p-8 rounded-3xl group transition-all"
                    >
                      <div className="mb-6">
                        <div className="flex items-start gap-3 mb-2">
                          <label className="text-lg md:text-xl text-white leading-snug">
                            {q.questionText}
                            {q.isRequired && <span className="text-rose-500 ml-1 select-none">*</span>}
                          </label>
                        </div>
                        {q.helpText && <p className="text-sm md:text-sm text-zinc-400 ml-8 p-3 border-l-2 border-zinc-700 bg-white/5 rounded-r-lg">{q.helpText}</p>}
                      </div>

                      <div className="space-y-3">
                        {q.type === 'MULTIPLE_CHOICE' && (
                          <div className="grid grid-cols-1 gap-3">
                            {q.options?.map(opt => (
                              <button
                                key={opt.id}
                                onClick={() => handleAnswerChange(q.id, opt.value)}
                                className={cn(
                                  "w-full p-4 md:p-5 rounded-xl border text-start transition-all flex items-center justify-between group/opt",
                                  answers[q.id] === opt.value
                                    ? "bg-yellow-400 border-yellow-400 text-black shadow-md"
                                    : "bg-black/40 border-white/10 text-zinc-400 hover:border-yellow-400/40 hover:text-white"
                                )}
                              >
                                <span className="text-base md:text-lg leading-tight pr-4">{opt.label}</span>
                                <div className={cn(
                                  "shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                  answers[q.id] === opt.value ? "bg-black border-black/20" : "border-white/10 bg-zinc-900"
                                )}>
                                  {answers[q.id] === opt.value && <div className="w-2 h-2 bg-yellow-400 rounded-full" />}
                                </div>
                              </button>
                            ))}
                            {q.allowOther && (
                              <div className={cn("w-full p-4 md:p-5 rounded-xl border transition-all flex flex-col gap-2",
                                answers[q.id]?.startsWith('__other__:') ? "border-yellow-600 bg-yellow-500" : "border-white/10 bg-black/40"
                              )}>
                                <button
                                  onClick={() => handleAnswerChange(q.id, `__other__:${otherValues[q.id] || ''}`)}
                                  className="w-full flex items-center justify-between text-start group/opt"
                                >
                                  <span className={cn("text-base md:text-lg leading-tight pr-4", answers[q.id]?.startsWith('__other__:') ? "text-black font-bold" : "text-zinc-400")}>อื่นๆ (โปรดระบุ)</span>
                                  <div className={cn(
                                    "shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                    answers[q.id]?.startsWith('__other__:') ? "bg-black border-black/20" : "border-white/10 bg-zinc-900"
                                  )}>
                                    {answers[q.id]?.startsWith('__other__:') && <div className="w-2 h-2 bg-yellow-400 rounded-full" />}
                                  </div>
                                </button>
                                {answers[q.id]?.startsWith('__other__:') && (
                                  <input
                                    type="text"
                                    placeholder="ระบุคำตอบของคุณ..."
                                    value={otherValues[q.id] || ''}
                                    onChange={(e) => handleOtherTextChange(q.id, e.target.value)}
                                    className="w-full bg-white/20 border border-black/10 rounded-lg p-3 text-base text-black placeholder:text-black/40 focus:outline-none focus:border-black/30 mt-2"
                                  />
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {q.type === 'CHECKBOXES' && (
                          <div className="grid grid-cols-1 gap-3">
                            {q.options?.map(opt => {
                              const isChecked = Array.isArray(answers[q.id]) && answers[q.id].includes(opt.value);
                              return (
                                <button
                                  key={opt.id}
                                  onClick={() => handleCheckboxChange(q.id, opt.value)}
                                  className={cn(
                                    "w-full p-4 md:p-5 rounded-xl border text-start transition-all flex items-center justify-between group/opt",
                                    isChecked
                                      ? "bg-yellow-400 border-yellow-400 text-black shadow-md"
                                      : "bg-black/40 border-white/10 text-zinc-400 hover:border-yellow-400/40 hover:text-white"
                                  )}
                                >
                                  <span className="text-base md:text-lg leading-tight pr-4">{opt.label}</span>
                                  <div className={cn(
                                    "shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                                    isChecked ? "bg-black border-black/20" : "border-white/10 bg-zinc-900"
                                  )}>
                                    {isChecked && <div className="w-3 h-3 bg-yellow-400 rounded-sm" />}
                                  </div>
                                </button>
                              );
                            })}
                            {q.allowOther && (() => {
                              const isOtherChecked = Array.isArray(answers[q.id]) && answers[q.id].some((v: string) => v.startsWith('__other__:'));
                              return (
                                <div className={cn("w-full p-4 md:p-5 rounded-xl border transition-all flex flex-col gap-2",
                                  isOtherChecked ? "border-yellow-600 bg-yellow-500" : "border-white/10 bg-black/40"
                                )}>
                                  <button
                                    onClick={() => {
                                      if (isOtherChecked) {
                                        setAnswers(prev => ({ ...prev, [q.id]: (prev[q.id] || []).filter((v: string) => !v.startsWith('__other__:')) }))
                                      } else {
                                        handleOtherCheckboxChange(q.id, otherValues[q.id] || '')
                                      }
                                    }}
                                    className="w-full flex items-center justify-between text-start group/opt"
                                  >
                                    <span className={cn("text-base md:text-lg leading-tight pr-4", isOtherChecked ? "text-black font-bold" : "text-zinc-400")}>อื่นๆ (โปรดระบุ)</span>
                                    <div className={cn(
                                      "shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                                      isOtherChecked ? "bg-black border-black/20" : "border-white/10 bg-zinc-900"
                                    )}>
                                      {isOtherChecked && <div className="w-3 h-3 bg-yellow-400 rounded-sm" />}
                                    </div>
                                  </button>
                                  {isOtherChecked && (
                                    <input
                                      type="text"
                                      placeholder="ระบุคำตอบของคุณ..."
                                      value={otherValues[q.id] || (Array.isArray(answers[q.id]) ? (answers[q.id].find((v: string) => v.startsWith('__other__:'))?.replace('__other__:', '') || '') : '')}
                                      onChange={(e) => handleOtherCheckboxChange(q.id, e.target.value)}
                                      className="w-full bg-white/20 border border-black/10 rounded-lg p-3 text-base text-black placeholder:text-black/40 focus:outline-none focus:border-black/30 mt-2"
                                    />
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        )}

                        {(q.type === 'SHORT_ANSWER' || q.type === 'PARAGRAPH') && (
                          <div className="relative">
                            {q.type === 'SHORT_ANSWER' ? (
                              <input
                                type="text"
                                value={answers[q.id] || ''}
                                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                placeholder="พิมพ์คำตอบของคุณ..."
                                className="w-full bg-zinc-900/60 border-b-2 border-white/10 py-3 px-2 text-base md:text-lg text-yellow-400 placeholder:text-zinc-600 focus:outline-none focus:border-yellow-400 transition-all font-sans"
                              />
                            ) : (
                              <textarea
                                value={answers[q.id] || ''}
                                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                placeholder="พิมพ์อธิบายลักษณะของคุณ..."
                                rows={4}
                                className="w-full bg-zinc-900/60 border-2 border-white/10 py-3 px-3 text-base md:text-lg text-yellow-400 placeholder:text-zinc-600 rounded-xl focus:outline-none focus:border-yellow-400 transition-all font-sans resize-none"
                              />
                            )}
                            <div className={cn("absolute right-2", q.type === 'SHORT_ANSWER' ? "bottom-3" : "bottom-4")}>
                              <Clock className="w-4 h-4 text-zinc-600" />
                            </div>
                          </div>
                        )}

                        {q.type === 'DROPDOWN' && (
                          <select
                            value={answers[q.id] || ''}
                            onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                            className="w-full bg-zinc-900 border-2 border-white/10 p-4 rounded-xl text-base md:text-lg text-yellow-400 outline-none focus:border-yellow-400 transition-all appearance-none"
                          >
                            <option value="" disabled className="text-zinc-600">เลือกคำตอบ...</option>
                            {q.options?.map(opt => (
                              <option key={opt.id} value={opt.value} className="bg-zinc-900 text-white">
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        )}

                        {q.type === 'LINEAR_SCALE' && (
                          <div className="py-6 px-2">
                            <div className="flex items-center justify-between mb-4">
                              <span className="text-sm text-zinc-500">{q.options?.[0]?.label}</span>
                              <span className="text-sm text-zinc-500">{q.options?.[q.options.length - 1]?.label}</span>
                            </div>
                            <div className="flex gap-2">
                              {q.options?.map(opt => (
                                <button
                                  key={opt.id}
                                  onClick={() => handleAnswerChange(q.id, opt.value)}
                                  className={cn(
                                    "flex-1 h-12 md:h-14 rounded-lg border text-base md:text-lg transition-all flex items-center justify-center",
                                    answers[q.id] === opt.value
                                      ? "bg-yellow-400 border-yellow-400 text-black shadow-sm font-medium z-10"
                                      : "bg-black border-white/10 text-zinc-400 hover:border-yellow-400/40"
                                  )}
                                >
                                  {opt.value}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Action Bar */}
      <footer className="fixed bottom-0 left-0 w-full p-4 md:p-6 z-50">
        <div className="max-w-[620px] mx-auto flex items-center justify-between bg-zinc-900/60 backdrop-blur-xl border border-white/10 p-2 rounded-2xl shadow-xl">
          <div className="flex items-center gap-2">
            <button
              onClick={prevSection}
              disabled={currentSectionIndex === 0}
              className={cn(
                "w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center transition-all",
                currentSectionIndex === 0 ? "text-zinc-700 cursor-not-allowed" : "text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10"
              )}
            >
              <ChevronLeft className="w-6 h-6 md:w-7 md:h-7" />
            </button>

            <button
              onClick={handleCancel}
              className="px-4 h-12 md:h-14 rounded-xl flex items-center gap-2 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 transition-all font-medium text-sm md:text-base"
            >
              <X className="w-4 h-4 md:w-5 md:h-5" />
              <span>ยกเลิก</span>
            </button>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm text-rose-500 px-3 text-center leading-tight max-w-[200px]"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={currentSectionIndex < questionnaire.sections.length - 1 ? nextSection : handleSubmit}
            disabled={isSubmitting}
            className="bg-yellow-400 text-black px-6 md:px-8 h-12 md:h-14 rounded-xl font-bold text-base md:text-lg flex items-center gap-2 hover:bg-yellow-300 transition-all active:scale-[0.98] shadow-md border-b-2 border-yellow-600 active:border-b-0"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>{currentSectionIndex < questionnaire.sections.length - 1 ? 'ถัดไป' : 'ส่งแบบสอบถาม'}</span>
                <ChevronRight className="w-5 h-5" strokeWidth={2} />
              </>
            )}
          </button>
        </div>
      </footer>
    </div>
  )
}
