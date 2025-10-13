"use server"

import { prisma } from '@/lib/prisma'
import { getAvailableTimeSlotsAction as getTimeSlotsAction } from '@/actions/time-slots'

export interface Package {
  id: string
  studio_id: string
  category_id: string | null
  name: string
  description: string | null
  duration_minutes: number
  price: number
  dp_percentage: number
  includes: string[] | null
  is_popular: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  // Relations
  category?: {
    id: string
    name: string
  }
  facilities?: {
    id: string
    name: string
    description: string | null
  }[]
}

export interface PackageCategory {
  id: string
  studio_id: string
  name: string
  description: string | null
  display_order: number
  is_active: boolean
  created_at: string
}

export interface ActionResult<T = any> {
  success: boolean
  data?: T
  error?: string
}

// Public action to get active packages for customers
export async function getPublicPackagesAction(studioId?: string): Promise<ActionResult<Package[]>> {
  try {
    const whereClause: any = {
      is_active: true
    }

    // If studioId is provided, filter by studio
    if (studioId) {
      whereClause.studio_id = studioId
    }

    const packages = await prisma.package.findMany({
      where: whereClause,
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        },
        package_facilities: {
          include: {
            facility: {
              select: {
                id: true,
                name: true,
                description: true
              }
            }
          }
        }
      },
      orderBy: [
        { is_popular: 'desc' },
        { created_at: 'desc' }
      ]
    })

    // Transform the data to include facilities and match expected interface
    const transformedPackages: Package[] = packages.map(pkg => ({
      id: pkg.id,
      studio_id: pkg.studio_id || '',
      category_id: pkg.category_id,
      name: pkg.name,
      description: pkg.description,
      duration_minutes: pkg.duration_minutes,
      price: Number(pkg.price),
      dp_percentage: Number(pkg.dp_percentage || 30),
      includes: Array.isArray(pkg.includes) ? pkg.includes as string[] : null,
      is_popular: pkg.is_popular || false,
      is_active: pkg.is_active || false,
      created_at: pkg.created_at?.toISOString() || '',
      updated_at: pkg.updated_at?.toISOString() || '',
      category: pkg.category ? {
        id: pkg.category.id,
        name: pkg.category.name
      } : undefined,
      facilities: pkg.package_facilities?.map(pf => ({
        id: pf.facility?.id || '',
        name: pf.facility?.name || '',
        description: pf.facility?.description || null
      })) || []
    }))

    return { success: true, data: transformedPackages }
  } catch (error: any) {
    console.error('Error in getPublicPackagesAction:', error)
    return { success: false, error: error.message || 'An error occurred' }
  }
}

// Public action to get a specific package for customers
export async function getPublicPackageAction(packageId: string): Promise<ActionResult<Package>> {
  try {
    // Get package with relations
    const packageData = await prisma.package.findFirst({
      where: {
        id: packageId,
        is_active: true
      },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        },
        package_facilities: {
          include: {
            facility: {
              select: {
                id: true,
                name: true,
                description: true
              }
            }
          }
        }
      }
    })

    if (!packageData) {
      return { success: false, error: 'Package not found or inactive' }
    }

    // Transform the data to include facilities and match expected interface
    const transformedPackage: Package = {
      id: packageData.id,
      studio_id: packageData.studio_id || '',
      category_id: packageData.category_id,
      name: packageData.name,
      description: packageData.description,
      duration_minutes: packageData.duration_minutes,
      price: Number(packageData.price),
      dp_percentage: Number(packageData.dp_percentage || 30),
      includes: Array.isArray(packageData.includes) ? packageData.includes as string[] : null,
      is_popular: packageData.is_popular || false,
      is_active: packageData.is_active || false,
      created_at: packageData.created_at?.toISOString() || '',
      updated_at: packageData.updated_at?.toISOString() || '',
      category: packageData.category ? {
        id: packageData.category.id,
        name: packageData.category.name
      } : undefined,
      facilities: packageData.package_facilities?.map(pf => ({
        id: pf.facility?.id || '',
        name: pf.facility?.name || '',
        description: pf.facility?.description || null
      })) || []
    }

    return { success: true, data: transformedPackage }
  } catch (error: any) {
    console.error('Error in getPublicPackageAction:', error)
    return { success: false, error: error.message || 'An error occurred' }
  }
}

// Public action to get active package categories for customers
export async function getPublicPackageCategoriesAction(studioId?: string): Promise<ActionResult<PackageCategory[]>> {
  try {
    const whereClause: any = {
      is_active: true
    }

    // If studioId is provided, filter by studio
    if (studioId) {
      whereClause.studio_id = studioId
    }

    const categories = await prisma.packageCategory.findMany({
      where: whereClause,
      orderBy: {
        display_order: 'asc'
      }
    })

    // Transform to match expected interface
    const transformedCategories: PackageCategory[] = categories.map(category => ({
      id: category.id,
      studio_id: category.studio_id || '',
      name: category.name,
      description: category.description,
      display_order: category.display_order || 0,
      is_active: category.is_active || false,
      created_at: category.created_at?.toISOString() || ''
    }))

    return { success: true, data: transformedCategories }
  } catch (error: any) {
    console.error('Error in getPublicPackageCategoriesAction:', error)
    return { success: false, error: error.message || 'An error occurred' }
  }
}

// Public action to get available time slots for a package on a specific date
export async function getCustomerPackageTimeSlotsAction(packageId: string, date: string, excludeReservationId?: string): Promise<ActionResult<{ id: string, time: string, available: boolean }[]>> {
  try {
    // Get package details to get studioId and duration
    const packageResult = await getPublicPackageAction(packageId)
    if (!packageResult.success) {
      return { success: false, error: packageResult.error || 'Failed to fetch package' }
    }

    const studioId = packageResult?.data?.studio_id
    const duration = packageResult?.data?.duration_minutes

    return await getTimeSlotsAction(studioId || '', date, duration, packageId, excludeReservationId)
  } catch (error: any) {
    console.error('Error in getCustomerPackageTimeSlotsAction:', error)
    return { success: false, error: error.message || 'An error occurred' }
  }
}

// Helper function to generate time slots
function generateTimeSlots(
  operatingHours: { start: string; end: string },
  intervalMinutes: number,
  packageDuration: number,
  existingReservations: any[],
  date: string
): { id: string, time: string, available: boolean }[] {
  const slots = []
  const startTime = new Date(`${date} ${operatingHours.start}:00`)
  const endTime = new Date(`${date} ${operatingHours.end}:00`)

  const current = new Date(startTime)
  let slotId = 1

  while (current < endTime) {
    const slotEndTime = new Date(current.getTime() + packageDuration * 60000)

    // Check if slot end time exceeds operating hours
    if (slotEndTime > endTime) break

    const timeString = current.toTimeString().slice(0, 5)

    // Check if slot conflicts with existing reservations
    const isAvailable = !existingReservations.some(reservation => {
      const reservationStart = new Date(reservation.scheduled_at)
      const reservationEnd = new Date(reservationStart.getTime() + reservation.duration_minutes * 60000)

      return (
        (current >= reservationStart && current < reservationEnd) ||
        (slotEndTime > reservationStart && slotEndTime <= reservationEnd) ||
        (current <= reservationStart && slotEndTime >= reservationEnd)
      )
    })

    slots.push({
      id: slotId.toString(),
      time: timeString,
      available: isAvailable
    })

    // Move to next slot
    current.setTime(current.getTime() + intervalMinutes * 60000)
    slotId++
  }

  return slots
}