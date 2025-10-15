"use server"

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { PaginationParams, PaginatedResult, calculatePagination } from '@/lib/constants/pagination'
import { updateReservationPaymentStatus } from '@/actions/reservations'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export interface ActionResult<T = any> {
  success: boolean
  data?: T
  error?: string
}

export type PaymentStatus = 'pending' | 'paid' | 'partial' | 'failed' | 'cancelled' | 'refunded'

// Helper function to convert Prisma payment data to Payment interface
function convertPrismaPayment(payment: any): Payment {
  return {
    ...payment,
    amount: Number(payment.amount),
    gateway_fee: Number(payment.gateway_fee),
    net_amount: payment.net_amount ? Number(payment.net_amount) : null,
    // Convert nested reservation Decimal fields
    reservation: payment.reservation ? {
      ...payment.reservation,
      total_amount: Number(payment.reservation.total_amount),
      package_price: payment.reservation.package_price ? Number(payment.reservation.package_price) : undefined,
      dp_amount: payment.reservation.dp_amount ? Number(payment.reservation.dp_amount) : undefined,
      remaining_amount: payment.reservation.remaining_amount ? Number(payment.reservation.remaining_amount) : undefined,
      subtotal: payment.reservation.subtotal ? Number(payment.reservation.subtotal) : undefined,
      discount_amount: payment.reservation.discount_amount ? Number(payment.reservation.discount_amount) : undefined,
      tax_amount: payment.reservation.tax_amount ? Number(payment.reservation.tax_amount) : undefined,
      facility_addon_total: payment.reservation.facility_addon_total ? Number(payment.reservation.facility_addon_total) : undefined,
      other_addon_total: payment.reservation.other_addon_total ? Number(payment.reservation.other_addon_total) : undefined
    } : undefined
  }
}

// Helper function to convert Prisma payment method data to PaymentMethod interface
function convertPrismaPaymentMethod(paymentMethod: any): PaymentMethod {
  return {
    ...paymentMethod,
    fee_percentage: paymentMethod.fee_percentage ? Number(paymentMethod.fee_percentage) : null,
    fee_amount: paymentMethod.fee_amount ? Number(paymentMethod.fee_amount) : null
  }
}

export interface Payment {
  id: string
  reservation_id: string | null
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
  paid_at: Date | null
  expires_at: Date | null
  created_at: Date
  updated_at: Date

  // Relations
  reservation?: {
    id: string
    booking_code: string
    customer_id: string
    total_amount: number
    reservation_date: Date
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
  studio_id: string | null
  name: string
  type: string
  provider: string | null
  account_details: any
  xendit_config: any
  fee_type?: string | null
  fee_percentage: number | null
  fee_amount?: number | null
  is_active: boolean | null
  created_at: Date | null
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

  // Build the where clause
  const where: any = {
    reservation: {
      studio_id: studioId
    }
  }

  // Apply filters
  if (status !== 'all') {
    where.status = status
  }

  if (payment_type !== 'all') {
    where.payment_type = payment_type
  }

  if (payment_method !== 'all') {
    where.payment_method_id = payment_method
  }

  if (date_from && date_to) {
    where.created_at = {
      gte: new Date(date_from),
      lte: new Date(date_to)
    }
  } else if (date_from) {
    where.created_at = { gte: new Date(date_from) }
  } else if (date_to) {
    where.created_at = { lte: new Date(date_to) }
  }

  // Apply search
  if (search.trim()) {
    const searchTerm = search.trim()
    where.OR = [
      { external_payment_id: { contains: searchTerm, mode: 'insensitive' } },
      { reservation: { booking_code: { contains: searchTerm, mode: 'insensitive' } } },
      { reservation: { customer: { full_name: { contains: searchTerm, mode: 'insensitive' } } } },
      { reservation: { customer: { email: { contains: searchTerm, mode: 'insensitive' } } } },
      { reservation: { customer: { phone: { contains: searchTerm, mode: 'insensitive' } } } },
      { reservation: { guest_email: { contains: searchTerm, mode: 'insensitive' } } },
      { reservation: { guest_phone: { contains: searchTerm, mode: 'insensitive' } } }
    ]
  }

  try {
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: offset,
        take: validPageSize,
        include: {
          reservation: {
            include: {
              customer: {
                select: { full_name: true, email: true, phone: true }
              }
            }
          },
          payment_method: {
            select: { id: true, name: true, type: true, provider: true }
          }
        }
      }),
      prisma.payment.count({ where })
    ])

    const pagination = calculatePagination(page, validPageSize, total)

    // Convert Prisma data to match interface
    const convertedPayments: Payment[] = payments.map(convertPrismaPayment)

    return {
      data: convertedPayments,
      pagination
    }
  } catch (error) {
    console.error('Error fetching paginated payments:', error)
    throw new Error(`Failed to fetch payments: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
    const paymentMethod = await prisma.paymentMethod.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        type: true,
        provider: true,
        fee_type: true,
        fee_percentage: true,
        fee_amount: true
      }
    })

    if (!paymentMethod) {
      return { success: false, error: 'Metode pembayaran tidak ditemukan' }
    }

    const convertedPaymentMethod = {
      ...paymentMethod,
      provider: paymentMethod.provider || '',
      fee_type: paymentMethod.fee_type || undefined,
      fee_percentage: Number(paymentMethod.fee_percentage || 0),
      fee_amount: paymentMethod.fee_amount ? Number(paymentMethod.fee_amount) : undefined
    }
    
    return { success: true, data: convertedPaymentMethod }
  } catch (error) {
    console.error('Error in getPaymentMethodById:', error)
    return { success: false, error: 'Terjadi kesalahan saat mengambil data metode pembayaran' }
  }
}

// Get payment by ID
export async function getPaymentById(id: string): Promise<Payment | null> {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        reservation: {
          include: {
            customer: {
              select: { full_name: true, email: true, phone: true }
            }
          }
        },
        payment_method: {
          select: { id: true, name: true, type: true, provider: true }
        }
      }
    })

    return payment ? convertPrismaPayment(payment) : null
  } catch (error) {
    console.error('Error fetching payment:', error)
    throw new Error(`Failed to fetch payment: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Get payments by reservation ID
export async function getPaymentsByReservationId(reservationId: string): Promise<ActionResult<Payment[]>> {
  try {
    const payments = await prisma.payment.findMany({
      where: { reservation_id: reservationId },
      orderBy: { created_at: 'desc' },
      include: {
        reservation: {
          include: {
            customer: {
              select: { full_name: true, email: true, phone: true }
            }
          }
        },
        payment_method: {
          select: { id: true, name: true, type: true, provider: true }
        }
      }
    })

    return { success: true, data: payments.map(convertPrismaPayment) }
  } catch (error) {
    console.error('Error in getPaymentsByReservationId:', error)
    return { success: false, error: 'Failed to fetch payments' }
  }
}

// Get payment by external ID (for webhooks)
export async function getPaymentByExternalId(externalId: string): Promise<Payment | null> {
  try {
    // First try to find by external_payment_id
    let payment = await prisma.payment.findFirst({
      where: { external_payment_id: externalId },
      include: {
        reservation: {
          include: {
            customer: {
              select: { full_name: true, email: true, phone: true }
            }
          }
        },
        payment_method: {
          select: { id: true, name: true, type: true, provider: true }
        }
      }
    })

    // If not found and looks like a Xendit invoice ID, try to find in callback_data
    if (!payment && externalId.startsWith('invoice-')) {
      const allPayments = await prisma.payment.findMany({
        include: {
          reservation: {
            include: {
              customer: {
                select: { full_name: true, email: true, phone: true }
              }
            }
          },
          payment_method: {
            select: { id: true, name: true, type: true, provider: true }
          }
        }
      })

      payment = allPayments.find(p => {
        if (p.callback_data && typeof p.callback_data === 'object' && !Array.isArray(p.callback_data)) {
          const callbackData = p.callback_data as Record<string, any>
          return callbackData.external_id === externalId ||
            callbackData.xendit_invoice_id === externalId
        }
        return false
      }) || null
    }

    return payment ? convertPrismaPayment(payment) : null
  } catch (error) {
    console.error('Error fetching payment by external ID:', error)
    throw new Error(`Failed to fetch payment: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Complete payment (Lunas) - Create final payment and update reservation status
export async function completePaymentAction(
  reservationId: string,
  paymentMethodId: string | null | undefined = null
): Promise<ActionResult<Payment>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user) {
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

    // Get reservation details with studio check for CS users
    const whereClause: any = { id: reservationId }
    if (currentProfile.role === 'cs') {
      whereClause.studio_id = currentProfile.studio_id
    }

    const reservation = await prisma.reservation.findUnique({
      where: whereClause,
      select: {
        id: true,
        booking_code: true,
        studio_id: true,
        customer_id: true,
        total_amount: true,
        dp_amount: true,
        remaining_amount: true,
        payment_status: true,
        customer: {
          select: { id: true, full_name: true, email: true, phone: true, is_guest: true }
        }
      }
    })

    if (!reservation) {
      return { success: false, error: 'Reservation not found' }
    }

    // Check if payment can be completed
    if (reservation.payment_status === 'paid') {
      return { success: false, error: 'Payment is already completed' }
    }

    // Calculate remaining amount to be paid
    const remainingAmount = Number(reservation.total_amount) - Number(reservation.dp_amount)

    if (remainingAmount <= 0) {
      return { success: false, error: 'No remaining amount to pay' }
    }

    // Create final payment record
    const payment = await prisma.payment.create({
      data: {
        reservation_id: reservationId,
        payment_method_id: paymentMethodId && paymentMethodId.trim() !== '' ? paymentMethodId : null,
        amount: remainingAmount,
        payment_type: 'remaining',
        status: 'paid',
        gateway_fee: 0,
        net_amount: remainingAmount,
        paid_at: new Date()
      },
      include: {
        reservation: {
          include: {
            customer: {
              select: { full_name: true, email: true, phone: true }
            }
          }
        },
        payment_method: {
          select: { id: true, name: true, type: true, provider: true }
        }
      }
    })

    // Update reservation payment status to completed
    const updateResult = await updateReservationPaymentStatus(reservationId, 'paid')
    if (!updateResult.success) {
      console.error('Error updating reservation payment status:', updateResult.error)
      return { success: false, error: 'Payment recorded but failed to update reservation status' }
    }

    revalidatePath('/admin/payments')
    revalidatePath('/cs/reservations')
    revalidatePath('/admin/reservations')

    return { success: true, data: convertPrismaPayment(payment) }
  } catch (error: any) {
    console.error('Error in completePaymentAction:', error)
    return { success: false, error: error.message || 'Failed to complete payment' }
  }
}

// Create bank transfer payment for reservation
export async function createBankTransferPayment(
  reservationId: string,
  paymentMethodId: string,
  dpAmount: number
): Promise<ActionResult<Payment>> {
  try {
    const payment = await prisma.payment.create({
      data: {
        reservation_id: reservationId,
        payment_method_id: paymentMethodId,
        amount: dpAmount,
        payment_type: 'dp',
        status: 'pending',
        gateway_fee: 0
      },
      include: {
        reservation: {
          include: {
            customer: {
              select: { full_name: true, email: true, phone: true }
            }
          }
        },
        payment_method: {
          select: { id: true, name: true, type: true, provider: true }
        }
      }
    })

    revalidatePath('/admin/payments')
    revalidatePath('/cs/payments')

    return { success: true, data: convertPrismaPayment(payment) }
  } catch (error: any) {
    console.error('Error in createBankTransferPayment:', error)
    return { success: false, error: error.message || 'Failed to create bank transfer payment' }
  }
}

// Create new payment with Xendit support
export async function createPayment(data: CreatePaymentData): Promise<Payment> {
  try {
    // Use provided net_amount or calculate it
    const netAmount = data.net_amount !== undefined
      ? data.net_amount
      : data.amount - (data.gateway_fee || 0)

    const payment = await prisma.payment.create({
      data: {
        reservation_id: data.reservation_id,
        payment_method_id: data.payment_method_id || null,
        amount: data.amount,
        payment_type: data.payment_type,
        external_payment_id: data.external_payment_id || null,
        external_status: data.external_status || null,
        payment_url: data.payment_url || null,
        gateway_fee: data.gateway_fee || 0,
        net_amount: netAmount,
        expires_at: data.expires_at ? new Date(data.expires_at) : null
      },
      include: {
        reservation: {
          include: {
            customer: {
              select: { full_name: true, email: true, phone: true }
            }
          }
        },
        payment_method: {
          select: { id: true, name: true, type: true, provider: true }
        }
      }
    })

    revalidatePath('/admin/payments')
    return convertPrismaPayment(payment)
  } catch (error) {
    console.error('Error creating payment:', error)
    throw new Error(`Failed to create payment: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Update payment
export async function updatePayment(id: string, data: UpdatePaymentData): Promise<Payment> {
  try {
    const updateData: any = { ...data }
    
    if (data.paid_at) {
      updateData.paid_at = new Date(data.paid_at)
    }

    const payment = await prisma.payment.update({
      where: { id },
      data: updateData,
      include: {
        reservation: {
          include: {
            customer: {
              select: { full_name: true, email: true, phone: true }
            }
          }
        },
        payment_method: {
          select: { id: true, name: true, type: true, provider: true }
        }
      }
    })

    revalidatePath('/admin/payments')
    return convertPrismaPayment(payment)
  } catch (error) {
    console.error('Error updating payment:', error)
    throw new Error(`Failed to update payment: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Delete payment
export async function deletePayment(id: string): Promise<void> {
  try {
    await prisma.payment.delete({
      where: { id }
    })

    revalidatePath('/admin/payments')
  } catch (error) {
    console.error('Error deleting payment:', error)
    throw new Error(`Failed to delete payment: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Delete payment action (for webhook usage)
export async function deletePaymentAction(id: string): Promise<ActionResult<void>> {
  try {
    await prisma.payment.delete({
      where: { id }
    })

    revalidatePath('/admin/payments')
    revalidatePath('/cs/payments')
    
    return { success: true }
  } catch (error: any) {
    console.error('Error in deletePaymentAction:', error)
    return { success: false, error: error.message || 'Failed to delete payment' }
  }
}

// Get payment statistics
export async function getPaymentStats(studioId: string) {
  try {
    const payments = await prisma.payment.findMany({
      where: {
        reservation: {
          studio_id: studioId
        }
      }
    })

    const today = new Date()
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1)

    const stats = {
      total: payments.length,
      completed: payments.filter(p => p.status === 'paid').length,
      pending: payments.filter(p => p.status === 'pending').length,
      failed: payments.filter(p => p.status === 'failed').length,
      totalAmount: payments
        .filter(p => p.status === 'paid' && !['cancelled', 'failed'].includes(p.status))
        .reduce((sum, p) => sum + Number(p.amount), 0),
      totalFees: payments
        .filter(p => p.status === 'paid' && !['cancelled', 'failed'].includes(p.status))
        .reduce((sum, p) => sum + Number(p.gateway_fee || 0), 0),
      thisMonthAmount: payments
        .filter(p => p.status === 'paid' && !['cancelled', 'failed'].includes(p.status) && p.created_at && p.created_at >= thisMonth)
        .reduce((sum, p) => sum + Number(p.amount), 0),
      pendingAmount: payments
        .filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + Number(p.amount), 0),
    }

    return stats
  } catch (error) {
    console.error('Error fetching payment stats:', error)
    throw new Error(`Failed to fetch payment stats: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Get payment methods
export async function getPaymentMethods(studioId: string): Promise<PaymentMethod[]> {
  try {
    const paymentMethods = await prisma.paymentMethod.findMany({
      where: {
        studio_id: studioId,
        is_active: true
      },
      orderBy: { name: 'asc' }
    })

    return paymentMethods.map(convertPrismaPaymentMethod)
  } catch (error) {
    console.error('Error fetching payment methods:', error)
    throw new Error(`Failed to fetch payment methods: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Get all payment methods (including inactive)
export async function getAllPaymentMethods(studioId: string): Promise<PaymentMethod[]> {
  try {
    const paymentMethods = await prisma.paymentMethod.findMany({
      where: { studio_id: studioId },
      orderBy: { name: 'asc' }
    })

    return paymentMethods.map(convertPrismaPaymentMethod)
  } catch (error) {
    console.error('Error fetching all payment methods:', error)
    throw new Error(`Failed to fetch payment methods: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
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
  try {
    const paymentMethod = await prisma.paymentMethod.create({
      data
    })

    revalidatePath('/admin/payments/methods')
    return convertPrismaPaymentMethod(paymentMethod)
  } catch (error) {
    console.error('Error creating payment method:', error)
    throw new Error(`Failed to create payment method: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Update payment method
export async function updatePaymentMethod(id: string, data: UpdatePaymentMethodData): Promise<PaymentMethod> {
  try {
    const paymentMethod = await prisma.paymentMethod.update({
      where: { id },
      data
    })

    revalidatePath('/admin/payments/methods')
    return convertPrismaPaymentMethod(paymentMethod)
  } catch (error) {
    console.error('Error updating payment method:', error)
    throw new Error(`Failed to update payment method: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Delete payment method
export async function deletePaymentMethod(id: string): Promise<void> {
  try {
    await prisma.paymentMethod.delete({
      where: { id }
    })

    revalidatePath('/admin/payments/methods')
  } catch (error) {
    console.error('Error deleting payment method:', error)
    throw new Error(`Failed to delete payment method: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Toggle payment method active status
export async function togglePaymentMethodStatus(id: string, isActive: boolean): Promise<PaymentMethod> {
  try {
    const paymentMethod = await prisma.paymentMethod.update({
      where: { id },
      data: { is_active: isActive }
    })

    revalidatePath('/admin/payments/methods')
    return convertPrismaPaymentMethod(paymentMethod)
  } catch (error) {
    console.error('Error toggling payment method status:', error)
    throw new Error(`Failed to toggle payment method status: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Update payment status (for manual updates)
export async function updatePaymentStatus(id: string, status: PaymentStatus): Promise<Payment> {
  try {
    const updateData: any = { status }

    // Set paid_at timestamp if marking as completed
    if (status === 'paid') {
      updateData.paid_at = new Date()
    }

    const payment = await prisma.payment.update({
      where: { id },
      data: updateData,
      include: {
        reservation: {
          include: {
            customer: {
              select: { full_name: true, email: true, phone: true }
            }
          }
        },
        payment_method: {
          select: { id: true, name: true, type: true, provider: true }
        }
      }
    })

    // Update the corresponding reservation's payment status
    if (payment.reservation_id) {
      let reservationPaymentStatus: 'pending' | 'partial' | 'paid' | 'failed' = 'pending'

      // Map payment status to reservation status
      if (status === 'paid') {
        if (payment.payment_type === 'dp') {
          // DP payment completed - reservation is partially paid
          reservationPaymentStatus = 'partial'
        } else if (payment.payment_type === 'full') {
          // Full payment completed - reservation is fully paid
          reservationPaymentStatus = 'paid'
        } else if (payment.payment_type === 'remaining') {
          // Remaining payment completed - check if all payments are now completed
          const allPaymentsResult = await getPaymentsByReservationId(payment.reservation_id)
          const allCompleted = allPaymentsResult.success && allPaymentsResult.data
            ? allPaymentsResult.data.every(p =>
              p.id === payment.id || p.status === 'paid'
            )
            : false

          if (allCompleted) {
            reservationPaymentStatus = 'paid'
          } else {
            reservationPaymentStatus = 'partial'
          }
        }
      } else if (status === 'failed') {
        reservationPaymentStatus = 'failed'
      }

      await updateReservationPaymentStatus(payment.reservation_id, reservationPaymentStatus)
    }

    revalidatePath('/admin/payments')
    return convertPrismaPayment(payment)
  } catch (error) {
    console.error('Error updating payment status:', error)
    throw new Error(`Failed to update payment status: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}