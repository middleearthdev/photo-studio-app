'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { 
  getReviewsAction,
  updateReviewStatusAction,
  toggleReviewFeaturedAction,
  replyToReviewAction,
  type Review
} from '@/actions/reviews'

// Query keys
export const reviewKeys = {
  all: ['reviews'] as const,
  lists: () => [...reviewKeys.all, 'list'] as const,
  list: (filters?: Record<string, any>) => [...reviewKeys.lists(), { filters }] as const,
}

// Hooks
export function useReviews() {
  return useQuery({
    queryKey: reviewKeys.lists(),
    queryFn: async () => {
      const result = await getReviewsAction()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch reviews')
      }
      return result.data || []
    },
  })
}

export function useUpdateReviewStatus() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ reviewId, isApproved }: { reviewId: string; isApproved: boolean }) =>
      updateReviewStatusAction(reviewId, isApproved),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: reviewKeys.lists() })
        toast.success('Review status berhasil diperbarui')
      } else {
        toast.error(result.error || 'Gagal memperbarui status review')
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Terjadi kesalahan saat memperbarui status review')
    },
  })
}

export function useToggleReviewFeatured() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (reviewId: string) => toggleReviewFeaturedAction(reviewId),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: reviewKeys.lists() })
        toast.success('Status featured review berhasil diubah')
      } else {
        toast.error(result.error || 'Gagal mengubah status featured review')
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Terjadi kesalahan saat mengubah status featured review')
    },
  })
}

export function useReplyToReview() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ reviewId, replyText }: { reviewId: string; replyText: string }) =>
      replyToReviewAction(reviewId, replyText),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: reviewKeys.lists() })
        toast.success('Balasan review berhasil dikirim')
      } else {
        toast.error(result.error || 'Gagal mengirim balasan review')
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Terjadi kesalahan saat mengirim balasan review')
    },
  })
}