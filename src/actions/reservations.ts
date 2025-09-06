"use server"

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { PaginationParams, PaginatedResult, calculatePagination } from '@/lib/constants/pagination'

export type ReservationStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
export type PaymentStatus = 'pending' | 'partial' | 'completed' | 'failed' | 'refunded'

export interface Reservation {
  id: string
  booking_code: string
  invoice_number: string | null
  studio_id: string
  customer_id: string
  user_id: string | null
  package_id: string | null
  
  // Guest booking support
  is_guest_booking: boolean
  guest_email: string | null
  guest_phone: string | null
  
  // Booking details
  reservation_date: string
  start_time: string
  end_time: string
  total_duration: number
  
  // Selected facilities
  selected_facilities: any
  
  // Pricing breakdown
  package_price: number
  facility_addon_total: number
  other_addon_total: number
  subtotal: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  dp_amount: number
  remaining_amount: number
  
  // Status
  status: ReservationStatus
  payment_status: PaymentStatus
  
  // Additional info
  special_requests: string | null
  notes: string | null
  internal_notes: string | null
  
  // Timestamps
  confirmed_at: string | null
  completed_at: string | null
  cancelled_at: string | null
  created_at: string
  updated_at: string
  
  // Relations
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
    price: number
  }
  studio?: {
    id: string
    name: string
  }
}

export interface CreateReservationData {
  studio_id: string
  customer_id: string
  user_id?: string
  package_id?: string
  reservation_date: string
  start_time: string
  end_time: string
  total_duration: number
  selected_facilities: any
  package_price: number
  facility_addon_total?: number
  other_addon_total?: number
  subtotal: number
  tax_amount?: number
  discount_amount?: number
  total_amount: number
  dp_amount: number
  remaining_amount: number
  special_requests?: string
  notes?: string
  internal_notes?: string
}

export interface UpdateReservationData {
  reservation_date?: string
  start_time?: string
  end_time?: string
  status?: ReservationStatus
  payment_status?: PaymentStatus
  special_requests?: string
  notes?: string
  internal_notes?: string
  confirmed_at?: string
  completed_at?: string
  cancelled_at?: string
}

// Get paginated reservations
export async function getPaginatedReservations(
  studioId: string,
  params: PaginationParams & {
    status?: ReservationStatus | 'all'
    payment_status?: PaymentStatus | 'all'
    date_from?: string
    date_to?: string
    booking_type?: 'guest' | 'user' | 'all'
  } = {}
): Promise<PaginatedResult<Reservation>> {
  const supabase = await createClient()
  
  const { 
    page = 1, 
    pageSize = 10, 
    search = '', 
    status = 'all',
    payment_status = 'all',
    date_from,
    date_to,
    booking_type = 'all'
  } = params
  
  const { offset, pageSize: validPageSize } = calculatePagination(page, pageSize, 0)

  // Build the query
  let query = supabase
    .from('reservations')
    .select(`
      *,
      customer:customers(id, full_name, email, phone),
      package:packages(id, name, duration_minutes, price),
      studio:studios(id, name)
    `, { count: 'exact' })
    .eq('studio_id', studioId)

  // Apply filters
  if (status !== 'all') {
    query = query.eq('status', status)
  }

  if (payment_status !== 'all') {
    query = query.eq('payment_status', payment_status)
  }

  if (booking_type !== 'all') {
    query = query.eq('is_guest_booking', booking_type === 'guest')
  }

  if (date_from && date_to) {
    query = query.gte('reservation_date', date_from).lte('reservation_date', date_to)
  } else if (date_from) {
    query = query.gte('reservation_date', date_from)
  } else if (date_to) {
    query = query.lte('reservation_date', date_to)
  }

  // Apply search
  if (search.trim()) {
    query = query.or(`booking_code.ilike.%${search}%,invoice_number.ilike.%${search}%,guest_email.ilike.%${search}%,guest_phone.ilike.%${search}%`)
  }

  // Apply pagination and ordering
  const { data, error, count } = await query
    .order('reservation_date', { ascending: false })
    .order('start_time', { ascending: false })
    .range(offset, offset + validPageSize - 1)

  if (error) {
    console.error('Error fetching paginated reservations:', error)
    throw new Error(`Failed to fetch reservations: ${error.message}`)
  }

  const total = count || 0
  const pagination = calculatePagination(page, validPageSize, total)

  return {
    data: data || [],
    pagination
  }
}

// Get reservation by ID
export async function getReservationById(id: string): Promise<Reservation | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('reservations')
    .select(`
      *,
      customer:customers(id, full_name, email, phone),
      package:packages(id, name, duration_minutes, price),
      studio:studios(id, name)
    `)
    .eq('id', id)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('Error fetching reservation:', error)
    throw new Error(`Failed to fetch reservation: ${error.message}`)
  }
  
  return data
}

// Create new reservation
export async function createReservation(data: CreateReservationData): Promise<Reservation> {
  const supabase = await createClient()
  
  const reservationData = {
    studio_id: data.studio_id,
    customer_id: data.customer_id,
    user_id: data.user_id || null,
    package_id: data.package_id || null,
    reservation_date: data.reservation_date,
    start_time: data.start_time,
    end_time: data.end_time,
    total_duration: data.total_duration,
    selected_facilities: data.selected_facilities,
    package_price: data.package_price,
    facility_addon_total: data.facility_addon_total || 0,
    other_addon_total: data.other_addon_total || 0,
    subtotal: data.subtotal,
    tax_amount: data.tax_amount || 0,
    discount_amount: data.discount_amount || 0,
    total_amount: data.total_amount,
    dp_amount: data.dp_amount,
    remaining_amount: data.remaining_amount,
    special_requests: data.special_requests || null,
    notes: data.notes || null,
    internal_notes: data.internal_notes || null,
  }
  
  const { data: reservation, error } = await supabase
    .from('reservations')
    .insert(reservationData)
    .select(`
      *,
      customer:customers(id, full_name, email, phone),
      package:packages(id, name, duration_minutes, price),
      studio:studios(id, name)
    `)
    .single()
  
  if (error) {
    console.error('Error creating reservation:', error)
    throw new Error(`Failed to create reservation: ${error.message}`)
  }
  
  revalidatePath('/admin/reservations')
  return reservation
}

// Update reservation
export async function updateReservation(id: string, data: UpdateReservationData): Promise<Reservation> {
  const supabase = await createClient()
  
  const updateData = {
    ...data,
    updated_at: new Date().toISOString(),
  }
  
  const { data: reservation, error } = await supabase
    .from('reservations')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      customer:customers(id, full_name, email, phone),
      package:packages(id, name, duration_minutes, price),
      studio:studios(id, name)
    `)
    .single()
  
  if (error) {
    console.error('Error updating reservation:', error)
    throw new Error(`Failed to update reservation: ${error.message}`)
  }
  
  revalidatePath('/admin/reservations')
  return reservation
}

// Update reservation status
export async function updateReservationStatus(id: string, status: ReservationStatus): Promise<Reservation> {
  const supabase = await createClient()
  
  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
  }
  
  // Set appropriate timestamps based on status
  if (status === 'confirmed') {
    updateData.confirmed_at = new Date().toISOString()
  } else if (status === 'completed') {
    updateData.completed_at = new Date().toISOString()
  } else if (status === 'cancelled') {
    updateData.cancelled_at = new Date().toISOString()
  }
  
  const { data: reservation, error } = await supabase
    .from('reservations')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      customer:customers(id, full_name, email, phone),
      package:packages(id, name, duration_minutes, price),
      studio:studios(id, name)
    `)
    .single()
  
  if (error) {
    console.error('Error updating reservation status:', error)
    throw new Error(`Failed to update reservation status: ${error.message}`)
  }
  
  revalidatePath('/admin/reservations')
  return reservation
}

// Delete reservation
export async function deleteReservation(id: string): Promise<void> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('reservations')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting reservation:', error)
    throw new Error(`Failed to delete reservation: ${error.message}`)
  }
  
  revalidatePath('/admin/reservations')
}

// Get reservation statistics
export async function getReservationStats(studioId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('reservations')
    .select('status, payment_status, total_amount, created_at')
    .eq('studio_id', studioId)
  
  if (error) {
    console.error('Error fetching reservation stats:', error)
    throw new Error(`Failed to fetch reservation stats: ${error.message}`)
  }
  
  const today = new Date()
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  
  const stats = {
    total: data.length,
    pending: data.filter(r => r.status === 'pending').length,
    confirmed: data.filter(r => r.status === 'confirmed').length,
    completed: data.filter(r => r.status === 'completed').length,
    cancelled: data.filter(r => r.status === 'cancelled').length,
    thisMonth: data.filter(r => new Date(r.created_at) >= thisMonth).length,
    totalRevenue: data
      .filter(r => r.status === 'completed')
      .reduce((sum, r) => sum + r.total_amount, 0),
    pendingPayments: data
      .filter(r => r.payment_status === 'pending')
      .reduce((sum, r) => sum + r.total_amount, 0),
  }
  
  return stats
}