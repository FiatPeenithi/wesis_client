import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  name?: string
  avatarId?: number
  defaultStage?: number
  currentStage?: number
  stage4At?: string
  type?: number
  attributes?: any
  profile?: {
    id?: string
    avatarId?: number
    currentStage?: number
    defaultStage?: number
    rankingScore?: number
    type?: number
    contactType?: string
    contactValue?: string
    contactTime?: string
  }
}



interface AuthState {
  user: User | null
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user 
      }),
      logout: () => {
        set({ user: null, isAuthenticated: false })
        localStorage.removeItem('wesis_user') // Backward compatibility
      },
    }),
    {
      name: 'wesis-auth',
    }
  )
)
