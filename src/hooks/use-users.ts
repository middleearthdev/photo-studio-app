import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { 
  getUsersAction, 
  getPaginatedUsers,
  createUserAction, 
  updateUserAction, 
  deactivateUserAction,
  type CreateUserData,
  type UpdateUserData,
  type UserProfile,
  type UserRole
} from '@/actions/users'
import { PaginationParams } from '@/lib/constants/pagination'

// Query keys
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...userKeys.lists(), { filters }] as const,
  paginatedLists: () => [...userKeys.all, 'paginated'] as const,
  paginatedList: (params: any) => [...userKeys.paginatedLists(), params] as const,
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

// Get paginated users
export function usePaginatedUsers(
  params: PaginationParams & {
    role?: UserRole | 'all'
    status?: 'active' | 'inactive' | 'all'
    studioId?: string
  } = {}
) {
  return useQuery({
    queryKey: userKeys.paginatedList(params),
    queryFn: () => getPaginatedUsers(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
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
      queryClient.invalidateQueries({ queryKey: userKeys.paginatedLists() })
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
      queryClient.invalidateQueries({ queryKey: userKeys.paginatedLists() })
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
      queryClient.invalidateQueries({ queryKey: userKeys.paginatedLists() })
      toast.success('User berhasil dinonaktifkan')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal menonaktifkan user')
    },
  })
}