import { Xendit } from 'xendit-node'
import { createPayment, updatePayment } from '@/actions/payments'
import { getReservationByBookingCodeAction } from '@/actions/reservations'
import { Payment } from '@/actions/payments'

// Initialize Xendit client
const xenditClient = new Xendit({
  secretKey: process.env.XENDIT_SECRET_KEY || '',
})

// Invoice API
const { Invoice } = xenditClient
const invoice = new Invoice({})

export class XenditPaymentService {
  /**
   * Create a payment for a reservation using Xendit
   */
  static async createPaymentForReservation(
    reservationId: string,
    paymentType: 'dp' | 'remaining' | 'full',
    paymentMethodId?: string
  ) {
    try {
      // Get reservation details
      // Note: This assumes reservationId is actually the booking_code. 
      // In a real implementation, you might need to adjust this.
      const reservationResult = await getReservationByBookingCodeAction(reservationId)
      if (!reservationResult.success || !reservationResult.data) {
        throw new Error('Reservasi tidak ditemukan')
      }

      const reservation = reservationResult.data

      // Calculate amount based on payment type
      let amount = 0
      let description = ''

      switch (paymentType) {
        case 'dp':
          amount = reservation.dp_amount
          description = `Uang Muka untuk Booking ${reservation.booking_code}`
          break
        case 'remaining':
          amount = reservation.remaining_amount
          description = `Sisa Pembayaran untuk Booking ${reservation.booking_code}`
          break
        case 'full':
          amount = reservation.total_amount
          description = `Pembayaran Penuh untuk Booking ${reservation.booking_code}`
          break
        default:
          throw new Error('Tipe pembayaran tidak valid')
      }

      // Customer data
      const customerData = {
        name: reservation.customer?.full_name || '',
        email: reservation.customer?.email || '',
        phone: reservation.customer?.phone || '',
      }

      // Determine payment method for Xendit
      // This would typically come from the paymentMethodId, but for now we'll use a default
      const xenditPaymentMethod = 'BANK_TRANSFER'

      // Generate external ID for tracking
      const externalId = `invoice-${reservation.id}-${Date.now()}`

      // Create Xendit invoice
      const invoiceParams = {
        externalId: externalId,
        amount: amount,
        description: description,
        customer: {
          givenNames: customerData.name,
          email: customerData.email,
          phoneNumber: customerData.phone,
        },
        successRedirectURL: `${process.env.NEXT_PUBLIC_APP_URL}/booking/success`,
        failureRedirectURL: `${process.env.NEXT_PUBLIC_APP_URL}/booking/payment-failed`,
        paymentMethods: [xenditPaymentMethod],
        currency: 'IDR',
        items: [
          {
            name: description,
            quantity: 1,
            price: amount,
            category: 'Service',
          },
        ],
        callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/xendit`,
      }

      const xenditInvoice = await invoice.createInvoice({
        data: invoiceParams,
      })

      // Create payment record in our database
      const paymentData = {
        reservation_id: reservation.id,
        payment_method_id: paymentMethodId || undefined,
        amount: amount,
        payment_type: paymentType,
        external_payment_id: externalId, // Use our external ID for tracking
        external_status: xenditInvoice.status,
        payment_url: xenditInvoice.invoiceUrl,
        gateway_fee: 0, // This should be calculated based on Xendit's fee structure
        expires_at: xenditInvoice.expiryDate?.toISOString(),
        callback_data: {
          xendit_invoice_id: xenditInvoice.id,
          external_id: externalId
        }
      }

      const payment = await createPayment(paymentData)

      return {
        success: true,
        payment,
        invoice_url: xenditInvoice.invoiceUrl,
      }
    } catch (error) {
      console.error('Error creating Xendit payment:', error)
      throw new Error(`Gagal membuat pembayaran: ${error instanceof Error ? error.message : 'Error tidak diketahui'}`)
    }
  }

  /**
   * Handle Xendit callback
   */
  static async handleCallback(callbackData: any) {
    try {
      const { id, status } = callbackData

      // Update payment status in our database
      // Find payment by external_payment_id
      // This is a simplified version - in production you'd have a more robust way to find the payment

      // For now, we'll just log what would be done
      console.log(`Processing Xendit callback for invoice ${id} with status ${status}`)

      // Extract reservation ID from external_id if needed
      // Format: invoice-{reservationId}-{timestamp}

      // Note: Payment status handling is now done in the webhook endpoint
      console.log(`Xendit callback processing moved to webhook endpoint for invoice ${id} with status ${status}`)

      // The actual payment processing is handled by /api/webhooks/xendit endpoint

      return { success: true, message: 'Callback berhasil diproses' }
    } catch (error) {
      console.error('Error handling Xendit callback:', error)
      throw new Error('Gagal memproses callback pembayaran')
    }
  }

  /**
   * Get payment status from Xendit
   */
  static async getPaymentStatus(payment: Payment) {
    try {
      if (!payment.external_payment_id) {
        throw new Error('Pembayaran tidak memiliki ID eksternal')
      }

      const xenditInvoice = await invoice.getInvoice({
        invoiceID: payment.external_payment_id,
      })

      return {
        external_status: xenditInvoice.status,
        paid_amount: xenditInvoice.paid_amount,
        expiry_date: xenditInvoice.expiry_date,
      }
    } catch (error) {
      console.error('Error getting Xendit payment status:', error)
      throw new Error('Gagal mendapatkan status pembayaran')
    }
  }
}