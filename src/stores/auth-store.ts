import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authClient } from '@/lib/auth-client'

type UserRole = 'customer' | 'admin' | 'cs'

interface UserProfile {
  id: string
  studio_id: string | null
  role: UserRole
  full_name: string | null
  email: string | null
  phone: string | null
  address: string | null
  birth_date: string | null
  preferences: Record<string, any>
  avatar_url: string | null
  is_active: boolean
  last_login: string | null
  created_at: string
  updated_at: string
}

interface AuthState {
  user: any | null
  profile: UserProfile | null
  isLoading: boolean
  isAuthenticated: boolean

  // Actions
  refreshProfile: () => Promise<void>
  initialize: () => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      isLoading: true,
      isAuthenticated: false,

      signOut: async () => {
        try {
          set({ isLoading: true })
          await authClient.signOut()
          set({
            user: null,
            profile: null,
            isAuthenticated: false,
            isLoading: false
          })
        } catch (error) {
          console.error('Sign out error:', error)
          set({ isLoading: false })
        }
      },

      refreshProfile: async () => {
        try {
          const { user } = get()
          if (!user) return

          // Fetch user profile from the API
          const response = await fetch('/api/user/profile')
          if (response.ok) {
            const profileData = await response.json()
            set({ profile: profileData })
          }
        } catch (error) {
          console.error('Error refreshing profile:', error)
        }
      },

      initialize: async () => {
        try {
          set({ isLoading: true })

          const session = await authClient.getSession()

          if (session?.data?.user) {
            set({
              user: session.data.user,
              isAuthenticated: true
            })
            await get().refreshProfile()
          } else {
            set({
              user: null,
              profile: null,
              isAuthenticated: false
            })
          }

          set({ isLoading: false })
        } catch (error) {
          console.error('Error initializing auth:', error)
          set({ 
            isLoading: false,
            user: null,
            profile: null,
            isAuthenticated: false
          })
        }
      }
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        profile: state.profile,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)

// Export the Better Auth useSession hook for convenience
export { useSession } from '@/lib/auth-client'