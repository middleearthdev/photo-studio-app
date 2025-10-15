"use server"

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { format } from 'date-fns'

export interface Reservation {
  id: string
  booking_code: string
  invoice_number: string | null
  studio_id: string
  customer_id: string
  user_id: string | null
  package_id: string | null
  is_guest_booking: boolean
  guest_email: string | null
  guest_phone: string | null
  reservation_date: string
  start_time: string
  end_time: string
  total_duration: number
  selected_facilities: any
  package_price: number
  facility_addon_total: number
  other_addon_total: number
  subtotal: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  dp_amount: number
  remaining_amount: number
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  payment_status: 'pending' | 'paid' | 'partial' | 'failed' | 'cancelled' | 'refunded'
  special_requests: string | null
  notes: string | null
  internal_notes: string | null
  confirmed_at: string | null
  completed_at: string | null
  cancelled_at: string | null
  created_at: string
  updated_at: string
  // Relations
  studio?: {
    id: string
    name: string
  }
  customer?: {
    id: string
    full_name: string
    email: string
    phone: string
  }
  package?: {
    id: string
    name: string
    duration_minutes: number
  }
  reservation_addons?: ReservationAddon[]
}

export interface ReservationAddon {
  id: string
  reservation_id: string
  addon_id: string
  quantity: number
  unit_price: number
  total_price: number
  created_at: string
  addon?: {
    id: string
    name: string
    description: string
  }
}

export interface Customer {
  id: string
  user_id: string | null
  full_name: string
  email: string
  phone: string
  address: string | null
  birth_date: string | null
  notes: string | null
  is_guest: boolean
  guest_token: string | null
  created_at: string
  updated_at: string
}

export interface CreateReservationData {
  // Studio and Package
  studio_id: string
  package_id: string

  // Customer data
  customer_name: string
  customer_email?: string
  customer_phone: string
  customer_notes?: string
  is_guest_booking?: boolean

  // Schedule
  reservation_date: string
  start_time: string
  duration_minutes: number

  // Add-ons
  selected_addons?: {
    addon_id: string
    quantity: number
    unit_price: number
  }[]

  // Facilities
  selected_facilities?: any

  // Pricing
  package_price: number
  dp_percentage: number
  total_addons_price?: number

  // Additional info
  special_requests?: string
  payment_method?: string
  payment_status?: string
  dp_amount?: number

  // Discount info
  discount_id?: string
  discount_amount?: number

  internal_notes?: string
}

export interface ActionResult<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedReservationsParams {
  studioId: string
  page?: number
  pageSize?: number
  search?: string
  status?: string
  payment_status?: string
  booking_type?: 'guest' | 'user' | 'all'
  date_from?: string
  date_to?: string
}

export interface PaginatedReservationsResult {
  data: Reservation[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

// Helper function to generate booking code
function generateBookingCode(): string {
  const timestamp = Date.now().toString()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `BK-${timestamp.slice(-6)}${random}`
}

// Helper function to calculate end time
function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(':').map(Number)
  const startDate = new Date()
  startDate.setHours(hours, minutes, 0, 0)

  const endDate = new Date(startDate.getTime() + durationMinutes * 60000)
  return format(endDate, 'HH:mm')
}

function convertTimeToDateTime(timeString: string, baseDate?: Date): Date {
  const [hours, minutes] = timeString.split(':').map(Number)
  const date = baseDate || new Date()
  date.setHours(hours, minutes, 0, 0)
  return date
}

function transformReservationForClient(reservation: any) {
  return {
    ...reservation,
    // Convert Decimal fields to numbers
    package_price: Number(reservation.package_price),
    facility_addon_total: Number(reservation.facility_addon_total || 0),
    other_addon_total: Number(reservation.other_addon_total || 0),
    subtotal: Number(reservation.subtotal),
    tax_amount: Number(reservation.tax_amount || 0),
    discount_amount: Number(reservation.discount_amount || 0),
    total_amount: Number(reservation.total_amount),
    dp_amount: Number(reservation.dp_amount),
    remaining_amount: Number(reservation.remaining_amount),
    // Convert Date fields to ISO strings
    reservation_date: reservation.reservation_date instanceof Date
      ? reservation.reservation_date.toISOString().split('T')[0]
      : reservation.reservation_date,
    start_time: reservation.start_time instanceof Date
      ? format(reservation.start_time, 'HH:mm')
      : reservation.start_time,
    end_time: reservation.end_time instanceof Date
      ? format(reservation.end_time, 'HH:mm')
      : reservation.end_time,
    created_at: reservation.created_at instanceof Date
      ? reservation.created_at.toISOString()
      : reservation.created_at,
    updated_at: reservation.updated_at instanceof Date
      ? reservation.updated_at.toISOString()
      : reservation.updated_at,
    confirmed_at: reservation.confirmed_at instanceof Date
      ? reservation.confirmed_at.toISOString()
      : reservation.confirmed_at,
    completed_at: reservation.completed_at instanceof Date
      ? reservation.completed_at.toISOString()
      : reservation.completed_at,
    cancelled_at: reservation.cancelled_at instanceof Date
      ? reservation.cancelled_at.toISOString()
      : reservation.cancelled_at,
    // Transform package data if present
    package: reservation.package ? {
      ...reservation.package,
      price: reservation.package.price ? Number(reservation.package.price) : undefined
    } : reservation.package,
    // Transform reservation addons
    reservation_addons: reservation.reservation_addons?.map((addon: any) => ({
      ...addon,
      unit_price: Number(addon.unit_price),
      total_price: Number(addon.total_price),
      created_at: addon.created_at instanceof Date
        ? addon.created_at.toISOString()
        : addon.created_at
    })) || []
  }
}

export async function getPaginatedReservationsAction(
  params: PaginatedReservationsParams
): Promise<ActionResult<PaginatedReservationsResult>> {
  try {
    // Get current user to check permissions
    const session = await auth.api.getSession({
      headers: await headers()
    })
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current user profile
    const currentProfile = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, studio_id: true }
    })

    if (!currentProfile || !['admin', 'cs'].includes(currentProfile.role)) {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Set pagination defaults
    const page = params.page || 1
    const pageSize = params.pageSize || 10
    const skip = (page - 1) * pageSize

    // Build where conditions
    const where: any = {}

    // Studio filter - CS users can only see their studio
    if (currentProfile.role === 'cs') {
      where.studio_id = currentProfile.studio_id
    } else if (params.studioId) {
      where.studio_id = params.studioId
    }

    // Search filter
    if (params.search) {
      where.OR = [
        { booking_code: { contains: params.search, mode: 'insensitive' } },
        { guest_email: { contains: params.search, mode: 'insensitive' } },
        { guest_phone: { contains: params.search, mode: 'insensitive' } },
        { customer: { full_name: { contains: params.search, mode: 'insensitive' } } },
        { customer: { email: { contains: params.search, mode: 'insensitive' } } },
        { customer: { phone: { contains: params.search, mode: 'insensitive' } } }
      ]
    }

    // Status filter
    if (params.status && params.status !== 'all') {
      where.status = params.status
    }

    // Payment status filter
    if (params.payment_status && params.payment_status !== 'all') {
      where.payment_status = params.payment_status
    }

    // Booking type filter
    if (params.booking_type && params.booking_type !== 'all') {
      const isGuest = params.booking_type === 'guest'
      where.is_guest_booking = isGuest
    }

    // Date range filters
    if (params.date_from || params.date_to) {
      where.reservation_date = {}
      if (params.date_from) {
        where.reservation_date.gte = new Date(params.date_from)
      }
      if (params.date_to) {
        where.reservation_date.lte = new Date(params.date_to)
      }
    }

    // Execute query with count
    const [reservations, total] = await Promise.all([
      prisma.reservation.findMany({
        where,
        include: {
          studio: { select: { id: true, name: true } },
          customer: { select: { id: true, full_name: true, email: true, phone: true } },
          package: { select: { id: true, name: true, duration_minutes: true } },
          reservation_addons: {
            include: {
              addon: { select: { id: true, name: true, description: true } }
            }
          }
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: pageSize
      }),
      prisma.reservation.count({ where })
    ])

    const totalPages = Math.ceil(total / pageSize)

    return {
      success: true,
      data: {
        data: reservations.map(transformReservationForClient),
        pagination: {
          page,
          pageSize,
          total,
          totalPages
        }
      }
    }
  } catch (error: any) {
    console.error('Error in getPaginatedReservationsAction:', error)
    return { success: false, error: error.message || 'An error occurred' }
  }
}

// Admin/Staff action to create manual reservation (for manual booking by CS/Admin)
export async function createManualReservationAction(data: CreateReservationData): Promise<ActionResult<{ reservation: Reservation; customer: Customer; payment?: any }>> {
  try {
    // Get current user to check permissions
    const session = await auth.api.getSession({
      headers: await headers()
    })
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current user profile
    const currentProfile = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, studio_id: true }
    })

    if (!currentProfile || !['admin', 'cs'].includes(currentProfile.role)) {
      return { success: false, error: 'Insufficient permissions' }
    }

    // For CS users, ensure they can only create reservations for their studio
    if (currentProfile.role === 'cs' && data.studio_id !== currentProfile.studio_id) {
      return { success: false, error: 'Cannot create reservation for different studio' }
    }

    // Generate booking code
    const bookingCode = generateBookingCode()
    const endTime = calculateEndTime(data.start_time, data.duration_minutes)

    // Get package facilities
    const packageFacilities = await prisma.packageFacility.findMany({
      where: { package_id: data.package_id },
      include: {
        facility: { select: { id: true, name: true, description: true } }
      }
    })

    // Format selected facilities for storage
    const selectedFacilities = packageFacilities?.map(pf => pf.facility) || []

    // Calculate pricing - for manual booking, use provided values directly
    const packagePrice = data.package_price
    const addonsTotal = data.total_addons_price || 0
    const subtotal = packagePrice + addonsTotal
    const taxAmount = 0 // No tax for now
    const discountAmount = data.discount_amount || 0
    const totalAmount = subtotal + taxAmount - discountAmount

    // Use provided DP amount or calculate default
    const dpAmount = data.dp_amount !== undefined ? data.dp_amount : Math.round(totalAmount * data.dp_percentage / 100)
    const remainingAmount = totalAmount - dpAmount

    // Create customer first
    const customerData = await prisma.customer.create({
      data: {
        full_name: data.customer_name,
        email: data.customer_email || '',
        phone: data.customer_phone,
        notes: data.customer_notes || '',
        is_guest: data.is_guest_booking || true
      }
    })

    // Create reservation with manual booking specific fields
    const reservationData = await prisma.reservation.create({
      data: {
        booking_code: bookingCode,
        studio_id: data.studio_id,
        customer_id: customerData.id,
        user_id: session.user.id, // Set user_id to current staff member
        package_id: data.package_id,
        reservation_date: new Date(data.reservation_date),
        start_time: convertTimeToDateTime(data.start_time),
        end_time: convertTimeToDateTime(endTime),
        total_duration: data.duration_minutes,
        selected_facilities: selectedFacilities,
        package_price: packagePrice,
        other_addon_total: addonsTotal,
        subtotal: subtotal,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        dp_amount: dpAmount,
        remaining_amount: remainingAmount,
        special_requests: data.special_requests || '',
        internal_notes: data.internal_notes || '',
        guest_email: data.customer_email || '',
        guest_phone: data.customer_phone,
        is_guest_booking: data.is_guest_booking || true,
        status: 'confirmed', // Manual bookings are auto-confirmed
        payment_status: data.payment_status === 'completed' ? 'paid' :
          data.payment_status === 'partial' ? 'partial' : 'pending',
        discount_id: data.discount_id
      }
    })

    // Add reservation add-ons if any
    if (data.selected_addons && data.selected_addons.length > 0) {
      const addonInserts = data.selected_addons.map(addon => ({
        reservation_id: reservationData.id,
        addon_id: addon.addon_id,
        quantity: addon.quantity,
        unit_price: addon.unit_price,
        total_price: addon.unit_price * addon.quantity
      }))

      await prisma.reservationAddon.createMany({
        data: addonInserts,
        skipDuplicates: true
      })
    }

    console.log(data)

    // Create payment record for manual booking if payment method is provided
    if (data.payment_method && data.payment_status && dpAmount > 0) {
      try {
        await prisma.payment.create({
          data: {
            reservation_id: reservationData.id,
            payment_method_id: data.payment_method,
            amount: dpAmount,
            payment_type: data.payment_status === 'paid' ? 'full' : 'dp',
            status: 'paid', // Manual payments are marked as paid
            paid_at: new Date(),
          }
        })
      } catch (paymentError) {
        console.error('Error creating payment record:', paymentError)
        // Don't fail reservation creation for payment record error
      }
    }

    // Update discount usage if discount was applied
    if (data.discount_id) {
      try {
        await prisma.discount.update({
          where: { id: data.discount_id },
          data: {
            used_count: {
              increment: 1
            },
            updated_at: new Date()
          }
        })
      } catch (discountError) {
        console.error('Error updating discount usage:', discountError)
        // Don't fail reservation creation for discount update error
      }
    }

    // Fetch the created reservation with all relations
    const createdReservation = await prisma.reservation.findUnique({
      where: { id: reservationData.id },
      include: {
        studio: { select: { id: true, name: true } },
        customer: { select: { id: true, full_name: true, email: true, phone: true } },
        package: { select: { id: true, name: true, duration_minutes: true } },
        reservation_addons: {
          include: {
            addon: { select: { id: true, name: true, description: true } }
          }
        }
      }
    })

    if (!createdReservation) {
      return { success: false, error: 'Reservation created but failed to fetch details' }
    }

    revalidatePath('/admin/reservations')
    revalidatePath('/cs/reservations')
    revalidatePath('/booking')

    // Return the reservation and customer data
    return {
      success: true,
      data: {
        reservation: transformReservationForClient(createdReservation),
        customer: customerData as any
      }
    }
  } catch (error: any) {
    console.error('Error in createManualReservationAction:', error)
    return { success: false, error: error.message || 'Failed to create manual reservation' }
  }
}

// Public action to create a new reservation (for guest booking)
export async function createReservationAction(data: CreateReservationData): Promise<ActionResult<{ reservation: Reservation; customer: Customer; payment?: any }>> {
  try {
    // Generate booking code
    const bookingCode = generateBookingCode()
    const endTime = calculateEndTime(data.start_time, data.duration_minutes)

    // Get package facilities
    const packageFacilities = await prisma.packageFacility.findMany({
      where: { package_id: data.package_id },
      include: {
        facility: { select: { id: true, name: true, description: true } }
      }
    })

    // Format selected facilities for storage
    const selectedFacilities = packageFacilities?.map(pf => pf.facility) || []

    // Calculate pricing
    const packagePrice = data.package_price
    const addonsTotal = data.total_addons_price || 0
    const subtotal = packagePrice + addonsTotal
    const taxAmount = 0 // No tax for now
    const discountAmount = data.discount_amount || 0 // Use discount from form
    const totalAmount = subtotal + taxAmount - discountAmount
    const dpAmount = Math.round(totalAmount * data.dp_percentage / 100)
    const remainingAmount = totalAmount - dpAmount

    // Create customer first
    const customerData = await prisma.customer.create({
      data: {
        full_name: data.customer_name,
        email: data.customer_email || '',
        phone: data.customer_phone,
        notes: data.customer_notes || '',
        is_guest: data.is_guest_booking || true
      }
    })

    // Create reservation
    const reservationData = await prisma.reservation.create({
      data: {
        booking_code: bookingCode,
        studio_id: data.studio_id,
        customer_id: customerData.id,
        package_id: data.package_id,
        reservation_date: new Date(data.reservation_date),
        start_time: convertTimeToDateTime(data.start_time),
        end_time: convertTimeToDateTime(endTime),
        total_duration: data.duration_minutes,
        selected_facilities: selectedFacilities,
        package_price: packagePrice,
        other_addon_total: addonsTotal,
        subtotal: subtotal,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        dp_amount: dpAmount,
        remaining_amount: remainingAmount,
        special_requests: data.special_requests || '',
        guest_email: data.customer_email || '',
        guest_phone: data.customer_phone,
        is_guest_booking: data.is_guest_booking || true,
        discount_id: data.discount_id
      }
    })

    // Add reservation add-ons if any
    if (data.selected_addons && data.selected_addons.length > 0) {
      const addonInserts = data.selected_addons.map(addon => ({
        reservation_id: reservationData.id,
        addon_id: addon.addon_id,
        quantity: addon.quantity,
        unit_price: addon.unit_price,
        total_price: addon.unit_price * addon.quantity
      }))

      await prisma.reservationAddon.createMany({
        data: addonInserts,
        skipDuplicates: true
      })
    }

    // Update discount usage if discount was applied
    if (data.discount_id) {
      try {
        await prisma.discount.update({
          where: { id: data.discount_id },
          data: {
            used_count: {
              increment: 1
            },
            updated_at: new Date()
          }
        })
      } catch (discountError) {
        console.error('Error updating discount usage:', discountError)
        // Don't fail reservation creation for discount update error
      }
    }

    // Fetch the created reservation with all relations
    const createdReservation = await prisma.reservation.findUnique({
      where: { id: reservationData.id },
      include: {
        studio: { select: { id: true, name: true } },
        customer: { select: { id: true, full_name: true, email: true, phone: true } },
        package: { select: { id: true, name: true, duration_minutes: true } },
        reservation_addons: {
          include: {
            addon: { select: { id: true, name: true, description: true } }
          }
        }
      }
    })

    if (!createdReservation) {
      return { success: false, error: 'Reservation created but failed to fetch details' }
    }

    revalidatePath('/admin/reservations')
    revalidatePath('/booking')

    // Return the reservation and customer data
    return {
      success: true,
      data: {
        reservation: transformReservationForClient(createdReservation),
        customer: customerData as any
      }
    }
  } catch (error: any) {
    console.error('Error in createReservationAction:', error)
    return { success: false, error: error.message || 'Failed to create reservation' }
  }
}

// Public action to get reservation by booking code (for guest access)
export async function getReservationByBookingCodeAction(bookingCode: string): Promise<ActionResult<Reservation>> {
  try {
    const reservation = await prisma.reservation.findUnique({
      where: { booking_code: bookingCode },
      include: {
        studio: { select: { id: true, name: true } },
        customer: { select: { id: true, full_name: true, email: true, phone: true } },
        package: { select: { id: true, name: true, duration_minutes: true } },
        reservation_addons: {
          include: {
            addon: { select: { id: true, name: true, description: true } }
          }
        }
      }
    })

    if (!reservation) {
      return { success: false, error: 'Reservation not found' }
    }

    return { success: true, data: transformReservationForClient(reservation) }
  } catch (error: any) {
    console.error('Error in getReservationByBookingCodeAction:', error)
    return { success: false, error: error.message || 'An error occurred' }
  }
}

// Admin/Staff action to get all reservations
export async function getReservationsAction(
  studioId?: string,
  status?: string,
  date?: string
): Promise<ActionResult<Reservation[]>> {
  try {
    // Get current user to check permissions
    const session = await auth.api.getSession({
      headers: await headers()
    })
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current user profile
    const currentProfile = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, studio_id: true }
    })

    if (!currentProfile || !['admin', 'cs'].includes(currentProfile.role)) {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Build where conditions
    const where: any = {}

    // Filter by studio - admin can see all, cs only their studio
    if (currentProfile.role === 'cs') {
      where.studio_id = currentProfile.studio_id
    } else if (studioId) {
      where.studio_id = studioId
    }

    // Filter by status if specified
    if (status) {
      where.status = status
    }

    // Filter by date if specified
    if (date) {
      where.reservation_date = new Date(date)
    }

    const reservations = await prisma.reservation.findMany({
      where,
      include: {
        studio: { select: { id: true, name: true } },
        customer: { select: { id: true, full_name: true, email: true, phone: true } },
        package: { select: { id: true, name: true, duration_minutes: true } },
        reservation_addons: {
          include: {
            addon: { select: { id: true, name: true, description: true } }
          }
        }
      },
      orderBy: { created_at: 'desc' }
    })

    return { success: true, data: reservations.map(transformReservationForClient) }
  } catch (error: any) {
    console.error('Error in getReservationsAction:', error)
    return { success: false, error: error.message || 'An error occurred' }
  }
}

// Admin/Staff action to update reservation status
export async function updateReservationStatusAction(
  reservationId: string,
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show',
  notes?: string
): Promise<ActionResult<Reservation>> {
  try {
    // Get current user to check permissions
    const session = await auth.api.getSession({
      headers: await headers()
    })
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current user profile
    const currentProfile = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, studio_id: true }
    })

    if (!currentProfile || !['admin', 'cs'].includes(currentProfile.role)) {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Prepare update data
    const updateData: any = {
      status,
      updated_at: new Date()
    }

    if (notes) {
      updateData.internal_notes = notes
    }

    // Set timestamp for status changes
    if (status === 'confirmed') {
      updateData.confirmed_at = new Date()
    } else if (status === 'completed') {
      updateData.completed_at = new Date()
    } else if (status === 'cancelled') {
      updateData.cancelled_at = new Date()
    }

    // Get current reservation data to check for discount usage
    const currentReservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      select: { discount_id: true, status: true }
    })

    if (!currentReservation) {
      return { success: false, error: 'Reservation not found' }
    }

    // Build where conditions with studio check for CS users
    const where: any = { id: reservationId }
    if (currentProfile.role === 'cs') {
      where.studio_id = currentProfile.studio_id
    }

    // Update payment status to cancelled if reservation is being cancelled
    if (status === 'cancelled' && currentReservation.status == 'pending') {
      try {
        await prisma.payment.updateMany({
          where: {
            reservation_id: reservationId,
            status: {
              in: ['pending', 'partial', 'paid'] // Only update non-failed payments
            }
          },
          data: {
            status: 'cancelled',
            updated_at: new Date()
          }
        })
      } catch (paymentError) {
        console.error('Error updating payment status on cancellation:', paymentError)
        // Don't fail reservation cancellation for payment update error
      }
    }

    const updatedReservation = await prisma.reservation.update({
      where,
      data: updateData,
      include: {
        studio: { select: { id: true, name: true } },
        customer: { select: { id: true, full_name: true, email: true, phone: true } },
        package: { select: { id: true, name: true, duration_minutes: true } },
        reservation_addons: {
          select: {
            id: true,
            addon_id: true,
            quantity: true,
            unit_price: true,
            total_price: true,
            addon: { select: { id: true, name: true, description: true } }
          }
        }
      }
    })

    // Update discount usage if reservation is being cancelled and had a discount
    if (status === 'cancelled' && currentReservation.discount_id && currentReservation.status !== 'cancelled') {
      try {
        await prisma.discount.update({
          where: { id: currentReservation.discount_id },
          data: {
            used_count: {
              decrement: 1
            },
            updated_at: new Date()
          }
        })
      } catch (discountError) {
        console.error('Error updating discount usage on cancellation:', discountError)
        // Don't fail reservation status update for discount update error
      }
    }

    revalidatePath('/admin/reservations')
    return { success: true, data: transformReservationForClient(updatedReservation) }
  } catch (error: any) {
    console.error('Error in updateReservationStatusAction:', error)
    return { success: false, error: error.message || 'Failed to update reservation status' }
  }
}
// Admin/Staff action to update reservation status based on payment completion
export async function updateReservationStatusOnPayment(
  reservationId: string,
  paymentStatus: 'pending' | 'partial' | 'paid' | 'failed'
): Promise<ActionResult> {
  try {
    // If payment is completed, we might want to update the reservation status as well
    if (paymentStatus === 'paid') {
      // Get reservation details to check current status
      const reservation = await prisma.reservation.findUnique({
        where: { id: reservationId },
        select: { status: true }
      })

      if (!reservation) {
        return { success: false, error: 'Failed to fetch reservation' }
      }

      // If reservation is still pending, confirm it since payment is completed
      if (reservation.status === 'pending') {
        try {
          await prisma.reservation.update({
            where: { id: reservationId },
            data: {
              status: 'confirmed',
              updated_at: new Date()
            }
          })
          console.log(`Reservation ${reservationId} confirmed automatically due to completed payment`)
        } catch (updateError) {
          console.error('Error confirming reservation:', updateError)
          // Continue with payment status update even if reservation confirmation fails
        }
        paymentStatus = 'partial';
      }
    }

    // Update payment status using webhook-specific function
    return await updateReservationPaymentStatusFromWebhook(reservationId, paymentStatus)
  } catch (error: any) {
    console.error('Error in updateReservationStatusOnPayment:', error)
    return { success: false, error: error.message || 'Failed to update reservation status' }
  }
}

// Webhook-specific function to update reservation payment status (no auth required)
export async function updateReservationPaymentStatusFromWebhook(
  reservationId: string,
  paymentStatus: 'pending' | 'partial' | 'paid' | 'failed'
): Promise<ActionResult> {
  try {
    // Update reservation payment status
    const data = await prisma.reservation.update({
      where: { id: reservationId },
      data: {
        payment_status: paymentStatus as any,
        updated_at: new Date()
      }
    })

    console.log(`Reservation ${reservationId} payment status updated to ${paymentStatus} via webhook`)
    return { success: true, data }
  } catch (error: any) {
    console.error('Error in updateReservationPaymentStatusFromWebhook:', error)
    return { success: false, error: error.message || 'Failed to update reservation payment status from webhook' }
  }
}

// Admin/Staff action to update reservation payment status
export async function updateReservationPaymentStatus(
  reservationId: string,
  paymentStatus: 'pending' | 'partial' | 'paid' | 'failed'
): Promise<ActionResult> {
  try {
    // Get current user to check permissions
    const session = await auth.api.getSession({
      headers: await headers()
    })
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current user profile
    const currentProfile = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, studio_id: true }
    })

    if (!currentProfile || !['admin', 'cs'].includes(currentProfile.role)) {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Build where conditions with studio check for CS users
    const where: any = { id: reservationId }
    if (currentProfile.role === 'cs') {
      where.studio_id = currentProfile.studio_id
    }

    await prisma.reservation.update({
      where,
      data: {
        payment_status: paymentStatus as any,
        updated_at: new Date()
      }
    })

    revalidatePath('/admin/reservations')
    revalidatePath('/admin/payments')
    return { success: true }
  } catch (error: any) {
    console.error('Error in updateReservationPaymentStatus:', error)
    return { success: false, error: error.message || 'Failed to update reservation payment status' }
  }
}

// Admin/Staff action to update reservation details
export async function updateReservationAction(
  reservationId: string,
  updateData: {
    customer_name?: string
    guest_email?: string
    guest_phone?: string
    special_requests?: string
    internal_notes?: string
    reservation_date?: string
    start_time?: string
    end_time?: string
    total_duration?: number
  }
): Promise<ActionResult<Reservation>> {
  try {
    // Get current user to check permissions
    const session = await auth.api.getSession({
      headers: await headers()
    })
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current user profile
    const currentProfile = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, studio_id: true }
    })

    if (!currentProfile || !['admin', 'cs'].includes(currentProfile.role)) {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Build where conditions with studio check for CS users
    const where: any = { id: reservationId }
    if (currentProfile.role === 'cs') {
      where.studio_id = currentProfile.studio_id
    }

    // First get the reservation to check if it's a guest booking
    const currentReservation = await prisma.reservation.findUnique({
      where,
      include: {
        customer: { select: { id: true, full_name: true, email: true, phone: true, is_guest: true } }
      }
    })

    if (!currentReservation) {
      return { success: false, error: 'Reservation not found' }
    }

    // Handle customer info updates for guest bookings
    if (currentReservation.customer?.is_guest) {
      const customerUpdateData: any = {
        updated_at: new Date()
      }

      // Update customer name if provided
      if (updateData.customer_name) {
        customerUpdateData.full_name = updateData.customer_name
      }

      // Update email if provided
      if (updateData.guest_email) {
        customerUpdateData.email = updateData.guest_email
      }

      // Update phone if provided  
      if (updateData.guest_phone) {
        customerUpdateData.phone = updateData.guest_phone
      }

      // Only update customer table if there are actual changes
      if (Object.keys(customerUpdateData).length > 1) { // More than just updated_at
        await prisma.customer.update({
          where: { id: currentReservation.customer_id! },
          data: customerUpdateData
        })
      }
    }

    // Prepare reservation update data (exclude customer_name as it's handled separately)
    const { customer_name, ...reservationUpdateData } = updateData
    const updatePayload: any = {
      ...reservationUpdateData,
      updated_at: new Date()
    }

    // Convert date string to Date object if provided
    if (updatePayload.reservation_date) {
      updatePayload.reservation_date = new Date(updatePayload.reservation_date)
    }

    const updatedReservation = await prisma.reservation.update({
      where,
      data: updatePayload,
      include: {
        studio: { select: { id: true, name: true } },
        customer: { select: { id: true, full_name: true, email: true, phone: true } },
        package: { select: { id: true, name: true, duration_minutes: true } },
        reservation_addons: {
          select: {
            id: true,
            addon_id: true,
            quantity: true,
            unit_price: true,
            total_price: true,
            addon: { select: { id: true, name: true, description: true } }
          }
        }
      }
    })

    revalidatePath('/admin/reservations')
    revalidatePath('/cs/reservations')
    return { success: true, data: transformReservationForClient(updatedReservation) }
  } catch (error: any) {
    console.error('Error in updateReservationAction:', error)
    return { success: false, error: error.message || 'Failed to update reservation' }
  }
}

// Webhook action to cancel reservation due to payment expiration
export async function deleteReservationActionWebhook(reservationId: string): Promise<ActionResult> {
  try {
    // Get reservation details to check status
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      select: { studio_id: true, status: true, payment_status: true }
    })

    if (!reservation) {
      return { success: false, error: 'Reservation not found' }
    }

    // Don't update if reservation is already completed or in progress
    if (['in_progress', 'completed'].includes(reservation.status as string)) {
      return {
        success: false,
        error: 'Cannot cancel reservation that is in progress or completed'
      }
    }

    // Update reservation status to cancelled
    await prisma.reservation.update({
      where: { id: reservationId },
      data: {
        status: 'cancelled',
        payment_status: 'failed',
        cancelled_at: new Date(),
        updated_at: new Date()
      }
    })

    // Update all related payments to failed status
    await prisma.payment.updateMany({
      where: { reservation_id: reservationId },
      data: {
        status: 'failed',
        updated_at: new Date()
      }
    })

    revalidatePath('/admin/reservations')
    revalidatePath('/cs/reservations')

    return { success: true }
  } catch (error: any) {
    console.error('Error in deleteReservationActionWebhook:', error)
    return { success: false, error: error.message || 'Failed to cancel reservation' }
  }
}


// Admin/Staff action to delete reservation
export async function deleteReservationAction(reservationId: string): Promise<ActionResult> {
  try {
    // Get current user to check permissions
    const session = await auth.api.getSession({
      headers: await headers()
    })
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current user profile
    const currentProfile = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, studio_id: true }
    })

    if (!currentProfile || !['admin', 'cs'].includes(currentProfile.role)) {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Get reservation details to check permissions and status
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      select: { studio_id: true, status: true, payment_status: true }
    })

    if (!reservation) {
      return { success: false, error: 'Reservation not found' }
    }

    // CS users can only delete their studio's reservations
    if (currentProfile.role === 'cs' && reservation.studio_id !== currentProfile.studio_id) {
      return { success: false, error: 'Insufficient permissions for this studio' }
    }

    // Prevent deletion of reservations that are in progress or completed
    if (['in_progress', 'completed'].includes(reservation.status as string)) {
      return {
        success: false,
        error: 'Cannot delete reservation that is in progress or completed'
      }
    }

    // Check if reservation has payments
    const payments = await prisma.payment.findMany({
      where: { reservation_id: reservationId },
      select: { id: true, status: true }
    })

    // If there are completed payments, don't allow deletion
    const hasCompletedPayments = payments?.some((p: any) => p.status === 'paid')
    if (hasCompletedPayments) {
      return {
        success: false,
        error: 'Cannot delete reservation with completed payments. Cancel instead.'
      }
    }

    // Delete related data in correct order using transaction
    await prisma.$transaction(async (tx) => {
      // 1. Delete reservation addons
      await tx.reservationAddon.deleteMany({
        where: { reservation_id: reservationId }
      })

      // 2. Delete payments
      await tx.payment.deleteMany({
        where: { reservation_id: reservationId }
      })

      // 3. Delete reservation discounts
      await tx.reservationDiscount.deleteMany({
        where: { reservation_id: reservationId }
      })

      // 4. Delete reviews
      await tx.review.deleteMany({
        where: { reservation_id: reservationId }
      })

      // 5. Delete the reservation
      await tx.reservation.delete({
        where: { id: reservationId }
      })
    })

    revalidatePath('/admin/reservations')
    return { success: true }
  } catch (error: any) {
    console.error('Error in deleteReservationAction:', error)
    return { success: false, error: error.message || 'Failed to delete reservation' }
  }
}

// Reschedule booking action for CS/Admin
export async function rescheduleBookingAction(
  reservationId: string,
  rescheduleData: {
    new_date: string
    new_start_time: string
    new_end_time: string
    reschedule_reason: string
    internal_notes?: string
  }
): Promise<ActionResult<Reservation>> {
  try {
    // Get current user to check permissions
    const session = await auth.api.getSession({
      headers: await headers()
    })
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current user profile
    const currentProfile = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, studio_id: true }
    })

    if (!currentProfile || !['admin', 'cs'].includes(currentProfile.role)) {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Build where conditions with studio check for CS users
    const where: any = { id: reservationId }
    if (currentProfile.role === 'cs') {
      where.studio_id = currentProfile.studio_id
    }

    // Get the current reservation to validate
    const reservation = await prisma.reservation.findUnique({
      where
    })

    if (!reservation) {
      return { success: false, error: 'Reservation not found' }
    }

    // Validate reschedule rules (H-3 rule)
    const reservationDate = new Date(reservation.reservation_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    reservationDate.setHours(0, 0, 0, 0)
    const daysUntilEvent = Math.ceil((reservationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntilEvent < 3) {
      return { success: false, error: 'Reschedule tidak diizinkan, batas waktu H-3 sudah terlewat' }
    }

    if (['completed', 'cancelled'].includes(reservation.status as string)) {
      return { success: false, error: `Cannot reschedule ${reservation.status} booking` }
    }

    // Validate new date is not in the past
    const newDate = new Date(rescheduleData.new_date)
    if (newDate < today) {
      return { success: false, error: 'Cannot reschedule to a past date' }
    }

    // Check if new date/time is different from current
    const currentDateStr = reservation.reservation_date.toISOString().split('T')[0]
    if (rescheduleData.new_date === currentDateStr &&
      rescheduleData.new_start_time === String(reservation.start_time)) {
      return { success: false, error: 'New date and time must be different from current booking' }
    }

    // TODO: Add availability checking logic here
    // For now, we'll assume the slot is available

    // Calculate new total duration
    const startTime = new Date(`${rescheduleData.new_date}T${rescheduleData.new_start_time}`)
    const endTime = new Date(`${rescheduleData.new_date}T${rescheduleData.new_end_time}`)
    const newDuration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60))

    // TODO: Add reschedule history logging when table is available
    // For now, we'll log the reschedule in internal_notes

    // Update the reservation
    const updateData: any = {
      reservation_date: new Date(rescheduleData.new_date),
      start_time: convertTimeToDateTime(rescheduleData.new_start_time),
      end_time: convertTimeToDateTime(rescheduleData.new_end_time),
      total_duration: newDuration,
      updated_at: new Date()
    }

    // Append reschedule info to internal notes
    const rescheduleNote = `RESCHEDULED: ${format(new Date(), 'dd/MM/yyyy HH:mm')} - Reason: ${rescheduleData.reschedule_reason}`
    if (reservation.internal_notes) {
      updateData.internal_notes = `${reservation.internal_notes}\n\n${rescheduleNote}`
    } else {
      updateData.internal_notes = rescheduleNote
    }

    if (rescheduleData.internal_notes) {
      updateData.internal_notes += `\n${rescheduleData.internal_notes}`
    }

    const updatedReservation = await prisma.reservation.update({
      where: { id: reservationId },
      data: updateData,
      include: {
        studio: { select: { id: true, name: true } },
        customer: { select: { id: true, full_name: true, email: true, phone: true } },
        package: { select: { id: true, name: true, duration_minutes: true } }
      }
    })

    // TODO: Send notification to customer about reschedule
    // This could be an email or WhatsApp notification

    revalidatePath('/cs/reservations')
    revalidatePath('/cs/reminders')
    revalidatePath('/admin/reservations')

    return {
      success: true,
      data: transformReservationForClient(updatedReservation),
      message: 'Booking has been rescheduled successfully'
    }
  } catch (error: any) {
    console.error('Error in rescheduleBookingAction:', error)
    return { success: false, error: error.message || 'Failed to reschedule booking' }
  }
}