'use client'

import { useQuery } from '@tanstack/react-query'
import { getPackageAddonsAction } from '@/actions/addons'

// Query keys for package addons
export const packageAddonKeys = {
  all: ['packageAddons'] as const,
  lists: () => [...packageAddonKeys.all, 'list'] as const,
  list: (packageId?: string) => [...packageAddonKeys.lists(), { packageId }] as const,
}

// Hook to get package-specific addons
export function usePackageAddons(packageId?: string) {
  return useQuery({
    queryKey: packageAddonKeys.list(packageId),
    queryFn: async () => {
      if (!packageId) return []
      
      const result = await getPackageAddonsAction(packageId)
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch package addons')
      }
      return result.data || []
    },
    enabled: !!packageId,
  })
}