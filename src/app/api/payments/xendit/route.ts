import { NextRequest, NextResponse } from 'next/server'
import { getXenditClient } from '@/lib/payments/xendit-client'
import { createPayment } from '@/actions/payments'
import { getReservationByBookingCodeAction } from '@/actions/reservations'
import { prisma } from '@/lib/prisma'
import { calculatePaymentFee } from '@/lib/utils/fee-calculator'
import { CreateInvoiceRequest } from 'xendit-node/invoice/models'



export async function POST(req: NextRequest) {
  try {
    const { reservationId, paymentType, paymentMethodId } = await req.json()

    // Get reservation details
    const reservationResult = await getReservationByBookingCodeAction(reservationId)
    if (!reservationResult.success || !reservationResult.data) {
      return NextResponse.json(
        { success: false, error: 'Reservasi tidak ditemukan' },
        { status: 404 }
      )
    }

    const reservation = reservationResult.data

    // Get payment method details if provided
    let paymentMethodDetails = null
    if (paymentMethodId) {
      paymentMethodDetails = await prisma.paymentMethod.findUnique({
        where: { id: paymentMethodId }
      })
    }


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
        return NextResponse.json(
          { success: false, error: 'Tipe pembayaran tidak valid' },
          { status: 400 }
        )
    }

    // Customer data
    const customerData = {
      name: reservation.customer?.full_name || '',
      email: reservation.customer?.email || '',
      phone: reservation.customer?.phone || '',
    }

    // Determine if this should use Xendit or manual processing
    const isManualPayment = !paymentMethodDetails ||
      paymentMethodDetails.type === 'bank_transfer' ||
      paymentMethodDetails.type === 'cash' ||
      paymentMethodDetails.provider !== 'Xendit'

    const shouldUseXendit = !isManualPayment

    // For non-Xendit payment methods, create a payment record without Xendit invoice
    if (!shouldUseXendit) {
      // Calculate gateway fee based on fee type for manual payments
      let gatewayFee = 0;
      let totalAmount = amount; // Default to original amount
      let netAmount = amount; // Default to original amount

      if (paymentMethodDetails) {
        // Use the new fee calculation utility
        const feeCalculation = calculatePaymentFee(
          amount,
          paymentMethodDetails.fee_type,
          paymentMethodDetails.fee_percentage || 0,
          paymentMethodDetails.fee_amount || 0,
          process.env.NEXT_PUBLIC_CUSTOMER_PAYS_FEES === 'true'
        );

        gatewayFee = feeCalculation.feeAmount;
        totalAmount = feeCalculation.totalAmount;
        netAmount = feeCalculation.netAmount;
      }

      // Create payment record in our database for manual payments
      const paymentData = {
        reservation_id: reservation.id,
        payment_method_id: paymentMethodId || null,
        amount: amount,
        payment_type: paymentType,
        external_payment_id: undefined,
        external_status: 'PENDING',
        payment_url: undefined,
        gateway_fee: gatewayFee,
        net_amount: netAmount, // Store the net amount the studio receives
        expires_at: undefined,
      }

      const payment = await createPayment(paymentData)

      return NextResponse.json({
        success: true,
        data: {
          payment,
          invoice_url: null,
        },
      })
    }

    // Calculate gateway fee based on fee type
    let gatewayFee = 0;
    let totalAmount = amount; // Default to original amount
    let netAmount = amount; // Default to original amount

    if (paymentMethodDetails) {
      // Use the new fee calculation utility
      const feeCalculation = calculatePaymentFee(
        amount,
        paymentMethodDetails.fee_type,
        paymentMethodDetails.fee_percentage || 0,
        paymentMethodDetails.fee_amount || 0,
        process.env.NEXT_PUBLIC_CUSTOMER_PAYS_FEES === 'true'
      );

      gatewayFee = feeCalculation.feeAmount;
      totalAmount = feeCalculation.totalAmount;
      netAmount = feeCalculation.netAmount;

      // Update the amount sent to Xendit based on configuration
      // If customers pay fees, use totalAmount; otherwise use original amount
      if (totalAmount !== amount) {
        amount = totalAmount;
      }
    }

    // For Xendit payment methods, create Xendit invoice
    const xenditClient = getXenditClient()
    const { Invoice } = xenditClient

    // Cek jika xendit_config atau paymentMethod undefined, kirim error agar user ganti metode pembayaran
    if (
      !paymentMethodDetails.xendit_config ||
      !paymentMethodDetails.xendit_config.paymentMethod
    ) {
      return NextResponse.json(
        { success: false, error: 'Metode pembayaran tidak valid atau tidak didukung. Silakan pilih metode pembayaran lain.' },
        { status: 400 }
      )
    }

    const invoiceDuration = paymentMethodDetails.xendit_config.duration || 7200; // 2 jam
    const xenditPaymentMethod = paymentMethodDetails.xendit_config.paymentMethod.toUpperCase();

    // Create Xendit invoice with the correct amount based on fee configuration
    const invoiceParams: CreateInvoiceRequest = {
      externalId: `invoice-${reservation.id}-${Date.now()}`,
      amount: amount,
      description: description,
      invoiceDuration: invoiceDuration,
      customer: {
        givenNames: customerData.name,
        email: customerData.email,
        phoneNumber: customerData.phone,
        mobileNumber: customerData.phone,
      },
      successRedirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/booking/success?payment=completed&booking=${reservation.booking_code}`,
      failureRedirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/booking/payment-failed`,
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
    }
    console.log(invoiceParams)

    const xenditInvoice = await Invoice.createInvoice({
      data: invoiceParams,
    })

    // Create payment record in our database
    const paymentData = {
      reservation_id: reservation.id,
      payment_method_id: paymentMethodId || null,
      amount: amount,
      payment_type: paymentType,
      external_payment_id: xenditInvoice.id,
      external_status: xenditInvoice.status,
      payment_url: xenditInvoice.invoiceUrl,
      gateway_fee: gatewayFee,
      net_amount: netAmount, // Store the net amount the studio receives
      expires_at: xenditInvoice.expiryDate?.toISOString(),
    }

    const payment = await createPayment(paymentData)

    return NextResponse.json({
      success: true,
      data: {
        payment,
        invoice_url: xenditInvoice.invoiceUrl,
      },
    })
  } catch (error) {
    console.error('Error creating Xendit payment:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal membuat pembayaran' },
      { status: 500 }
    )
  }
}