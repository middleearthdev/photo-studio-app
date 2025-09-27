"use server"

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { PaginationParams, PaginatedResult, calculatePagination } from '@/lib/constants/pagination'
import { updateReservationPaymentStatus } from '@/actions/reservations'

export interface ActionResult<T = any> {
  success: boolean
  data?: T
  error?: string
}

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'partial'

export interface Payment {
  id: string
  reservation_id: string
  payment_method_id: string | null
  
  // Payment details
  amount: number
  payment_type: string // 'dp', 'remaining', 'full'
  status: PaymentStatus
  
  // External payment gateway (Xendit)
  external_payment_id: string | null
  external_status: string | null
  payment_url: string | null
  callback_data: any
  
  // Fee tracking
  gateway_fee: number
  net_amount: number | null
  
  // Additional fields for payment processing
  gateway_response: string | null
  processed_at: string | null
  verification_notes: string | null
  
  // Timestamps
  paid_at: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
  
  // Relations
  reservation?: {
    id: string
    booking_code: string
    customer_id: string
    total_amount: number
    reservation_date: string
    studio_id: string
    guest_email: string | null
    guest_phone: string | null
    customer?: {
      full_name: string
      email: string
      phone: string
    }
  }
  payment_method?: {
    id: string
    name: string
    type: string
    provider: string
  }
}

export interface PaymentMethod {
  id: string
  studio_id: string
  name: string
  type: string
  provider: string
  account_details: any
  xendit_config: any
  fee_type?: string
  fee_percentage: number
  fee_amount?: number
  is_active: boolean
  created_at: string
}

export interface CreatePaymentData {
  reservation_id: string
  payment_method_id?: string
  amount: number
  payment_type: string
  external_payment_id?: string
  external_status?: string
  payment_url?: string
  gateway_fee?: number
  net_amount?: number
  expires_at?: string
}

export interface UpdatePaymentData {
  status?: PaymentStatus
  external_payment_id?: string
  external_status?: string
  payment_url?: string
  callback_data?: any
  gateway_fee?: number
  net_amount?: number
  paid_at?: string
}

// Get paginated payments
export async function getPaginatedPayments(
  studioId: string,
  params: PaginationParams & {
    status?: PaymentStatus | 'all'
    payment_type?: string | 'all'
    date_from?: string
    date_to?: string
    payment_method?: string | 'all'
  } = {}
): Promise<PaginatedResult<Payment>> {
  const supabase = await createClient()
  
  const { 
    page = 1, 
    pageSize = 10, 
    search = '', 
    status = 'all',
    payment_type = 'all',
    date_from,
    date_to,
    payment_method = 'all'
  } = params
  
  const { offset, pageSize: validPageSize } = calculatePagination(page, pageSize, 0)

  // Build the query with proper studio filtering
  let query = supabase
    .from('payments')
    .select(`
      *,
      reservation:reservations!inner(
        id, booking_code, customer_id, total_amount, reservation_date, studio_id,
        customer:customers(full_name, email, phone),
        guest_email,
        guest_phone
      ),
      payment_method:payment_methods(id, name, type, provider)
    `, { count: 'exact' })
    .eq('reservation.studio_id', studioId)

  // Apply filters
  if (status !== 'all') {
    query = query.eq('status', status)
  }

  if (payment_type !== 'all') {
    query = query.eq('payment_type', payment_type)
  }

  if (payment_method !== 'all') {
    query = query.eq('payment_method_id', payment_method)
  }

  if (date_from && date_to) {
    query = query.gte('created_at', date_from).lte('created_at', date_to)
  } else if (date_from) {
    query = query.gte('created_at', date_from)
  } else if (date_to) {
    query = query.lte('created_at', date_to)
  }

  // Apply search - search in payment info, booking code, and customer info
  if (search.trim()) {
    const searchTerm = search.trim()
    // Search in external_payment_id, booking_code, and customer information
    query = query.or(
      `external_payment_id.ilike.%${searchTerm}%,` +
      `reservation.booking_code.ilike.%${searchTerm}%,` +
      `reservation.customer.full_name.ilike.%${searchTerm}%,` +
      `reservation.customer.email.ilike.%${searchTerm}%,` +
      `reservation.customer.phone.ilike.%${searchTerm}%,` +
      `reservation.guest_email.ilike.%${searchTerm}%,` +
      `reservation.guest_phone.ilike.%${searchTerm}%`
    )
  }

  // Apply pagination and ordering
  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + validPageSize - 1)

  if (error) {
    console.error('Error fetching paginated payments:', error)
    throw new Error(`Failed to fetch payments: ${error.message}`)
  }

  const total = count || 0
  const pagination = calculatePagination(page, validPageSize, total)

  return {
    data: data || [],
    pagination
  }
}

// Get payment method by ID (minimal info for fee calculation)
export async function getPaymentMethodById(id: string): Promise<ActionResult<{
  id: string
  name: string
  type: string
  provider: string
  fee_type?: string
  fee_percentage: number
  fee_amount?: number
}>> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('payment_methods')
      .select('id, name, type, provider, fee_type, fee_percentage, fee_amount')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching payment method:', error)
      return { success: false, error: 'Metode pembayaran tidak ditemukan' }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error in getPaymentMethodById:', error)
    return { success: false, error: 'Terjadi kesalahan saat mengambil data metode pembayaran' }
  }
}

// Get payment by ID
export async function getPaymentById(id: string): Promise<Payment | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('payments')
    .select(`
      *,
      reservation:reservations(
        id, booking_code, customer_id, total_amount, reservation_date, studio_id,
        customer:customers(full_name, email, phone),
        guest_email,
        guest_phone
      ),
      payment_method:payment_methods(id, name, type, provider)
    `)
    .eq('id', id)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('Error fetching payment:', error)
    throw new Error(`Failed to fetch payment: ${error.message}`)
  }
  
  return data
}

// Get payments by reservation ID
export async function getPaymentsByReservationId(reservationId: string): Promise<ActionResult<Payment[]>> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        reservation:reservations(
          id, booking_code, customer_id, total_amount, reservation_date, studio_id,
          customer:customers(full_name, email, phone),
          guest_email,
          guest_phone
        ),
        payment_method:payment_methods(id, name, type, provider)
      `)
      .eq('reservation_id', reservationId)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching payments by reservation ID:', error)
      return { success: false, error: 'Failed to fetch payments' }
    }
    
    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error in getPaymentsByReservationId:', error)
    return { success: false, error: 'Failed to fetch payments' }
  }
}

// Get payment by external ID (for webhooks)
export async function getPaymentByExternalId(externalId: string): Promise<Payment | null> {
  const supabase = await createClient()
  
  // First try to find by external_payment_id
  let { data, error } = await supabase
    .from('payments')
    .select(`
      *,
      reservation:reservations(
        id, booking_code, customer_id, total_amount, reservation_date, studio_id,
        customer:customers(full_name, email, phone),
        guest_email,
        guest_phone
      ),
      payment_method:payment_methods(id, name, type, provider)
    `)
    .eq('external_payment_id', externalId)
    .single()
  
  // If not found and looks like a Xendit invoice ID, try to find in callback_data
  if (error && error.code === 'PGRST116' && externalId.startsWith('invoice-')) {
    const { data: paymentsWithCallback, error: callbackError } = await supabase
      .from('payments')
      .select(`
        *,
        reservation:reservations(
          id, booking_code, customer_id, total_amount, reservation_date, studio_id,
          customer:customers(full_name, email, phone),
          guest_email,
          guest_phone
        ),
        payment_method:payment_methods(id, name, type, provider)
      `)
      .not('callback_data', 'is', null)
    
    if (!callbackError && paymentsWithCallback) {
      // Find payment where callback_data contains the external_id
      data = paymentsWithCallback.find(payment => {
        if (payment.callback_data && typeof payment.callback_data === 'object') {
          return payment.callback_data.external_id === externalId ||
                 payment.callback_data.xendit_invoice_id === externalId
        }
        return false
      }) || null
      
      if (!data) {
        error = { code: 'PGRST116', message: 'No payment found' } as any
      } else {
        error = null
      }
    }
  }
  
  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('Error fetching payment by external ID:', error)
    throw new Error(`Failed to fetch payment: ${error.message}`)
  }
  
  return data
}


// Complete payment (Lunas) - Create final payment and update reservation status
export async function completePaymentAction(
  reservationId: string,
  paymentMethodId: string | null = null
): Promise<ActionResult<Payment>> {
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

    // Get reservation details with studio check for CS users
    let reservationQuery = supabase
      .from('reservations')
      .select(`
        id, booking_code, studio_id, customer_id, total_amount, dp_amount, 
        remaining_amount, payment_status,
        customer:customers(id, full_name, email, phone, is_guest)
      `)
      .eq('id', reservationId)

    // CS users can only access their studio's reservations
    if (currentProfile.role === 'cs') {
      reservationQuery = reservationQuery.eq('studio_id', currentProfile.studio_id)
    }

    const { data: reservation, error: reservationError } = await reservationQuery.single()
    
    if (reservationError) {
      console.error('Error fetching reservation:', reservationError)
      return { success: false, error: 'Reservation not found' }
    }

    // Check if payment can be completed
    if (reservation.payment_status === 'completed') {
      return { success: false, error: 'Payment is already completed' }
    }

    // Calculate remaining amount to be paid
    const remainingAmount = reservation.total_amount - reservation.dp_amount
    
    if (remainingAmount <= 0) {
      return { success: false, error: 'No remaining amount to pay' }
    }

    // Create final payment record
    const paymentData = {
      reservation_id: reservationId,
      payment_method_id: paymentMethodId,
      amount: remainingAmount,
      payment_type: 'remaining', // Remaining payment
      status: 'completed' as PaymentStatus,
      gateway_fee: 0,
      net_amount: remainingAmount,
      paid_at: new Date().toISOString(),
    }

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert(paymentData)
      .select(`
        *,
        reservation:reservations(
          id, booking_code, customer_id, total_amount, reservation_date, studio_id,
          customer:customers(full_name, email, phone),
          guest_email,
          guest_phone
        ),
        payment_method:payment_methods(id, name, type, provider)
      `)
      .single()

    if (paymentError) {
      console.error('Error creating payment:', paymentError)
      return { success: false, error: 'Failed to create payment record' }
    }

    // Update reservation payment status to completed
    const updateResult = await updateReservationPaymentStatus(reservationId, 'completed')
    if (!updateResult.success) {
      // If reservation update fails, we should ideally rollback the payment creation
      console.error('Error updating reservation payment status:', updateResult.error)
      return { success: false, error: 'Payment recorded but failed to update reservation status' }
    }

    revalidatePath('/admin/payments')
    revalidatePath('/cs/reservations')
    revalidatePath('/admin/reservations')
    
    return { success: true, data: payment }
  } catch (error: any) {
    console.error('Error in completePaymentAction:', error)
    return { success: false, error: error.message || 'Failed to complete payment' }
  }
}

// Create new payment with Xendit support
export async function createPayment(data: CreatePaymentData): Promise<Payment> {
  const supabase = await createClient()
  
  // Use provided net_amount or calculate it
  const netAmount = data.net_amount !== undefined 
    ? data.net_amount 
    : data.amount - (data.gateway_fee || 0);
  
  const paymentData = {
    reservation_id: data.reservation_id,
    payment_method_id: data.payment_method_id || null,
    amount: data.amount,
    payment_type: data.payment_type,
    external_payment_id: data.external_payment_id || null,
    external_status: data.external_status || null,
    payment_url: data.payment_url || null,
    gateway_fee: data.gateway_fee || 0,
    net_amount: netAmount,
    expires_at: data.expires_at || null,
  }
  
  const { data: payment, error } = await supabase
    .from('payments')
    .insert(paymentData)
    .select(`
      *,
      reservation:reservations(
        id, booking_code, customer_id, total_amount, reservation_date, studio_id,
        customer:customers(full_name, email, phone),
        guest_email,
        guest_phone
      ),
      payment_method:payment_methods(id, name, type, provider)
    `)
    .single()
  
  if (error) {
    console.error('Error creating payment:', error)
    throw new Error(`Failed to create payment: ${error.message}`)
  }
  
  revalidatePath('/admin/payments')
  return payment
}

// Update payment
export async function updatePayment(id: string, data: UpdatePaymentData): Promise<Payment> {
  const supabase = await createClient()
  
  const updateData = {
    ...data,
    updated_at: new Date().toISOString(),
  }
  
  const { data: payment, error } = await supabase
    .from('payments')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      reservation:reservations(
        id, booking_code, customer_id, total_amount, reservation_date, studio_id,
        customer:customers(full_name, email, phone),
        guest_email,
        guest_phone
      ),
      payment_method:payment_methods(id, name, type, provider)
    `)
    .single()
  
  if (error) {
    console.error('Error updating payment:', error)
    throw new Error(`Failed to update payment: ${error.message}`)
  }
  
  revalidatePath('/admin/payments')
  return payment
}

// Delete payment
export async function deletePayment(id: string): Promise<void> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('payments')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting payment:', error)
    throw new Error(`Failed to delete payment: ${error.message}`)
  }
  
  revalidatePath('/admin/payments')
}

// Get payment statistics
export async function getPaymentStats(studioId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('payments')
    .select(`
      *,
      reservation:reservations!inner(studio_id)
    `)
    .eq('reservation.studio_id', studioId)
  
  if (error) {
    console.error('Error fetching payment stats:', error)
    throw new Error(`Failed to fetch payment stats: ${error.message}`)
  }
  
  const today = new Date()
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  const stats = {
    total: data.length,
    completed: data.filter(p => p.status === 'completed').length,
    pending: data.filter(p => p.status === 'pending').length,
    failed: data.filter(p => p.status === 'failed').length,
    totalAmount: data
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0),
    totalFees: data
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + (p.gateway_fee || 0), 0),
    thisMonthAmount: data
      .filter(p => p.status === 'completed' && new Date(p.created_at) >= thisMonth)
      .reduce((sum, p) => sum + p.amount, 0),
    pendingAmount: data
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + p.amount, 0),
  }
  
  return stats
}

// Get payment methods
export async function getPaymentMethods(studioId: string): Promise<PaymentMethod[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('payment_methods')
    .select('*')
    .eq('studio_id', studioId)
    .eq('is_active', true)
    .order('name', { ascending: true })
  
  if (error) {
    console.error('Error fetching payment methods:', error)
    throw new Error(`Failed to fetch payment methods: ${error.message}`)
  }
  
  return data || []
}

// Get all payment methods (including inactive)
export async function getAllPaymentMethods(studioId: string): Promise<PaymentMethod[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('payment_methods')
    .select('*')
    .eq('studio_id', studioId)
    .order('name', { ascending: true })
  
  if (error) {
    console.error('Error fetching all payment methods:', error)
    throw new Error(`Failed to fetch payment methods: ${error.message}`)
  }
  
  return data || []
}

// Create payment method interface
export interface CreatePaymentMethodData {
  studio_id: string
  name: string
  type: string
  provider: string
  account_details: any
  xendit_config?: any
  fee_type?: string
  fee_percentage: number
  fee_amount?: number
  is_active: boolean
}

// Update payment method interface
export interface UpdatePaymentMethodData {
  name?: string
  type?: string
  provider?: string
  account_details?: any
  xendit_config?: any
  fee_type?: string
  fee_percentage?: number
  fee_amount?: number
  is_active?: boolean
}

// Create payment method
export async function createPaymentMethod(data: CreatePaymentMethodData): Promise<PaymentMethod> {
  const supabase = await createClient()
  
  const { data: paymentMethod, error } = await supabase
    .from('payment_methods')
    .insert(data)
    .select()
    .single()
  
  if (error) {
    console.error('Error creating payment method:', error)
    throw new Error(`Failed to create payment method: ${error.message}`)
  }
  
  revalidatePath('/admin/payments/methods')
  return paymentMethod
}

// Update payment method
export async function updatePaymentMethod(id: string, data: UpdatePaymentMethodData): Promise<PaymentMethod> {
  const supabase = await createClient()
  
  const { data: paymentMethod, error } = await supabase
    .from('payment_methods')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating payment method:', error)
    throw new Error(`Failed to update payment method: ${error.message}`)
  }
  
  revalidatePath('/admin/payments/methods')
  return paymentMethod
}

// Delete payment method
export async function deletePaymentMethod(id: string): Promise<void> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('payment_methods')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting payment method:', error)
    throw new Error(`Failed to delete payment method: ${error.message}`)
  }
  
  revalidatePath('/admin/payments/methods')
}

// Toggle payment method active status
export async function togglePaymentMethodStatus(id: string, isActive: boolean): Promise<PaymentMethod> {
  const supabase = await createClient()
  
  const { data: paymentMethod, error } = await supabase
    .from('payment_methods')
    .update({ is_active: isActive })
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Error toggling payment method status:', error)
    throw new Error(`Failed to toggle payment method status: ${error.message}`)
  }
  
  revalidatePath('/admin/payments/methods')
  return paymentMethod
}

// Update payment status (for manual updates)
export async function updatePaymentStatus(id: string, status: PaymentStatus): Promise<Payment> {
  const supabase = await createClient()
  
  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
  }
  
  // Set paid_at timestamp if marking as completed
  if (status === 'completed') {
    updateData.paid_at = new Date().toISOString()
  }
  
  const { data: payment, error } = await supabase
    .from('payments')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      reservation:reservations(
        id, booking_code, customer_id, total_amount, reservation_date, studio_id,
        customer:customers(full_name, email, phone),
        guest_email,
        guest_phone
      ),
      payment_method:payment_methods(id, name, type, provider)
    `)
    .single()
  
  if (error) {
    console.error('Error updating payment status:', error)
    throw new Error(`Failed to update payment status: ${error.message}`)
  }
  
  // Update the corresponding reservation's payment status
  if (payment.reservation_id) {
    let reservationPaymentStatus: 'pending' | 'partial' | 'completed' | 'failed' = status
    
    // For completed payments, determine the correct reservation payment status
    if (status === 'completed') {
      if (payment.payment_type === 'dp') {
        // DP payment completed - reservation is partially paid
        reservationPaymentStatus = 'partial'
      } else if (payment.payment_type === 'full') {
        // Full payment completed - reservation is fully paid
        reservationPaymentStatus = 'completed'
      } else if (payment.payment_type === 'remaining') {
        // Remaining payment completed - check if all payments are now completed
        const allPaymentsResult = await getPaymentsByReservationId(payment.reservation_id)
        const allCompleted = allPaymentsResult.success && allPaymentsResult.data 
          ? allPaymentsResult.data.every(p => 
              p.id === payment.id || p.status === 'completed'
            )
          : false
        
        if (allCompleted) {
          reservationPaymentStatus = 'completed'
        } else {
          reservationPaymentStatus = 'partial'
        }
      }
    }
    
    await updateReservationPaymentStatus(payment.reservation_id, reservationPaymentStatus)
  }
  
  revalidatePath('/admin/payments')
  return payment
}