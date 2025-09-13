"use client"

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getCurrentProfile,
  updateProfile,
  updatePassword,
  createBackup,
  deleteAllData,
  type ProfileSettings,
  type SystemSettings,
} from '@/actions/settings'

// Profile hooks
export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const result = await getCurrentProfile()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch profile')
      }
      return result.data!
    },
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      toast.success('Profile updated successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update profile')
    },
  })
}

export function useUpdatePassword() {
  return useMutation({
    mutationFn: updatePassword,
    onSuccess: () => {
      toast.success('Password updated successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update password')
    },
  })
}


// Data management hooks
export function useCreateBackup() {
  return useMutation({
    mutationFn: createBackup,
    onSuccess: () => {
      toast.success('Backup created successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create backup')
    },
  })
}

export function useDeleteAllData() {
  return useMutation({
    mutationFn: deleteAllData,
    onSuccess: () => {
      toast.success('All data deleted successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete data')
    },
  })
}