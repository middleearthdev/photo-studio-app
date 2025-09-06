"use server"

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { PaginationParams, PaginatedResult, calculatePagination } from '@/lib/constants/pagination'

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'partial' | 'refunded'

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
  fee_percentage: number
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

  // Build the query
  let query = supabase
    .from('payments')
    .select(`
      *,
      reservation:reservations(
        id, booking_code, customer_id, total_amount, reservation_date,
        customer:customers(full_name, email, phone)
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

  // Apply search - search in booking code and customer info
  if (search.trim()) {
    query = query.or(`external_payment_id.ilike.%${search}%,reservation.booking_code.ilike.%${search}%`)
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

// Get payment by ID
export async function getPaymentById(id: string): Promise<Payment | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('payments')
    .select(`
      *,
      reservation:reservations(
        id, booking_code, customer_id, total_amount, reservation_date,
        customer:customers(full_name, email, phone)
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

// Create new payment
export async function createPayment(data: CreatePaymentData): Promise<Payment> {
  const supabase = await createClient()
  
  const paymentData = {
    reservation_id: data.reservation_id,
    payment_method_id: data.payment_method_id || null,
    amount: data.amount,
    payment_type: data.payment_type,
    external_payment_id: data.external_payment_id || null,
    external_status: data.external_status || null,
    payment_url: data.payment_url || null,
    gateway_fee: data.gateway_fee || 0,
    net_amount: data.amount - (data.gateway_fee || 0),
    expires_at: data.expires_at || null,
  }
  
  const { data: payment, error } = await supabase
    .from('payments')
    .insert(paymentData)
    .select(`
      *,
      reservation:reservations(
        id, booking_code, customer_id, total_amount, reservation_date,
        customer:customers(full_name, email, phone)
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
        id, booking_code, customer_id, total_amount, reservation_date,
        customer:customers(full_name, email, phone)
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
        id, booking_code, customer_id, total_amount, reservation_date,
        customer:customers(full_name, email, phone)
      ),
      payment_method:payment_methods(id, name, type, provider)
    `)
    .single()
  
  if (error) {
    console.error('Error updating payment status:', error)
    throw new Error(`Failed to update payment status: ${error.message}`)
  }
  
  revalidatePath('/admin/payments')
  return payment
}