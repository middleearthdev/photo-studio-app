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
  payment_status: 'pending' | 'partial' | 'completed' | 'failed'
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

export async function getPaginatedReservationsAction(
  params: PaginatedReservationsParams
): Promise<ActionResult<PaginatedReservationsResult>> {
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

    // Set pagination defaults
    const page = params.page || 1
    const pageSize = params.pageSize || 10
    const offset = (page - 1) * pageSize

    // Build base query
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
      `, { count: 'exact' })

    // Studio filter - CS users can only see their studio
    if (currentProfile.role === 'cs') {
      query = query.eq('studio_id', currentProfile.studio_id)
    } else if (params.studioId) {
      query = query.eq('studio_id', params.studioId)
    }

    // Search filter
    if (params.search) {
      const searchTerm = `%${params.search}%`
      query = query.or(`booking_code.ilike.${searchTerm},guest_email.ilike.${searchTerm},guest_phone.ilike.${searchTerm},customer.full_name.ilike.${searchTerm},customer.email.ilike.${searchTerm},customer.phone.ilike.${searchTerm}`)
    }

    // Status filter
    if (params.status && params.status !== 'all') {
      query = query.eq('status', params.status)
    }

    // Payment status filter
    if (params.payment_status && params.payment_status !== 'all') {
      query = query.eq('payment_status', params.payment_status)
    }

    // Booking type filter
    if (params.booking_type && params.booking_type !== 'all') {
      const isGuest = params.booking_type === 'guest'
      query = query.eq('is_guest_booking', isGuest)
    }

    // Date range filters
    if (params.date_from) {
      query = query.gte('reservation_date', params.date_from)
    }
    if (params.date_to) {
      query = query.lte('reservation_date', params.date_to)
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching paginated reservations:', error)
      return { success: false, error: error.message }
    }

    const totalPages = Math.ceil((count || 0) / pageSize)

    return {
      success: true,
      data: {
        data: data || [],
        pagination: {
          page,
          pageSize,
          total: count || 0,
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

    // For CS users, ensure they can only create reservations for their studio
    if (currentProfile.role === 'cs' && data.studio_id !== currentProfile.studio_id) {
      return { success: false, error: 'Cannot create reservation for different studio' }
    }

    // Generate booking code
    const bookingCode = generateBookingCode()
    const endTime = calculateEndTime(data.start_time, data.duration_minutes)

    // Get package facilities
    const { data: packageFacilities, error: facilityError } = await supabase
      .from('package_facilities')
      .select(`
        facility:facilities(id, name, description)
      `)
      .eq('package_id', data.package_id)

    if (facilityError) {
      console.error('Error fetching package facilities:', facilityError)
    }

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

    // Create reservation with manual booking specific fields
    const { data: reservationData, error: reservationError } = await supabase
      .from('reservations')
      .insert({
        booking_code: bookingCode,
        studio_id: data.studio_id,
        customer_id: customerData.id,
        user_id: user.id, // Set user_id to current staff member
        package_id: data.package_id,
        reservation_date: data.reservation_date,
        start_time: data.start_time,
        end_time: endTime,
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
        payment_status: data.payment_status || 'pending',
        discount_id: data.discount_id
      })
      .select()
      .single()

    if (reservationError) {
      console.error('Error creating manual reservation:', reservationError)
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

    console.log(data)

    // Create payment record for manual booking if payment method is provided
    if (data.payment_method && data.payment_status && dpAmount > 0) {
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          reservation_id: reservationData.id,
          payment_method_id: data.payment_method,
          amount: dpAmount,
          payment_type: data.payment_status === 'completed' ? 'full' : 'dp',
          status: 'completed', // Manual payments are marked as completed
          paid_at: new Date().toISOString(),
        })

      if (paymentError) {
        console.error('Error creating payment record:', paymentError)
        // Don't fail reservation creation for payment record error
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
    revalidatePath('/cs/reservations')
    revalidatePath('/booking')

    // Return the reservation and customer data
    return {
      success: true,
      data: {
        reservation: createdReservation,
        customer: customerData
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
    const supabase = await createClient()

    // Generate booking code
    const bookingCode = generateBookingCode()
    const endTime = calculateEndTime(data.start_time, data.duration_minutes)

    // Get package facilities
    const { data: packageFacilities, error: facilityError } = await supabase
      .from('package_facilities')
      .select(`
        facility:facilities(id, name, description)
      `)
      .eq('package_id', data.package_id)

    if (facilityError) {
      console.error('Error fetching package facilities:', facilityError)
    }

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

    // Return the reservation and customer data
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
): Promise<ActionResult<Reservation>> {
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

    const { data: updatedReservation, error } = await query
      .select(`
        *,
        studio:studios(id, name),
        customer:customers(id, full_name, email, phone),
        package:packages(id, name, duration_minutes),
        reservation_addons(
          id,
          addon_id,
          quantity,
          unit_price,
          total_price,
          addon:addons(id, name, description)
        )
      `)
      .single()

    if (error) {
      console.error('Error updating reservation status:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/reservations')
    return { success: true, data: updatedReservation }
  } catch (error: any) {
    console.error('Error in updateReservationStatusAction:', error)
    return { success: false, error: error.message || 'Failed to update reservation status' }
  }
}
// Admin/Staff action to update reservation status based on payment completion
export async function updateReservationStatusOnPayment(
  reservationId: string,
  paymentStatus: 'pending' | 'partial' | 'completed' | 'failed'
): Promise<ActionResult> {
  try {
    // If payment is completed, we might want to update the reservation status as well
    if (paymentStatus === 'completed') {
      // Get reservation details to check current status
      const supabase = await createClient()
      const { data: reservation, error: fetchError } = await supabase
        .from('reservations')
        .select('status')
        .eq('id', reservationId)
        .single()

      if (fetchError) {
        console.error('Error fetching reservation:', fetchError)
        return { success: false, error: 'Failed to fetch reservation' }
      }

      // If reservation is still pending, confirm it since payment is completed
      if (reservation && reservation.status === 'pending') {
        const { error: updateError } = await supabase
          .from('reservations')
          .update({
            status: 'confirmed',
            updated_at: new Date().toISOString()
          })
          .eq('id', reservationId)

        if (updateError) {
          console.error('Error confirming reservation:', updateError)
          // Continue with payment status update even if reservation confirmation fails
        } else {
          console.log(`Reservation ${reservationId} confirmed automatically due to completed payment`)
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
  paymentStatus: 'pending' | 'partial' | 'completed' | 'failed'
): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    // Prepare update data
    const updateData: any = {
      payment_status: paymentStatus,
      updated_at: new Date().toISOString()
    }


    // Update reservation payment status
    const { data, error } = await supabase
      .from('reservations')
      .update(updateData)
      .eq('id', reservationId)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating reservation payment status from webhook:', error)
      return { success: false, error: 'Failed to update reservation payment status' }
    }

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
  paymentStatus: 'pending' | 'partial' | 'completed' | 'failed'
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
      payment_status: paymentStatus,
      updated_at: new Date().toISOString()
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
      console.error('Error updating reservation payment status:', error)
      return { success: false, error: error.message }
    }

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

    // First get the reservation to check if it's a guest booking
    let reservationQuery = supabase
      .from('reservations')
      .select(`
        *,
        customer:customers(id, full_name, email, phone, is_guest)
      `)
      .eq('id', reservationId)

    // CS users can only access their studio's reservations
    if (currentProfile.role === 'cs') {
      reservationQuery = reservationQuery.eq('studio_id', currentProfile.studio_id)
    }

    const { data: currentReservation, error: fetchError } = await reservationQuery.single()

    if (fetchError) {
      console.error('Error fetching reservation:', fetchError)
      return { success: false, error: fetchError.message }
    }

    // Handle customer info updates for guest bookings
    if (currentReservation.customer?.is_guest) {
      const customerUpdateData: any = {
        updated_at: new Date().toISOString()
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
        const { error: customerError } = await supabase
          .from('customers')
          .update(customerUpdateData)
          .eq('id', currentReservation.customer_id)

        if (customerError) {
          console.error('Error updating customer info:', customerError)
          return { success: false, error: 'Failed to update customer information' }
        }
      }
    }

    // Prepare reservation update data (exclude customer_name as it's handled separately)
    const { customer_name, ...reservationUpdateData } = updateData
    const updatePayload: any = {
      ...reservationUpdateData,
      updated_at: new Date().toISOString()
    }

    // Build update query with studio check for CS users
    let query = supabase
      .from('reservations')
      .update(updatePayload)
      .eq('id', reservationId)

    // CS users can only update their studio's reservations
    if (currentProfile.role === 'cs') {
      query = query.eq('studio_id', currentProfile.studio_id)
    }

    const { data: updatedReservation, error } = await query
      .select(`
        *,
        studio:studios(id, name),
        customer:customers(id, full_name, email, phone),
        package:packages(id, name, duration_minutes),
        reservation_addons(
          id,
          addon_id,
          quantity,
          unit_price,
          total_price,
          addon:addons(id, name, description)
        )
      `)
      .single()

    if (error) {
      console.error('Error updating reservation:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/reservations')
    revalidatePath('/cs/reservations')
    return { success: true, data: updatedReservation }
  } catch (error: any) {
    console.error('Error in updateReservationAction:', error)
    return { success: false, error: error.message || 'Failed to update reservation' }
  }
}

// Webhook action to cancel reservation due to payment expiration
export async function deleteReservationActionWebhook(reservationId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    // Get reservation details to check status
    const { data: reservation, error: fetchError } = await supabase
      .from('reservations')
      .select('studio_id, status, payment_status')
      .eq('id', reservationId)
      .single()

    if (fetchError || !reservation) {
      return { success: false, error: 'Reservation not found' }
    }

    // Don't update if reservation is already completed or in progress
    if (['in_progress', 'completed'].includes(reservation.status)) {
      return {
        success: false,
        error: 'Cannot cancel reservation that is in progress or completed'
      }
    }

    // Update reservation status to cancelled
    const { error: reservationError } = await supabase
      .from('reservations')
      .update({
        status: 'cancelled',
        payment_status: 'failed',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', reservationId)

    if (reservationError) {
      console.error('Error updating reservation status:', reservationError)
      return { success: false, error: 'Failed to cancel reservation' }
    }

    // Update all related payments to failed status
    const { error: paymentsError } = await supabase
      .from('payments')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('reservation_id', reservationId)

    if (paymentsError) {
      console.error('Error updating payment status:', paymentsError)
      return { success: false, error: 'Failed to update payment status' }
    }

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

    // Get reservation details to check permissions and status
    const { data: reservation, error: fetchError } = await supabase
      .from('reservations')
      .select('studio_id, status, payment_status')
      .eq('id', reservationId)
      .single()

    if (fetchError || !reservation) {
      return { success: false, error: 'Reservation not found' }
    }

    // CS users can only delete their studio's reservations
    if (currentProfile.role === 'cs' && reservation.studio_id !== currentProfile.studio_id) {
      return { success: false, error: 'Insufficient permissions for this studio' }
    }

    // Prevent deletion of reservations that are in progress or completed
    if (['in_progress', 'completed'].includes(reservation.status)) {
      return {
        success: false,
        error: 'Cannot delete reservation that is in progress or completed'
      }
    }

    // Check if reservation has payments
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('id, status')
      .eq('reservation_id', reservationId)

    if (paymentsError) {
      console.error('Error checking payments:', paymentsError)
      return { success: false, error: 'Error checking related payments' }
    }

    // If there are completed payments, don't allow deletion
    const hasCompletedPayments = payments?.some(p => p.status === 'completed')
    if (hasCompletedPayments) {
      return {
        success: false,
        error: 'Cannot delete reservation with completed payments. Cancel instead.'
      }
    }

    // Delete related data in correct order
    // 1. Delete reservation addons
    const { error: addonsError } = await supabase
      .from('reservation_addons')
      .delete()
      .eq('reservation_id', reservationId)

    if (addonsError) {
      console.error('Error deleting reservation addons:', addonsError)
      return { success: false, error: 'Failed to delete reservation addons' }
    }

    // 2. Delete payments
    const { error: paymentsDeleteError } = await supabase
      .from('payments')
      .delete()
      .eq('reservation_id', reservationId)

    if (paymentsDeleteError) {
      console.error('Error deleting payments:', paymentsDeleteError)
      return { success: false, error: 'Failed to delete related payments' }
    }

    // 3. Delete the reservation
    const { error: deleteError } = await supabase
      .from('reservations')
      .delete()
      .eq('id', reservationId)

    if (deleteError) {
      console.error('Error deleting reservation:', deleteError)
      return { success: false, error: deleteError.message }
    }

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

    // Get the current reservation to validate
    let reservationQuery = supabase
      .from('reservations')
      .select('*')
      .eq('id', reservationId)

    // CS users can only reschedule their studio's reservations
    if (currentProfile.role === 'cs') {
      reservationQuery = reservationQuery.eq('studio_id', currentProfile.studio_id)
    }

    const { data: reservation, error: fetchError } = await reservationQuery.single()

    if (fetchError) {
      console.error('Error fetching reservation:', fetchError)
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

    if (['completed', 'cancelled'].includes(reservation.status)) {
      return { success: false, error: `Cannot reschedule ${reservation.status} booking` }
    }

    // Validate new date is not in the past
    const newDate = new Date(rescheduleData.new_date)
    if (newDate < today) {
      return { success: false, error: 'Cannot reschedule to a past date' }
    }

    // Check if new date/time is different from current
    if (rescheduleData.new_date === reservation.reservation_date &&
      rescheduleData.new_start_time === reservation.start_time) {
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
      reservation_date: rescheduleData.new_date,
      start_time: rescheduleData.new_start_time,
      end_time: rescheduleData.new_end_time,
      total_duration: newDuration,
      updated_at: new Date().toISOString()
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

    const { data: updatedReservation, error: updateError } = await supabase
      .from('reservations')
      .update(updateData)
      .eq('id', reservationId)
      .select(`
        *,
        studio:studios(id, name),
        customer:customers(id, full_name, email, phone),
        package:packages(id, name, price, duration_minutes)
      `)
      .single()

    if (updateError) {
      console.error('Error updating reservation:', updateError)
      return { success: false, error: updateError.message }
    }

    // TODO: Send notification to customer about reschedule
    // This could be an email or WhatsApp notification

    revalidatePath('/cs/reservations')
    revalidatePath('/cs/reminders')
    revalidatePath('/admin/reservations')

    return {
      success: true,
      data: updatedReservation,
      message: 'Booking has been rescheduled successfully'
    }
  } catch (error: any) {
    console.error('Error in rescheduleBookingAction:', error)
    return { success: false, error: error.message || 'Failed to reschedule booking' }
  }
}