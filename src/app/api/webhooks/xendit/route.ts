import { NextRequest, NextResponse } from 'next/server'
import { getXenditClient } from '@/lib/payments/xendit-client'
import { updatePayment, getPaymentByExternalId } from '@/actions/payments'
import { updateReservationStatusOnPayment } from '@/actions/reservations'

export async function POST(req: NextRequest) {
  try {
    // Get the raw body for signature verification
    const rawBody = await req.text()
    const callbackData = JSON.parse(rawBody)
    
    // Log the callback for debugging
    console.log('Xendit callback received:', callbackData)
    
    // Verify the callback signature (in production, you should verify the signature)
    // const signature = req.headers.get('xendit-callback-token')
    // if (!verifySignature(signature, rawBody)) {
    //   return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 401 })
    // }
    
    // Extract payment information
    const { id, status, external_id, paid_amount, payment_method } = callbackData
    
    // Find our payment record by external_id
    const payment = await getPaymentByExternalId(id)
    if (!payment) {
      console.log(`Payment dengan external_id ${id} tidak ditemukan`)
      return NextResponse.json({ success: true, message: 'Pembayaran tidak ditemukan, tidak ada yang diperbarui' })
    }
    
    // Update payment status based on Xendit status
    let paymentStatus: 'pending' | 'completed' | 'failed' | 'partial' | 'refunded' = 'pending'
    let paidAt: string | null = null
    
    switch (status) {
      case 'PAID':
        paymentStatus = 'completed'
        paidAt = new Date().toISOString()
        break
      case 'EXPIRED':
      case 'CANCELLED':
        paymentStatus = 'failed'
        break
      case 'PENDING':
        paymentStatus = 'pending'
        break
      default:
        paymentStatus = 'pending'
    }
    
    // Update payment in our database
    const updatedPayment = await updatePayment(payment.id, {
      status: paymentStatus,
      external_status: status,
      paid_at: paidAt,
      callback_data: callbackData
    })
    
    // Update reservation payment status
    if (payment.reservation_id) {
      await updateReservationStatusOnPayment(payment.reservation_id, paymentStatus)
    }
    
    console.log(`Memperbarui pembayaran ${payment.id} ke status: ${paymentStatus}`)
    
    return NextResponse.json({ success: true, message: 'Callback berhasil diproses' })
  } catch (error) {
    console.error('Error processing Xendit callback:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal memproses callback' },
      { status: 500 }
    )
  }
}

// Xendit also sends HEAD requests to verify the endpoint
export async function HEAD() {
  return NextResponse.json({ success: true })
}