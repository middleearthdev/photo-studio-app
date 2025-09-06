"use server"

import { createClient } from '@/lib/supabase/server'
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
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  payment_status: 'pending' | 'partial' | 'completed' | 'failed' | 'refunded'
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
  
  // Pricing
  package_price: number
  dp_percentage: number
  total_addons_price?: number
  
  // Additional info
  special_requests?: string
  payment_method?: string
}

export interface ActionResult<T = any> {
  success: boolean
  data?: T
  error?: string
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

// Public action to create a new reservation (for guest booking)
export async function createReservationAction(data: CreateReservationData): Promise<ActionResult<{ reservation: Reservation; customer: Customer }>> {
  try {
    const supabase = await createClient()

    // Generate booking code
    const bookingCode = generateBookingCode()
    const endTime = calculateEndTime(data.start_time, data.duration_minutes)

    // Calculate pricing
    const packagePrice = data.package_price
    const addonsTotal = data.total_addons_price || 0
    const subtotal = packagePrice + addonsTotal
    const taxAmount = 0 // No tax for now
    const discountAmount = 0 // No discount for now
    const totalAmount = subtotal + taxAmount - discountAmount
    const dpAmount = Math.round(totalAmount * data.dp_percentage / 100)
    const remainingAmount = totalAmount - dpAmount

    // Create customer first
    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .insert({
        full_name: data.customer_name,
        email: data.customer_email || '',
        phone: data.customer_phone,
        notes: data.customer_notes || '',
        is_guest: data.is_guest_booking || true
      })
      .select()
      .single()

    if (customerError) {
      console.error('Error creating customer:', customerError)
      return { success: false, error: customerError.message }
    }

    // Create reservation
    const { data: reservationData, error: reservationError } = await supabase
      .from('reservations')
      .insert({
        booking_code: bookingCode,
        studio_id: data.studio_id,
        customer_id: customerData.id,
        package_id: data.package_id,
        reservation_date: data.reservation_date,
        start_time: data.start_time,
        end_time: endTime,
        total_duration: data.duration_minutes,
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
        is_guest_booking: data.is_guest_booking || true
      })
      .select()
      .single()

    if (reservationError) {
      console.error('Error creating reservation:', reservationError)
      return { success: false, error: reservationError.message }
    }

    // Add reservation add-ons if any
    if (data.selected_addons && data.selected_addons.length > 0) {
      const addonInserts = data.selected_addons.map(addon => ({
        reservation_id: reservationData.id,
        addon_id: addon.addon_id,
        quantity: addon.quantity,
        unit_price: addon.unit_price,
        total_price: addon.unit_price * addon.quantity
      }))

      const { error: addonsError } = await supabase
        .from('reservation_addons')
        .insert(addonInserts)

      if (addonsError) {
        console.error('Error adding reservation add-ons:', addonsError)
        // Don't fail the entire operation for add-ons error
      }
    }

    // Fetch the created reservation with all relations
    const { data: createdReservation, error: fetchError } = await supabase
      .from('reservations')
      .select(`
        *,
        studio:studios(id, name),
        customer:customers(id, full_name, email, phone),
        package:packages(id, name, duration_minutes),
        reservation_addons(
          *,
          addon:addons(id, name, description)
        )
      `)
      .eq('id', reservationData.id)
      .single()

    if (fetchError) {
      console.error('Error fetching created reservation:', fetchError)
      return { success: false, error: 'Reservation created but failed to fetch details' }
    }

    revalidatePath('/admin/reservations')
    revalidatePath('/booking')

    return {
      success: true,
      data: {
        reservation: createdReservation,
        customer: customerData
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
    const supabase = await createClient()

    const { data: reservation, error } = await supabase
      .from('reservations')
      .select(`
        *,
        studio:studios(id, name),
        customer:customers(id, full_name, email, phone),
        package:packages(id, name, duration_minutes),
        reservation_addons(
          *,
          addon:addons(id, name, description)
        )
      `)
      .eq('booking_code', bookingCode)
      .single()

    if (error) {
      console.error('Error fetching reservation:', error)
      return { success: false, error: 'Reservation not found' }
    }

    return { success: true, data: reservation }
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
    const supabase = await createClient()

    // Get current user to check permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current user profile
    const { data: currentProfile } = await supabase
      .from('user_profiles')
      .select('role, studio_id')
      .eq('id', user.id)
      .single()

    if (!currentProfile || !['admin', 'cs'].includes(currentProfile.role)) {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Build query
    let query = supabase
      .from('reservations')
      .select(`
        *,
        studio:studios(id, name),
        customer:customers(id, full_name, email, phone),
        package:packages(id, name, duration_minutes),
        reservation_addons(
          *,
          addon:addons(id, name, description)
        )
      `)
      .order('created_at', { ascending: false })

    // Filter by studio - admin can see all, cs only their studio
    if (currentProfile.role === 'cs') {
      query = query.eq('studio_id', currentProfile.studio_id)
    } else if (studioId) {
      query = query.eq('studio_id', studioId)
    }

    // Filter by status if specified
    if (status) {
      query = query.eq('status', status)
    }

    // Filter by date if specified
    if (date) {
      query = query.eq('reservation_date', date)
    }

    const { data: reservations, error } = await query

    if (error) {
      console.error('Error fetching reservations:', error)
      return { success: false, error: 'Failed to fetch reservations' }
    }

    return { success: true, data: reservations || [] }
  } catch (error: any) {
    console.error('Error in getReservationsAction:', error)
    return { success: false, error: error.message || 'An error occurred' }
  }
}

// Admin/Staff action to update reservation status
export async function updateReservationStatusAction(
  reservationId: string,
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled',
  notes?: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    // Get current user to check permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current user profile
    const { data: currentProfile } = await supabase
      .from('user_profiles')
      .select('role, studio_id')
      .eq('id', user.id)
      .single()

    if (!currentProfile || !['admin', 'cs'].includes(currentProfile.role)) {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Prepare update data
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }

    if (notes) {
      updateData.internal_notes = notes
    }

    // Set timestamp for status changes
    if (status === 'confirmed') {
      updateData.confirmed_at = new Date().toISOString()
    } else if (status === 'completed') {
      updateData.completed_at = new Date().toISOString()
    } else if (status === 'cancelled') {
      updateData.cancelled_at = new Date().toISOString()
    }

    // Build update query with studio check for CS users
    let query = supabase
      .from('reservations')
      .update(updateData)
      .eq('id', reservationId)

    // CS users can only update their studio's reservations
    if (currentProfile.role === 'cs') {
      query = query.eq('studio_id', currentProfile.studio_id)
    }

    const { error } = await query

    if (error) {
      console.error('Error updating reservation status:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/reservations')
    return { success: true }
  } catch (error: any) {
    console.error('Error in updateReservationStatusAction:', error)
    return { success: false, error: error.message || 'Failed to update reservation status' }
  }
}