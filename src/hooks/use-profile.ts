import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { UserRole } from '@/actions/auth'

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

export const useProfile = () => {
  const supabase = createClient()

  const fetchProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      throw new Error('No authenticated user')
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return data as UserProfile
  }

  return useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  })
}