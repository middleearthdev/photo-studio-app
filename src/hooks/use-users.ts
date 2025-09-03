import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { 
  getUsersAction, 
  createUserAction, 
  updateUserAction, 
  deactivateUserAction,
  type CreateUserData,
  type UpdateUserData,
  type UserProfile
} from '@/actions/users'

// Query keys
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...userKeys.lists(), { filters }] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
}

// Custom hooks
export function useUsers() {
  return useQuery({
    queryKey: userKeys.lists(),
    queryFn: async () => {
      const result = await getUsersAction()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch users')
      }
      return result.data || []
    },
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userData: CreateUserData) => {
      const result = await createUserAction(userData)
      if (!result.success) {
        throw new Error(result.error || 'Failed to create user')
      }
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      toast.success('User berhasil dibuat')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal membuat user')
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, userData }: { userId: string; userData: UpdateUserData }) => {
      const result = await updateUserAction(userId, userData)
      if (!result.success) {
        throw new Error(result.error || 'Failed to update user')
      }
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      toast.success('User berhasil diupdate')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal mengupdate user')
    },
  })
}

export function useDeactivateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId: string) => {
      const result = await deactivateUserAction(userId)
      if (!result.success) {
        throw new Error(result.error || 'Failed to deactivate user')
      }
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      toast.success('User berhasil dinonaktifkan')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal menonaktifkan user')
    },
  })
}