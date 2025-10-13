import { useQuery } from '@tanstack/react-query'
import { useSession } from '@/lib/auth-client'

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

export const useProfile = () => {
  const { data: session } = useSession()

  const fetchProfile = async (): Promise<UserProfile> => {
    if (!session?.user) {
      throw new Error('No authenticated user')
    }

    const response = await fetch('/api/user/profile')
    
    if (!response.ok) {
      throw new Error('Failed to fetch profile')
    }

    return response.json()
  }

  return useQuery({
    queryKey: ['profile', session?.user?.id],
    queryFn: fetchProfile,
    enabled: !!session?.user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  })
}