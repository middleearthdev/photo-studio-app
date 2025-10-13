"use server"

import { prisma } from '@/lib/prisma'
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
  is_guest: boolean | null
  guest_token: string | null
  created_at: string
  updated_at: string
  
  // Relations
  user?: {
    id: string
    name: string | null
    image: string | null
    role: string
    is_active: boolean | null
  } | null
  
  // Aggregated data
  total_reservations?: number
  total_spent?: number
  last_reservation_date?: string | null
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
  const { 
    page = 1, 
    pageSize = 10, 
    search = '', 
    type = 'all',
    studioId
  } = params
  
  const { offset, pageSize: validPageSize } = calculatePagination(page, pageSize, 0)

  // Build where clause
  const where: any = {}
  
  // Filter by type
  if (type === 'registered') {
    where.user_id = { not: null }
  } else if (type === 'guest') {
    where.user_id = null
  }

  // Apply search
  if (search.trim()) {
    where.OR = [
      { full_name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } }
    ]
  }

  // Filter by studio if provided (through reservations)
  if (studioId) {
    where.reservations = {
      some: {
        studio_id: studioId
      }
    }
  }

  // Get customers with relations
  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true,
            is_active: true
          }
        },
        reservations: {
          select: {
            id: true,
            total_amount: true,
            reservation_date: true,
            status: true,
            studio_id: true
          }
        }
      },
      orderBy: { created_at: 'desc' },
      skip: offset,
      take: validPageSize
    }),
    prisma.customer.count({ where })
  ])

  // Process the data to add aggregated information
  const processedData = customers.map((customer) => {
    const reservations = customer.reservations || []
    const completedReservations = reservations.filter((r) => r.status === 'completed')
    
    return {
      ...customer,
      created_at: customer.created_at?.toISOString() || '',
      updated_at: customer.updated_at?.toISOString() || '',
      birth_date: customer.birth_date?.toISOString() || null,
      total_reservations: reservations.length,
      total_spent: completedReservations.reduce((sum, r) => sum + Number(r.total_amount || 0), 0),
      last_reservation_date: reservations.length > 0 
        ? reservations.sort((a, b) => new Date(b.reservation_date).getTime() - new Date(a.reservation_date).getTime())[0].reservation_date.toISOString()
        : null
    }
  })

  const pagination = calculatePagination(page, validPageSize, total)

  return {
    data: processedData,
    pagination
  }
}

// Get customer by ID
export async function getCustomerById(id: string): Promise<Customer | null> {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          role: true,
          is_active: true
        }
      },
      reservations: {
        select: {
          id: true,
          booking_code: true,
          total_amount: true,
          reservation_date: true,
          status: true,
          payment_status: true
        }
      }
    }
  })
  
  if (!customer) {
    return null
  }
  
  // Process aggregated data
  const reservations = customer.reservations || []
  const completedReservations = reservations.filter((r) => r.status === 'completed')
  
  return {
    ...customer,
    created_at: customer.created_at?.toISOString() || '',
    updated_at: customer.updated_at?.toISOString() || '',
    birth_date: customer.birth_date?.toISOString() || null,
    total_reservations: reservations.length,
    total_spent: completedReservations.reduce((sum, r) => sum + Number(r.total_amount || 0), 0),
    last_reservation_date: reservations.length > 0 
      ? reservations.sort((a, b) => new Date(b.reservation_date).getTime() - new Date(a.reservation_date).getTime())[0].reservation_date.toISOString()
      : null
  }
}

// Create new customer
export async function createCustomer(data: CreateCustomerData): Promise<Customer> {
  const customerData = {
    user_id: data.user_id || null,
    full_name: data.full_name,
    email: data.email,
    phone: data.phone,
    address: data.address || null,
    birth_date: data.birth_date ? new Date(data.birth_date) : null,
    notes: data.notes || null,
    is_guest: data.is_guest ?? !data.user_id,
  }
  
  const customer = await prisma.customer.create({
    data: customerData,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          role: true,
          is_active: true
        }
      }
    }
  })
  
  revalidatePath('/admin/customers')
  return { 
    ...customer, 
    created_at: customer.created_at?.toISOString() || '',
    updated_at: customer.updated_at?.toISOString() || '',
    birth_date: customer.birth_date?.toISOString() || null,
    total_reservations: 0, 
    total_spent: 0 
  }
}

// Update customer
export async function updateCustomer(id: string, data: UpdateCustomerData): Promise<Customer> {
  const updateData: any = { ...data }
  
  if (data.birth_date) {
    updateData.birth_date = new Date(data.birth_date)
  }
  
  const customer = await prisma.customer.update({
    where: { id },
    data: updateData,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          role: true,
          is_active: true
        }
      }
    }
  })
  
  revalidatePath('/admin/customers')
  return {
    ...customer,
    created_at: customer.created_at?.toISOString() || '',
    updated_at: customer.updated_at?.toISOString() || '',
    birth_date: customer.birth_date?.toISOString() || null,
  }
}

// Delete customer
export async function deleteCustomer(id: string): Promise<void> {
  // Check if customer has any reservations
  const reservationCount = await prisma.reservation.count({
    where: { customer_id: id }
  })
  
  if (reservationCount > 0) {
    throw new Error('Cannot delete customer with existing reservations')
  }
  
  await prisma.customer.delete({
    where: { id }
  })
  
  revalidatePath('/admin/customers')
}

// Get customer statistics
export async function getCustomerStats(studioId?: string) {
  const today = new Date()
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  
  // Build where clause for customers with reservations filter
  const customerWhere: any = {}
  if (studioId) {
    customerWhere.reservations = {
      some: {
        studio_id: studioId
      }
    }
  }
  
  // Build where clause for reservations
  const reservationWhere: any = {}
  if (studioId) {
    reservationWhere.studio_id = studioId
  }
  
  // Get customers with reservations
  const customers = await prisma.customer.findMany({
    where: customerWhere,
    select: {
      id: true,
      user_id: true,
      created_at: true
    }
  })
  
  // Get reservation data for revenue calculation
  const reservations = await prisma.reservation.findMany({
    where: reservationWhere,
    select: {
      customer_id: true,
      total_amount: true,
      status: true,
      created_at: true
    }
  })
  
  // Calculate stats
  const totalCustomers = customers.length
  const registeredCustomers = customers.filter(c => c.user_id).length
  const guestCustomers = customers.filter(c => !c.user_id).length
  const newThisMonth = customers.filter(c => c.created_at && c.created_at >= thisMonth).length
  
  // Calculate customer lifetime value
  const customerRevenueMap = new Map()
  reservations
    .filter(r => r.status === 'completed')
    .forEach(r => {
      const current = customerRevenueMap.get(r.customer_id) || 0
      customerRevenueMap.set(r.customer_id, current + Number(r.total_amount))
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
  const reservations = await prisma.reservation.findMany({
    where: { customer_id: customerId },
    include: {
      package: {
        select: {
          name: true,
          duration_minutes: true
        }
      },
      payments: {
        select: {
          amount: true,
          status: true,
          paid_at: true
        }
      }
    },
    orderBy: { reservation_date: 'desc' }
  })
  
  return reservations.map(reservation => ({
    ...reservation,
    reservation_date: reservation.reservation_date.toISOString(),
    start_time: reservation.start_time.toISOString(),
    end_time: reservation.end_time.toISOString(),
    confirmed_at: reservation.confirmed_at?.toISOString() || null,
    completed_at: reservation.completed_at?.toISOString() || null,
    cancelled_at: reservation.cancelled_at?.toISOString() || null,
    created_at: reservation.created_at?.toISOString() || '',
    updated_at: reservation.updated_at?.toISOString() || '',
    payments: reservation.payments.map(payment => ({
      ...payment,
      paid_at: payment.paid_at?.toISOString() || null
    }))
  }))
}