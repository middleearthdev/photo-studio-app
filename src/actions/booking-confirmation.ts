'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export interface BookingConfirmationData {
  reservationId: string
  paymentAmount: number
  paymentMethod: string
}

export interface ActionResult<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Get existing payment for a reservation
export async function getExistingPaymentAction(reservationId: string): Promise<ActionResult<any>> {
  try {
    const payment = await prisma.payment.findFirst({
      where: {
        reservation_id: reservationId,
        status: 'pending'
      }
    })

    return {
      success: true,
      data: payment || null
    }
  } catch (error: any) {
    console.error('Error in getExistingPaymentAction:', error)
    return {
      success: false,
      error: error.message || 'An error occurred'
    }
  }
}

export async function confirmBookingWithPaymentAction(data: BookingConfirmationData) {
  try {
    // Get the reservation first to validate
    const reservation = await prisma.reservation.findUnique({
      where: { id: data.reservationId }
    })

    if (!reservation) {
      return {
        success: false,
        error: 'Reservation not found'
      }
    }

    // Validate that reservation is in pending status
    if (reservation.status !== 'pending') {
      return {
        success: false,
        error: 'Only pending reservations can be confirmed'
      }
    }

    // Validate payment amount
    if (data.paymentAmount <= 0) {
      return {
        success: false,
        error: 'Payment amount must be greater than 0'
      }
    }

    // Determine payment status based on amount
    let newPaymentStatus: 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded' = 'paid'
    if (data.paymentAmount < Number(reservation.total_amount)) {
      newPaymentStatus = 'pending' // Partial payment
    }

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Update reservation
      const updatedReservation = await tx.reservation.update({
        where: { id: data.reservationId },
        data: {
          status: 'confirmed',
          payment_status: newPaymentStatus,
          confirmed_at: new Date(),
          updated_at: new Date()
        }
      })

      // Check if payment record already exists
      const existingPayment = await tx.payment.findFirst({
        where: {
          reservation_id: data.reservationId,
          status: 'pending'
        }
      })

      let payment

      if (existingPayment) {
        // Update existing payment record
        payment = await tx.payment.update({
          where: { id: existingPayment.id },
          data: {
            amount: data.paymentAmount,
            payment_type: data.paymentAmount >= Number(reservation.total_amount) ? 'full' : 'dp',
            status: 'paid',
            paid_at: new Date(),
            updated_at: new Date()
          }
        })
      } else {
        // Create new payment record
        payment = await tx.payment.create({
          data: {
            reservation_id: data.reservationId,
            amount: data.paymentAmount,
            payment_type: data.paymentAmount >= Number(reservation.total_amount) ? 'full' : 'dp',
            payment_method_id: data.paymentMethod,
            status: 'paid',
            paid_at: new Date(),
            created_at: new Date(),
            updated_at: new Date()
          }
        })
      }

      return { reservation: updatedReservation, payment }
    })

    // Revalidate paths
    revalidatePath('/cs/reservations')
    revalidatePath('/cs/payments')

    return {
      success: true,
      data: result
    }

  } catch (error) {
    console.error('Booking confirmation error:', error)
    return {
      success: false,
      error: 'Internal server error'
    }
  }
}