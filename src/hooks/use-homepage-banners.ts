"use client"

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getBannersAction,
  getActiveBannersAction,
  getBannerAction,
  createBannerAction,
  updateBannerAction,
  deleteBannerAction,
  toggleBannerStatusAction,
  duplicateBannerAction,
  updateBannerPriorityAction,
  type HomepageBanner,
  type CreateBannerData,
  type UpdateBannerData
} from '@/actions/homepage-banners'

export function useBanners(studioId?: string) {
  return useQuery({
    queryKey: ['homepage-banners', studioId],
    queryFn: async () => {
      const result = await getBannersAction(studioId)
      if (!result.success) {
        throw new Error(result.error)
      }
      return result.data || []
    },
    enabled: !!studioId,
  })
}

export function useActiveBanners(studioId: string) {
  return useQuery({
    queryKey: ['homepage-banners', 'active', studioId],
    queryFn: async () => {
      const result = await getActiveBannersAction(studioId)
      if (!result.success) {
        throw new Error(result.error)
      }
      return result.data || []
    },
    enabled: !!studioId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useBanner(id: string) {
  return useQuery({
    queryKey: ['homepage-banner', id],
    queryFn: async () => {
      const result = await getBannerAction(id)
      if (!result.success) {
        throw new Error(result.error)
      }
      return result.data
    },
    enabled: !!id,
  })
}

export function useCreateBanner() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateBannerData) => {
      const result = await createBannerAction(data)
      if (!result.success) {
        throw new Error(result.error)
      }
      return result.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['homepage-banners'] })
      toast.success('Banner berhasil dibuat')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal membuat banner')
    },
  })
}

export function useUpdateBanner() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateBannerData }) => {
      const result = await updateBannerAction(id, data)
      if (!result.success) {
        throw new Error(result.error)
      }
      return result.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['homepage-banners'] })
      queryClient.invalidateQueries({ queryKey: ['homepage-banner', data?.id] })
      toast.success('Banner berhasil diperbarui')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal memperbarui banner')
    },
  })
}

export function useDeleteBanner() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteBannerAction(id)
      if (!result.success) {
        throw new Error(result.error)
      }
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homepage-banners'] })
      toast.success('Banner berhasil dihapus')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal menghapus banner')
    },
  })
}

export function useToggleBannerStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await toggleBannerStatusAction(id)
      if (!result.success) {
        throw new Error(result.error)
      }
      return result.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['homepage-banners'] })
      const status = data?.is_active ? 'diaktifkan' : 'dinonaktifkan'
      toast.success(`Banner berhasil ${status}`)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal mengubah status banner')
    },
  })
}

export function useDuplicateBanner() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await duplicateBannerAction(id)
      if (!result.success) {
        throw new Error(result.error)
      }
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homepage-banners'] })
      toast.success('Banner berhasil diduplikasi')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal menduplikasi banner')
    },
  })
}

export function useUpdateBannerPriority() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, priority }: { id: string; priority: number }) => {
      const result = await updateBannerPriorityAction(id, priority)
      if (!result.success) {
        throw new Error(result.error)
      }
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homepage-banners'] })
      toast.success('Prioritas banner berhasil diperbarui')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal memperbarui prioritas')
    },
  })
}