"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { 
  getHeroImagesAction, 
  getActiveHeroImagesAction,
  createHeroImageAction,
  updateHeroImageAction,
  deleteHeroImageAction,
  type HeroImage 
} from "@/actions/hero-images"
import { toast } from "sonner"

// Query keys
export const heroImageKeys = {
  all: ['hero-images'] as const,
  active: ['hero-images', 'active'] as const,
  admin: ['hero-images', 'admin'] as const,
}

// Get all hero images (admin)
export function useHeroImages() {
  return useQuery({
    queryKey: heroImageKeys.admin,
    queryFn: async () => {
      const result = await getHeroImagesAction()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch hero images')
      }
      return result.data || []
    },
  })
}

// Get active hero images (public)
export function useActiveHeroImages() {
  return useQuery({
    queryKey: heroImageKeys.active,
    queryFn: async () => {
      const result = await getActiveHeroImagesAction()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch active hero images')
      }
      return result.data || []
    },
  })
}

// Create hero image
export function useCreateHeroImage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      title: string
      description?: string
      image_url: string
      alt_text?: string
      display_order: number
      is_active?: boolean
    }) => {
      const result = await createHeroImageAction(data)
      if (!result.success) {
        throw new Error(result.error || 'Failed to create hero image')
      }
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: heroImageKeys.all })
      toast.success('Hero image created successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create hero image')
    },
  })
}

// Update hero image
export function useUpdateHeroImage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      id: string
      data: {
        title?: string
        description?: string
        image_url?: string
        alt_text?: string
        display_order?: number
        is_active?: boolean
      }
    }) => {
      const result = await updateHeroImageAction(params.id, params.data)
      if (!result.success) {
        throw new Error(result.error || 'Failed to update hero image')
      }
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: heroImageKeys.all })
      toast.success('Hero image updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update hero image')
    },
  })
}

// Delete hero image
export function useDeleteHeroImage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteHeroImageAction(id)
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete hero image')
      }
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: heroImageKeys.all })
      toast.success('Hero image deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete hero image')
    },
  })
}