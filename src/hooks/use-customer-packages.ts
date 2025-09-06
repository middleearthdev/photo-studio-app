'use client'

import { useQuery } from '@tanstack/react-query'
import { 
  getPublicPackagesAction, 
  getPublicPackageAction,
  getPublicPackageCategoriesAction,
  getAvailableTimeSlotsAction
} from '@/actions/customer-packages'

// Query keys
export const customerPackageKeys = {
  all: ['customer-packages'] as const,
  lists: () => [...customerPackageKeys.all, 'list'] as const,
  list: (studioId?: string) => [...customerPackageKeys.lists(), { studioId }] as const,
  details: () => [...customerPackageKeys.all, 'detail'] as const,
  detail: (id: string) => [...customerPackageKeys.details(), id] as const,
  timeSlots: (packageId: string, date: string) => [...customerPackageKeys.all, 'timeSlots', packageId, date] as const,
}

export const customerPackageCategoryKeys = {
  all: ['customer-package-categories'] as const,
  lists: () => [...customerPackageCategoryKeys.all, 'list'] as const,
  list: (studioId?: string) => [...customerPackageCategoryKeys.lists(), { studioId }] as const,
}

// Customer Package Hooks
export function usePublicPackages(studioId?: string) {
  return useQuery({
    queryKey: customerPackageKeys.list(studioId),
    queryFn: async () => {
      const result = await getPublicPackagesAction(studioId)
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch packages')
      }
      return result.data || []
    },
  })
}

export function usePublicPackage(packageId: string) {
  return useQuery({
    queryKey: customerPackageKeys.detail(packageId),
    queryFn: async () => {
      const result = await getPublicPackageAction(packageId)
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch package')
      }
      return result.data
    },
    enabled: !!packageId,
  })
}

export function usePublicPackageCategories(studioId?: string) {
  return useQuery({
    queryKey: customerPackageCategoryKeys.list(studioId),
    queryFn: async () => {
      const result = await getPublicPackageCategoriesAction(studioId)
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch package categories')
      }
      return result.data || []
    },
  })
}

export function useAvailableTimeSlots(packageId: string, date: string) {
  return useQuery({
    queryKey: customerPackageKeys.timeSlots(packageId, date),
    queryFn: async () => {
      const result = await getAvailableTimeSlotsAction(packageId, date)
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch time slots')
      }
      return result.data || []
    },
    enabled: !!packageId && !!date,
    // Refetch every 5 minutes to get updated availability
    refetchInterval: 5 * 60 * 1000,
  })
}