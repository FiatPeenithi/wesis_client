import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { useAuthStore } from '../store/useAuthStore'

type SisStageGuardProps = {
  requiredStage: 1 | 2 | 3
  children: React.ReactNode
}

export default function SisStageGuard({ requiredStage, children }: SisStageGuardProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated } = useAuthStore()
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    let cancelled = false
    setAllowed(false)

    if (!isAuthenticated || !user?.id) {
      navigate('/login', { replace: true })
      return () => { cancelled = true }
    }

    const checkAccess = async () => {
      try {
        // This endpoint checks DEMO, PRE, PIN, and avatar in the required order.
        const progressRes = await api.get(`/auth/progress/${user.id}`)
        if (cancelled) return
        const progress = progressRes.data.data
        if (progress.step !== 'complete') {
          navigate(progress.redirectTo || '/questionnaire/demo', { replace: true })
          return
        }

        let profileRes
        try {
          profileRes = await api.get(`/profiles/user/${user.id}`)
        } catch (error: any) {
          if (error.response?.status === 404) {
            navigate('/onboarding', { replace: true })
            return
          }
          throw error
        }
        if (cancelled) return
        const profile = profileRes.data.data
        if (!profile?.id) {
          navigate('/onboarding', { replace: true })
          return
        }

        const stage = Number(profile.currentStage ?? profile.defaultStage ?? 1)
        let hasCompletedClear = false
        if (requiredStage === 2 || requiredStage === 3) {
          const clearLogsRes = await api.get(`/sis/clear/logs/${user.id}`)
          if (cancelled) return
          hasCompletedClear = Array.isArray(clearLogsRes.data.data) && clearLogsRes.data.data.length > 0
        }

        // Older accounts may already have a later stage without ever completing SIS Clear.
        // Treat the missing clear log as an unfinished prerequisite and allow recovery there.
        if (requiredStage === 3 && !hasCompletedClear) {
          navigate('/sis/clear', { replace: true })
          return
        }

        const isClearRecovery = requiredStage === 2 && stage > 2 && !hasCompletedClear
        if (stage !== requiredStage && !isClearRecovery) {
          // The dashboard presents the next valid action for the user's current stage.
          navigate('/', { replace: true })
          return
        }

        if (!cancelled) setAllowed(true)
      } catch (error) {
        console.error('Failed to verify SIS flow access:', error)
        if (!cancelled) navigate('/login', { replace: true })
      }
    }

    void checkAccess()
    return () => { cancelled = true }
  }, [isAuthenticated, user?.id, requiredStage, location.pathname, navigate])

  if (!allowed) {
    return <div className="min-h-screen bg-black" aria-busy="true" />
  }

  return <>{children}</>
}
