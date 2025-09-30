'use server'

import { createClient } from '@/lib/supabase/server'
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
    const supabase = await createClient()

    const { data: payment, error } = await supabase
      .from('payments')
      .select('*')
      .eq('reservation_id', reservationId)
      .eq('status', 'pending')
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found"
      console.error('Error fetching payment:', error)
      return {
        success: false,
        error: 'Failed to fetch payment information'
      }
    }

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
    const supabase = await createClient()

    // Get the reservation first to validate
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', data.reservationId)
      .single()

    if (reservationError) {
      console.error('Error fetching reservation:', reservationError)
      return {
        success: false,
        error: 'Reservation not found'
      }
    }

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
    let newPaymentStatus = 'partial'
    if (data.paymentAmount >= reservation.total_amount) {
      newPaymentStatus = 'completed'
    }

    // Start transaction
    const { data: updatedReservation, error: updateError } = await supabase
      .from('reservations')
      .update({
        status: 'confirmed',
        payment_status: newPaymentStatus,
        confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', data.reservationId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating reservation:', updateError)
      return {
        success: false,
        error: 'Failed to update reservation status'
      }
    }

    // Check if payment record already exists
    const { data: existingPayment, error: existingPaymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('reservation_id', data.reservationId)
      .eq('status', 'pending')
      .single()

    let payment
    let paymentError

    if (existingPayment && !existingPaymentError) {
      // Update existing payment record
      const { data: updatedPayment, error: updateError } = await supabase
        .from('payments')
        .update({
          amount: data.paymentAmount,
          payment_type: data.paymentAmount >= reservation.total_amount ? 'full' : 'dp',
          status: 'completed',
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingPayment.id)
        .select()
        .single()

      payment = updatedPayment
      paymentError = updateError
    } else {
      // Create new payment record
      const { data: newPayment, error: createError } = await supabase
        .from('payments')
        .insert({
          reservation_id: data.reservationId,
          amount: data.paymentAmount,
          payment_type: data.paymentAmount >= reservation.total_amount ? 'full' : 'dp',
          payment_method_id: data.paymentMethod,
          status: 'completed',
          paid_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      payment = newPayment
      paymentError = createError
    }

    if (paymentError) {
      console.error('Error handling payment record:', paymentError)

      // Rollback reservation update
      await supabase
        .from('reservations')
        .update({
          status: 'pending',
          payment_status: 'pending',
          confirmed_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.reservationId)

      return {
        success: false,
        error: existingPayment ? 'Failed to update payment record' : 'Failed to create payment record'
      }
    }

    // Revalidate paths
    revalidatePath('/cs/reservations')
    revalidatePath('/cs/payments')

    return {
      success: true,
      data: {
        reservation: updatedReservation,
        payment: payment
      }
    }

  } catch (error) {
    console.error('Booking confirmation error:', error)
    return {
      success: false,
      error: 'Internal server error'
    }
  }
}