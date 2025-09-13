'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { 
  getStudiosAction, 
  getStudioAction,
  createStudioAction, 
  updateStudioAction, 
  deleteStudioAction,
  hardDeleteStudioAction,
  getPublicStudiosAction,
  type CreateStudioData,
  type UpdateStudioData
} from '@/actions/studios'

// Query keys
export const studioKeys = {
  all: ['studios'] as const,
  lists: () => [...studioKeys.all, 'list'] as const,
  list: (filters?: Record<string, any>) => [...studioKeys.lists(), { filters }] as const,
  details: () => [...studioKeys.all, 'detail'] as const,
  detail: (id: string) => [...studioKeys.details(), id] as const,
  public: () => [...studioKeys.all, 'public'] as const,
}

// Hooks
export function useStudios() {
  return useQuery({
    queryKey: studioKeys.lists(),
    queryFn: async () => {
      const result = await getStudiosAction()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch studios')
      }
      return result.data || []
    },
  })
}

export function usePublicStudios() {
  return useQuery({
    queryKey: studioKeys.public(),
    queryFn: async () => {
      const result = await getPublicStudiosAction()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch studios')
      }
      return result.data || []
    },
  })
}

export function useStudio(studioId: string) {
  return useQuery({
    queryKey: studioKeys.detail(studioId),
    queryFn: async () => {
      const result = await getStudioAction(studioId)
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch studio')
      }
      return result.data
    },
    enabled: !!studioId,
  })
}

export function useCreateStudio() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (studioData: CreateStudioData) => createStudioAction(studioData),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: studioKeys.lists() })
        toast.success('Studio berhasil dibuat')
      } else {
        toast.error(result.error || 'Gagal membuat studio')
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Terjadi kesalahan saat membuat studio')
    },
  })
}

export function useUpdateStudio() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ studioId, studioData }: { studioId: string; studioData: UpdateStudioData }) =>
      updateStudioAction(studioId, studioData),
    onSuccess: (result, { studioId }) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: studioKeys.lists() })
        queryClient.invalidateQueries({ queryKey: studioKeys.detail(studioId) })
        toast.success('Studio berhasil diperbarui')
      } else {
        toast.error(result.error || 'Gagal memperbarui studio')
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Terjadi kesalahan saat memperbarui studio')
    },
  })
}

export function useDeleteStudio() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (studioId: string) => deleteStudioAction(studioId),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: studioKeys.lists() })
        toast.success('Status studio berhasil diubah')
      } else {
        toast.error(result.error || 'Gagal mengubah status studio')
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Terjadi kesalahan saat mengubah status studio')
    },
  })
}

export function useHardDeleteStudio() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (studioId: string) => hardDeleteStudioAction(studioId),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: studioKeys.lists() })
        toast.success('Studio berhasil dihapus permanen')
      } else {
        toast.error(result.error || 'Gagal menghapus studio secara permanen')
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Terjadi kesalahan saat menghapus studio secara permanen')
    },
  })
}