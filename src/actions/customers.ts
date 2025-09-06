"use server"

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { PaginationParams, PaginatedResult, calculatePagination } from '@/lib/constants/pagination'

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
  
  // Relations
  user_profile?: {
    id: string
    full_name: string
    avatar_url: string | null
    role: string
    is_active: boolean
  }
  
  // Aggregated data
  total_reservations?: number
  total_spent?: number
  last_reservation_date?: string
}

export interface CreateCustomerData {
  user_id?: string
  full_name: string
  email: string
  phone: string
  address?: string
  birth_date?: string
  notes?: string
  is_guest?: boolean
}

export interface UpdateCustomerData {
  full_name?: string
  email?: string
  phone?: string
  address?: string
  birth_date?: string
  notes?: string
}

// Get paginated customers
export async function getPaginatedCustomers(
  params: PaginationParams & {
    type?: 'all' | 'registered' | 'guest'
    search?: string
    studioId?: string
  } = {}
): Promise<PaginatedResult<Customer>> {
  const supabase = await createClient()
  
  const { 
    page = 1, 
    pageSize = 10, 
    search = '', 
    type = 'all',
    studioId
  } = params
  
  const { offset, pageSize: validPageSize } = calculatePagination(page, pageSize, 0)

  // Build the query with aggregated reservation data
  let query = supabase
    .from('customers')
    .select(`
      *,
      user_profile:user_profiles(id, full_name, avatar_url, role, is_active),
      reservations(id, total_amount, reservation_date, status, studio_id)
    `, { count: 'exact' })
    
  // Filter by studio if provided
  if (studioId) {
    query = query.eq('reservations.studio_id', studioId)
  }

  // Apply filters
  if (type === 'registered') {
    query = query.not('user_id', 'is', null)
  } else if (type === 'guest') {
    query = query.is('user_id', null)
  }

  // Apply search
  if (search.trim()) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
  }

  // Apply pagination and ordering
  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + validPageSize - 1)

  if (error) {
    console.error('Error fetching paginated customers:', error)
    throw new Error(`Failed to fetch customers: ${error.message}`)
  }

  // Process the data to add aggregated information
  const processedData = (data || []).map((customer: any) => {
    const reservations = customer.reservations || []
    const completedReservations = reservations.filter((r: any) => r.status === 'completed')
    
    return {
      ...customer,
      total_reservations: reservations.length,
      total_spent: completedReservations.reduce((sum: number, r: any) => sum + (r.total_amount || 0), 0),
      last_reservation_date: reservations.length > 0 
        ? reservations.sort((a: any, b: any) => new Date(b.reservation_date).getTime() - new Date(a.reservation_date).getTime())[0].reservation_date
        : null
    }
  })

  const total = count || 0
  const pagination = calculatePagination(page, validPageSize, total)

  return {
    data: processedData,
    pagination
  }
}

// Get customer by ID
export async function getCustomerById(id: string): Promise<Customer | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('customers')
    .select(`
      *,
      user_profile:user_profiles(id, full_name, avatar_url, role, is_active),
      reservations(id, booking_code, total_amount, reservation_date, status, payment_status)
    `)
    .eq('id', id)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('Error fetching customer:', error)
    throw new Error(`Failed to fetch customer: ${error.message}`)
  }
  
  // Process aggregated data
  const reservations = data.reservations || []
  const completedReservations = reservations.filter((r: any) => r.status === 'completed')
  
  return {
    ...data,
    total_reservations: reservations.length,
    total_spent: completedReservations.reduce((sum: number, r: any) => sum + (r.total_amount || 0), 0),
    last_reservation_date: reservations.length > 0 
      ? reservations.sort((a: any, b: any) => new Date(b.reservation_date).getTime() - new Date(a.reservation_date).getTime())[0].reservation_date
      : null
  }
}

// Create new customer
export async function createCustomer(data: CreateCustomerData): Promise<Customer> {
  const supabase = await createClient()
  
  const customerData = {
    user_id: data.user_id || null,
    full_name: data.full_name,
    email: data.email,
    phone: data.phone,
    address: data.address || null,
    birth_date: data.birth_date || null,
    notes: data.notes || null,
    is_guest: data.is_guest ?? !data.user_id,
  }
  
  const { data: customer, error } = await supabase
    .from('customers')
    .insert(customerData)
    .select(`
      *,
      user_profile:user_profiles(id, full_name, avatar_url, role, is_active)
    `)
    .single()
  
  if (error) {
    console.error('Error creating customer:', error)
    throw new Error(`Failed to create customer: ${error.message}`)
  }
  
  revalidatePath('/admin/customers')
  return { ...customer, total_reservations: 0, total_spent: 0 }
}

// Update customer
export async function updateCustomer(id: string, data: UpdateCustomerData): Promise<Customer> {
  const supabase = await createClient()
  
  const updateData = {
    ...data,
    updated_at: new Date().toISOString(),
  }
  
  const { data: customer, error } = await supabase
    .from('customers')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      user_profile:user_profiles(id, full_name, avatar_url, role, is_active)
    `)
    .single()
  
  if (error) {
    console.error('Error updating customer:', error)
    throw new Error(`Failed to update customer: ${error.message}`)
  }
  
  revalidatePath('/admin/customers')
  return customer
}

// Delete customer
export async function deleteCustomer(id: string): Promise<void> {
  const supabase = await createClient()
  
  // Check if customer has any reservations
  const { data: reservations } = await supabase
    .from('reservations')
    .select('id')
    .eq('customer_id', id)
    .limit(1)
  
  if (reservations && reservations.length > 0) {
    throw new Error('Cannot delete customer with existing reservations')
  }
  
  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting customer:', error)
    throw new Error(`Failed to delete customer: ${error.message}`)
  }
  
  revalidatePath('/admin/customers')
}

// Get customer statistics
export async function getCustomerStats(studioId?: string) {
  const supabase = await createClient()
  
  // Get customer counts - filter by studio if provided
  let customersQuery = supabase
    .from('customers')
    .select(`
      id, user_id, created_at,
      reservations!inner(studio_id)
    `)
  
  if (studioId) {
    customersQuery = customersQuery.eq('reservations.studio_id', studioId)
  }

  const { data: customers, error: customersError } = await customersQuery
  
  if (customersError) {
    console.error('Error fetching customer stats:', customersError)
    throw new Error(`Failed to fetch customer stats: ${customersError.message}`)
  }
  
  // Get reservation data for revenue calculation - filter by studio if provided  
  let reservationsQuery = supabase
    .from('reservations')
    .select('customer_id, total_amount, status, created_at, studio_id')
  
  if (studioId) {
    reservationsQuery = reservationsQuery.eq('studio_id', studioId)
  }

  const { data: reservations, error: reservationsError } = await reservationsQuery
  
  if (reservationsError) {
    console.error('Error fetching reservation stats:', reservationsError)
    throw new Error(`Failed to fetch reservation stats: ${reservationsError.message}`)
  }
  
  const today = new Date()
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  
  // Calculate stats
  const totalCustomers = customers.length
  const registeredCustomers = customers.filter(c => c.user_id).length
  const guestCustomers = customers.filter(c => !c.user_id).length
  const newThisMonth = customers.filter(c => new Date(c.created_at) >= thisMonth).length
  
  // Calculate customer lifetime value
  const customerRevenueMap = new Map()
  reservations
    .filter(r => r.status === 'completed')
    .forEach(r => {
      const current = customerRevenueMap.get(r.customer_id) || 0
      customerRevenueMap.set(r.customer_id, current + r.total_amount)
    })
  
  const totalRevenue = Array.from(customerRevenueMap.values()).reduce((sum, val) => sum + val, 0)
  const avgCustomerValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0
  
  return {
    total: totalCustomers,
    registered: registeredCustomers,
    guest: guestCustomers,
    newThisMonth,
    avgCustomerValue,
    totalRevenue
  }
}

// Get customer reservation history
export async function getCustomerReservations(customerId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('reservations')
    .select(`
      *,
      package:packages(name, duration_minutes),
      payments(amount, status, paid_at)
    `)
    .eq('customer_id', customerId)
    .order('reservation_date', { ascending: false })
  
  if (error) {
    console.error('Error fetching customer reservations:', error)
    throw new Error(`Failed to fetch customer reservations: ${error.message}`)
  }
  
  return data || []
}