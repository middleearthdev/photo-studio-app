import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import type { User, Session, AuthError } from '@supabase/supabase-js'

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
  user: User | null
  profile: UserProfile | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean

  // Actions
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signInWithGoogle: () => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string, fullName: string, phone?: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
  updatePassword: (password: string) => Promise<{ error: AuthError | null }>
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null }>
  refreshProfile: () => Promise<void>
  setSession: (session: Session | null) => void
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      session: null,
      isLoading: true,
      isAuthenticated: false,

      signIn: async (email: string, password: string) => {
        try {
          set({ isLoading: true })

          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          })

          if (error) {
            set({ isLoading: false })
            return { error }
          }

          if (data.user && data.session) {
            set({
              user: data.user,
              session: data.session,
              isAuthenticated: true
            })
            await get().refreshProfile()
          }

          set({ isLoading: false })
          return { error: null }
        } catch (error) {
          set({ isLoading: false })
          return { error: error as AuthError }
        }
      },

      signInWithGoogle: async () => {
        try {
          set({ isLoading: true })

          const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: `${window.location.origin}/auth/callback`,
              queryParams: {
                access_type: 'offline',
                prompt: 'consent',
              }
            }
          })

          if (error) {
            set({ isLoading: false })
            return { error }
          }

          // OAuth redirect will handle the rest
          return { error: null }
        } catch (error) {
          set({ isLoading: false })
          return { error: error as AuthError }
        }
      },

      signUp: async (email: string, password: string, fullName: string, phone?: string) => {
        try {
          set({ isLoading: true })

          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: fullName,
                phone: phone || null
              }
            }
          })

          if (error) {
            set({ isLoading: false })
            return { error }
          }

          // Profile will be created automatically by trigger
          set({ isLoading: false })
          return { error: null }
        } catch (error) {
          set({ isLoading: false })
          return { error: error as AuthError }
        }
      },

      signOut: async () => {
        try {
          set({ isLoading: true })
          await supabase.auth.signOut()
          set({
            user: null,
            profile: null,
            session: null,
            isAuthenticated: false,
            isLoading: false
          })
        } catch (error) {
          console.error('Sign out error:', error)
          set({ isLoading: false })
        }
      },

      resetPassword: async (email: string) => {
        try {
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
          })
          return { error }
        } catch (error) {
          return { error: error as AuthError }
        }
      },

      updatePassword: async (password: string) => {
        try {
          const { error } = await supabase.auth.updateUser({ password })
          return { error }
        } catch (error) {
          return { error: error as AuthError }
        }
      },

      updateProfile: async (updates: Partial<UserProfile>) => {
        try {
          const { user } = get()
          if (!user) return { error: new Error('No user found') }

          const { error } = await supabase
            .from('user_profiles')
            .update({
              ...updates,
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id)

          if (error) {
            return { error: new Error(error.message) }
          }

          await get().refreshProfile()
          return { error: null }
        } catch (error) {
          return { error: error as Error }
        }
      },

      refreshProfile: async () => {
        try {
          const { user } = get()
          if (!user) return

          const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', user.id)
            .single()

          if (error) {
            console.error('Error fetching profile:', error)
            return
          }

          set({ profile: data as UserProfile })
        } catch (error) {
          console.error('Error refreshing profile:', error)
        }
      },

      setSession: (session: Session | null) => {
        set({
          session,
          user: session?.user || null,
          isAuthenticated: !!session?.user
        })
      },

      initialize: async () => {
        try {
          set({ isLoading: true })

          const { data: { session }, error } = await supabase.auth.getSession()

          if (error) {
            console.error('Error getting session:', error)
            set({ isLoading: false })
            return
          }

          if (session?.user) {
            set({
              session,
              user: session.user,
              isAuthenticated: true
            })
            await get().refreshProfile()
          }

          set({ isLoading: false })
        } catch (error) {
          console.error('Error initializing auth:', error)
          set({ isLoading: false })
        }
      }
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        profile: state.profile,
        session: state.session,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)

// Auth listener setup
let authListenerInitialized = false

export const initializeAuthListener = () => {
  if (authListenerInitialized) return

  supabase.auth.onAuthStateChange(async (event, session) => {
    const { setSession, refreshProfile } = useAuthStore.getState()

    if (event === 'SIGNED_IN' && session) {
      setSession(session)
      await refreshProfile()

      // Handle OAuth first-time login profile creation
      if (session.user.app_metadata.provider && session.user.app_metadata.provider !== 'email') {
        const { data: existingProfile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (!existingProfile) {
          // Create profile for OAuth user
          await supabase
            .from('user_profiles')
            .insert({
              id: session.user.id,
              full_name: session.user.user_metadata?.full_name ||
                session.user.user_metadata?.name ||
                null,
              role: 'customer',
              is_active: true
            })

          // Refresh profile after creation
          await refreshProfile()
        }

        // Update last login
        await supabase
          .from('user_profiles')
          .update({ last_login: new Date().toISOString() })
          .eq('id', session.user.id)
      }
    } else if (event === 'SIGNED_OUT') {
      setSession(null)
    } else if (event === 'TOKEN_REFRESHED' && session) {
      setSession(session)
    }
  })

  authListenerInitialized = true
}