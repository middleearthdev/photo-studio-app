"use server"

import { createClient } from '@/lib/supabase/server'

export interface Package {
  id: string
  studio_id: string
  category_id: string | null
  name: string
  description: string | null
  duration_minutes: number
  price: number
  dp_percentage: number
  max_photos: number | null
  max_edited_photos: number | null
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
    const supabase = await createClient()

    // Build query for active packages only
    let query = supabase
      .from('packages')
      .select(`
        *,
        category:package_categories(id, name),
        package_facilities!inner(
          facility:facilities(id, name, description)
        )
      `)
      .eq('is_active', true)
      .order('is_popular', { ascending: false })
      .order('created_at', { ascending: false })

    // If studioId is provided, filter by studio
    if (studioId) {
      query = query.eq('studio_id', studioId)
    }

    const { data: packages, error } = await query

    if (error) {
      console.error('Error fetching public packages:', error)
      return { success: false, error: 'Failed to fetch packages' }
    }

    // Transform the data to include facilities
    const transformedPackages = packages?.map(pkg => ({
      ...pkg,
      facilities: pkg.package_facilities?.map((pf: any) => pf.facility) || []
    })) || []

    return { success: true, data: transformedPackages }
  } catch (error: any) {
    console.error('Error in getPublicPackagesAction:', error)
    return { success: false, error: error.message || 'An error occurred' }
  }
}

// Public action to get a specific package for customers
export async function getPublicPackageAction(packageId: string): Promise<ActionResult<Package>> {
  try {
    const supabase = await createClient()

    // Get package with relations
    const { data: packageData, error } = await supabase
      .from('packages')
      .select(`
        *,
        category:package_categories(id, name),
        package_facilities!inner(
          facility:facilities(id, name, description)
        )
      `)
      .eq('id', packageId)
      .eq('is_active', true)
      .single()

    if (error) {
      console.error('Error fetching public package:', error)
      return { success: false, error: 'Package not found or inactive' }
    }

    // Transform the data to include facilities
    const transformedPackage = {
      ...packageData,
      facilities: packageData.package_facilities?.map((pf: any) => pf.facility) || []
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
    const supabase = await createClient()

    // Build query for active categories only
    let query = supabase
      .from('package_categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    // If studioId is provided, filter by studio
    if (studioId) {
      query = query.eq('studio_id', studioId)
    }

    const { data: categories, error } = await query

    if (error) {
      console.error('Error fetching public package categories:', error)
      return { success: false, error: 'Failed to fetch package categories' }
    }

    return { success: true, data: categories || [] }
  } catch (error: any) {
    console.error('Error in getPublicPackageCategoriesAction:', error)
    return { success: false, error: error.message || 'An error occurred' }
  }
}

// Action to get available time slots for a specific date
export async function getAvailableTimeSlotsAction(packageId: string, date: string): Promise<ActionResult<{id: string, time: string, available: boolean}[]>> {
  try {
    const supabase = await createClient()

    // Get package to determine studio
    const { data: packageData, error: packageError } = await supabase
      .from('packages')
      .select('studio_id, duration_minutes')
      .eq('id', packageId)
      .single()

    if (packageError || !packageData) {
      return { success: false, error: 'Package not found' }
    }

    // Get studio operating hours and time slots
    const { data: studioData, error: studioError } = await supabase
      .from('studios')
      .select('operating_hours, time_slot_interval')
      .eq('id', packageData.studio_id)
      .single()

    if (studioError || !studioData) {
      return { success: false, error: 'Studio not found' }
    }

    // Get existing reservations for the date
    const { data: reservations, error: reservationsError } = await supabase
      .from('reservations')
      .select('scheduled_at, duration_minutes')
      .eq('studio_id', packageData.studio_id)
      .gte('scheduled_at', `${date} 00:00:00`)
      .lt('scheduled_at', `${date} 24:00:00`)
      .eq('status', 'confirmed')

    if (reservationsError) {
      console.error('Error fetching reservations:', reservationsError)
    }

    // Generate time slots based on studio configuration
    const timeSlots = generateTimeSlots(
      studioData.operating_hours || { start: '09:00', end: '18:00' },
      studioData.time_slot_interval || 90,
      packageData.duration_minutes,
      reservations || [],
      date
    )

    return { success: true, data: timeSlots }
  } catch (error: any) {
    console.error('Error in getAvailableTimeSlotsAction:', error)
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
): {id: string, time: string, available: boolean}[] {
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