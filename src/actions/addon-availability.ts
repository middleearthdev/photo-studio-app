"use server"

import { prisma } from '@/lib/prisma'

export interface ActionResult<T = any> {
  success: boolean
  data?: T
  error?: string
}

export interface TimeSlot {
  time: string  // Format: "HH:MM"
  available: boolean
  conflictingBooking?: string  // Booking code if conflicts
}

export interface AvailabilityResult {
  available: boolean
  conflictingBookings?: {
    booking_code: string
    customer_name: string
    time_range: string
  }[]
}

/**
 * Check if a facility-based addon is available for a specific time range
 */
export async function checkFacilityAddonAvailability(
  facilityId: string,
  date: string,
  startTime: string,
  durationHours: number,
  excludeReservationId?: string
): Promise<ActionResult<AvailabilityResult>> {
  try {
    // Calculate end time - properly handle minutes for 30-min intervals
    const [hours, minutes] = startTime.split(':').map(Number)
    const startMinutes = hours * 60 + (minutes || 0)
    const endMinutes = startMinutes + (durationHours * 60)
    const endHours = Math.floor(endMinutes / 60)
    const endMins = endMinutes % 60
    const endTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`

    // Extract YYYY-MM-DD from date string (handle both ISO and YYYY-MM-DD format)
    const dateOnly = date.includes('T') ? date.split('T')[0] : date

    const conflictingReservations = await prisma.reservation.findMany({
      where: {
        reservation_date: new Date(dateOnly),
        status: {
          in: ['pending', 'confirmed', 'in_progress']
        },
        id: excludeReservationId ? { not: excludeReservationId } : undefined,
        reservation_addons: {
          some: {
            addon: {
              facility_id: facilityId
            },
            AND: [
              {
                OR: [
                  // Check if start_time or end_time exist for time-based addons
                  {
                    AND: [
                      { start_time: { not: null } },
                      { end_time: { not: null } }
                    ]
                  }
                ]
              }
            ]
          }
        }
      },
      include: {
        customer: {
          select: {
            full_name: true
          }
        },
        reservation_addons: {
          where: {
            addon: {
              facility_id: facilityId
            },
            start_time: { not: null },
            end_time: { not: null }
          },
          include: {
            addon: {
              select: {
                name: true,
                facility_id: true
              }
            }
          }
        }
      }
    })

    const requestStartMinutes = startMinutes
    const requestEndMinutes = endMinutes

    const conflicts = conflictingReservations.filter(reservation => {
      return reservation.reservation_addons.some(resAddon => {
        if (!resAddon.start_time || !resAddon.end_time) {
          return false
        }

        // Convert addon times to minutes
        const addonStart = resAddon.start_time as unknown as Date
        const addonEnd = resAddon.end_time as unknown as Date

        // Use LOCAL hours, not UTC hours
        // TIME data in database is stored without timezone, treat as local time
        const addonStartMinutes = addonStart.getHours() * 60 + addonStart.getMinutes()
        const addonEndMinutes = addonEnd.getHours() * 60 + addonEnd.getMinutes()

        // Check for overlap: (start1 < end2) AND (end1 > start2)
        const overlaps = (requestStartMinutes < addonEndMinutes) && (requestEndMinutes > addonStartMinutes)

        return overlaps
      })
    })

    if (conflicts.length > 0) {
      return {
        success: true,
        data: {
          available: false,
          conflictingBookings: conflicts.map(res => ({
            booking_code: res.booking_code,
            customer_name: res.customer?.full_name || 'Unknown',
            time_range: res.reservation_addons
              .filter(ra => ra.start_time && ra.end_time)
              .map(ra => {
                const start = ra.start_time as unknown as Date
                const end = ra.end_time as unknown as Date
                // ✅ FIX: Use LOCAL hours for display
                return `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')} - ${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`
              })
              .join(', ')
          }))
        }
      }
    }

    return {
      success: true,
      data: {
        available: true
      }
    }
  } catch (error: any) {
    console.error('Error checking facility addon availability:', error)
    return {
      success: false,
      error: error.message || 'Failed to check availability'
    }
  }
}

/**
 * Generate available time slots for a facility-based addon on a specific date
 * OPTIMIZED: Fetch all data once, then check in-memory (like package timeslots)
 */
export async function getAvailableTimeSlots(
  facilityId: string,
  studioId: string,
  date: string,
  durationHours: number,
  excludeReservationId?: string
): Promise<ActionResult<TimeSlot[]>> {
  try {
    // Extract YYYY-MM-DD from date string (handle both ISO and YYYY-MM-DD format)
    const dateOnly = date.includes('T') ? date.split('T')[0] : date

    // Fetch all data once (parallel)
    const [studioData, allConflictingReservations] = await Promise.all([
      // Get studio operating hours
      prisma.studio.findUnique({
        where: { id: studioId },
        select: { operating_hours: true }
      }),

      // Get ALL reservations that might conflict with this facility on this date
      prisma.reservation.findMany({
        where: {
          reservation_date: new Date(dateOnly),
          status: {
            in: ['pending', 'confirmed', 'in_progress']
          },
          id: excludeReservationId ? { not: excludeReservationId } : undefined,
          reservation_addons: {
            some: {
              addon: {
                facility_id: facilityId
              },
              AND: [
                { start_time: { not: null } },
                { end_time: { not: null } }
              ]
            }
          }
        },
        include: {
          customer: {
            select: {
              full_name: true
            }
          },
          reservation_addons: {
            where: {
              addon: {
                facility_id: facilityId
              },
              start_time: { not: null },
              end_time: { not: null }
            },
            include: {
              addon: {
                select: {
                  name: true,
                  facility_id: true
                }
              }
            }
          }
        }
      })
    ])

    if (!studioData) {
      return { success: false, error: 'Studio not found' }
    }

    // Default operating hours if not set
    const defaultHours = {
      monday: { open: '09:00', close: '21:00', isOpen: true },
      tuesday: { open: '09:00', close: '21:00', isOpen: true },
      wednesday: { open: '09:00', close: '21:00', isOpen: true },
      thursday: { open: '09:00', close: '21:00', isOpen: true },
      friday: { open: '09:00', close: '21:00', isOpen: true },
      saturday: { open: '09:00', close: '21:00', isOpen: true },
      sunday: { open: '09:00', close: '21:00', isOpen: true }
    }

    const operatingHours = (studioData.operating_hours as any) || defaultHours

    // Get day of week for the date (use dateOnly to avoid timezone shift)
    const dateObj = new Date(dateOnly)
    const dayOfWeek = dateObj.getDay() // 0 = Sunday, 1 = Monday, etc
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const dayName = dayNames[dayOfWeek]
    const dayHours = operatingHours[dayName]

    // Check if studio is open on this day
    if (!dayHours || !dayHours.isOpen) {
      return {
        success: true,
        data: []
      }
    }

    // Parse operating hours
    const [openHour, openMinute] = dayHours.open.split(':').map(Number)
    const [closeHour, closeMinute] = dayHours.close.split(':').map(Number)

    const slots: TimeSlot[] = []

    // Convert to minutes for easier calculation
    const openingMinutes = openHour * 60 + (openMinute || 0)
    const closingMinutes = closeHour * 60 + (closeMinute || 0)
    const durationMinutes = durationHours * 60
    const slotInterval = 30 // 30 minutes interval

    // Loop with 30-min intervals
    for (let currentMinutes = openingMinutes; currentMinutes <= closingMinutes - durationMinutes; currentMinutes += slotInterval) {
      // Convert minutes back to HH:MM format
      const hours = Math.floor(currentMinutes / 60)
      const minutes = currentMinutes % 60
      const time = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`

      // Calculate end time
      const endTotalMinutes = currentMinutes + durationMinutes
      const endHours = Math.floor(endTotalMinutes / 60)
      const endMinutes = endTotalMinutes % 60
      const endTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`

      // Calculate time range in minutes for this slot
      const requestStartMinutes = currentMinutes
      const requestEndMinutes = endTotalMinutes

      // Check for conflicts in-memory (same logic as checkFacilityAddonAvailability)
      const conflicts = allConflictingReservations.filter(reservation => {
        return reservation.reservation_addons.some(resAddon => {
          console.log(`🔎 Checking addon for ${time}:`, {
            addonName: resAddon.addon?.name,
            hasStartTime: !!resAddon.start_time,
            hasEndTime: !!resAddon.end_time,
            start_time: resAddon.start_time,
            end_time: resAddon.end_time
          })

          if (!resAddon.start_time || !resAddon.end_time) {
            console.log(`⚠️ Skipping addon - missing time data`)
            return false
          }

          // Convert addon times to minutes
          const addonStart = resAddon.start_time as unknown as Date
          const addonEnd = resAddon.end_time as unknown as Date

          console.log(`🕐 Addon time objects:`, {
            addonStart,
            addonEnd,
            addonStartType: typeof addonStart,
            addonEndType: typeof addonEnd,
            isStartDate: addonStart instanceof Date,
            isEndDate: addonEnd instanceof Date,
            utcHours: addonStart.getUTCHours(),
            localHours: addonStart.getHours()
          })

          // ✅ FIX: Use LOCAL hours, not UTC hours!
          // TIME data in database is stored without timezone, treat as local time
          const addonStartMinutes = addonStart.getHours() * 60 + addonStart.getMinutes()
          const addonEndMinutes = addonEnd.getHours() * 60 + addonEnd.getMinutes()

          console.log(`📊 Time comparison for ${time}:`, {
            requestStart: `${time} (${requestStartMinutes} min)`,
            requestEnd: `${endTime} (${requestEndMinutes} min)`,
            addonStart: `${String(addonStart.getHours()).padStart(2, '0')}:${String(addonStart.getMinutes()).padStart(2, '0')} (${addonStartMinutes} min) [Local]`,
            addonEnd: `${String(addonEnd.getHours()).padStart(2, '0')}:${String(addonEnd.getMinutes()).padStart(2, '0')} (${addonEndMinutes} min) [Local]`,
            condition1: `${requestStartMinutes} < ${addonEndMinutes} = ${requestStartMinutes < addonEndMinutes}`,
            condition2: `${requestEndMinutes} > ${addonStartMinutes} = ${requestEndMinutes > addonStartMinutes}`
          })

          // Check for overlap: (start1 < end2) AND (end1 > start2)
          const overlaps = (requestStartMinutes < addonEndMinutes) && (requestEndMinutes > addonStartMinutes)

          if (overlaps) {
            console.log('💥 CONFLICT DETECTED!', {
              time,
              existingBooking: reservation.booking_code,
              existingTime: `${String(addonStart.getHours()).padStart(2, '0')}:${String(addonStart.getMinutes()).padStart(2, '0')} - ${String(addonEnd.getHours()).padStart(2, '0')}:${String(addonEnd.getMinutes()).padStart(2, '0')} [Local]`,
              requestedTime: `${time} - ${endTime}`
            })
          } else {
            console.log('✅ No overlap for', time)
          }

          return overlaps
        })
      })

      const available = conflicts.length === 0
      const conflictingBooking = conflicts[0]?.booking_code

      slots.push({
        time,
        available,
        conflictingBooking
      })

      // Summary log only (detailed logs above)
      if (available) {
        console.log(`✅ SLOT AVAILABLE: ${time} - ${endTime}`)
      } else {
        console.log(`❌ SLOT UNAVAILABLE: ${time} - ${endTime} (conflict with ${conflictingBooking})`)
      }
    }

    console.log('📊 Total slots generated:', slots.length, '| Available:', slots.filter(s => s.available).length)

    return {
      success: true,
      data: slots
    }
  } catch (error: any) {
    console.error('Error generating available time slots:', error)
    return {
      success: false,
      error: error.message || 'Failed to generate time slots'
    }
  }
}

/**
 * Get addon details including pricing type
 */
export async function getAddonDetails(addonId: string): Promise<ActionResult<{
  id: string
  name: string
  pricing_type: string
  price: number
  hourly_rate: number | null
  facility_id: string | null
  facility?: {
    id: string
    name: string
  }
}>> {
  try {
    const addon = await prisma.addon.findUnique({
      where: { id: addonId },
      include: {
        facility: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!addon) {
      return {
        success: false,
        error: 'Addon not found'
      }
    }

    return {
      success: true,
      data: {
        id: addon.id,
        name: addon.name,
        pricing_type: addon.pricing_type || 'per_item',
        price: Number(addon.price),
        hourly_rate: addon.hourly_rate ? Number(addon.hourly_rate) : null,
        facility_id: addon.facility_id,
        facility: addon.facility || undefined
      }
    }
  } catch (error: any) {
    console.error('Error getting addon details:', error)
    return {
      success: false,
      error: error.message || 'Failed to get addon details'
    }
  }
}
