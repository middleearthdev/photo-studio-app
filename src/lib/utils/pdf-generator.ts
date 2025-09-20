import jsPDF from 'jspdf'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

interface InvoiceData {
  reservation: {
    booking_code: string
    reservation_date: string
    start_time: string
    total_amount: number
    dp_amount: number
    remaining_amount: number
    package_price: number
    special_requests?: string | null
    customer?: {
      full_name: string
      email: string
      phone: string
    }
    package?: {
      name: string
      duration_minutes: number
    }
    studio?: {
      name: string
    }
    reservation_addons?: Array<{
      addon?: {
        name: string
      }
      quantity: number
      unit_price: number
    }>
  }
  payment: {
    status: string
    paid_at?: string | null
  }
  paymentMethodDetails?: {
    name: string
  }
  feeBreakdown: {
    subtotal: number
    fee: number
    total: number
    paymentMethodName?: string
    feeDisplay?: string
  }
}

export const generateInvoicePDF = async (data: InvoiceData): Promise<Blob> => {
  const { reservation, payment, paymentMethodDetails, feeBreakdown } = data

  // Create new PDF document
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  // Helper function to format currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price)
  }

  // Helper function to format date
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'EEEE, dd MMMM yyyy', { locale: idLocale })
  }

  // Set font
  pdf.setFont('helvetica')

  // Header
  pdf.setFontSize(20)
  pdf.setTextColor(0, 5, 46) // #00052e
  pdf.text('INVOICE BOOKING', 20, 25)

  pdf.setFontSize(12)
  pdf.setTextColor(100, 100, 100)
  pdf.text('Studio Foto Profesional', 20, 32)

  // Booking Code (top right)
  pdf.setFontSize(14)
  pdf.setTextColor(0, 0, 0)
  pdf.text(`Booking ID: ${reservation.booking_code}`, 120, 25)

  pdf.setFontSize(10)
  pdf.setTextColor(100, 100, 100)
  pdf.text(`Generated: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 120, 32)

  // Line separator
  pdf.setDrawColor(200, 200, 200)
  pdf.line(20, 40, 190, 40)

  let yPos = 50

  // Customer Information
  pdf.setFontSize(14)
  pdf.setTextColor(0, 5, 46)
  pdf.text('INFORMASI PELANGGAN', 20, yPos)
  yPos += 10

  pdf.setFontSize(10)
  pdf.setTextColor(0, 0, 0)
  pdf.text(`Nama: ${reservation.customer?.full_name || 'N/A'}`, 20, yPos)
  yPos += 6
  pdf.text(`Email: ${reservation.customer?.email || 'N/A'}`, 20, yPos)
  yPos += 6
  pdf.text(`WhatsApp: ${reservation.customer?.phone || 'N/A'}`, 20, yPos)
  yPos += 15

  // Booking Details
  pdf.setFontSize(14)
  pdf.setTextColor(0, 5, 46)
  pdf.text('DETAIL BOOKING', 20, yPos)
  yPos += 10

  pdf.setFontSize(10)
  pdf.setTextColor(0, 0, 0)
  pdf.text(`Paket: ${reservation.package?.name || 'N/A'}`, 20, yPos)
  yPos += 6
  pdf.text(`Studio: ${reservation.studio?.name || 'N/A'}`, 20, yPos)
  yPos += 6
  pdf.text(`Tanggal: ${formatDate(reservation.reservation_date)}`, 20, yPos)
  yPos += 6
  pdf.text(`Waktu: ${reservation.start_time}`, 20, yPos)
  yPos += 6
  
  if (reservation.package?.duration_minutes) {
    const hours = Math.floor(reservation.package.duration_minutes / 60)
    const mins = reservation.package.duration_minutes % 60
    let duration = ''
    if (hours === 0) duration = `${mins} menit`
    else if (mins === 0) duration = `${hours} jam`
    else duration = `${hours}j ${mins}m`
    
    pdf.text(`Durasi: ${duration}`, 20, yPos)
    yPos += 6
  }

  // Add-ons (if any)
  if (reservation.reservation_addons && reservation.reservation_addons.length > 0) {
    yPos += 5
    pdf.text('Add-ons:', 20, yPos)
    yPos += 6
    
    reservation.reservation_addons.forEach((addon) => {
      const addonText = `• ${addon.addon?.name} (${addon.quantity}x) - ${formatPrice(addon.unit_price * addon.quantity)}`
      pdf.text(addonText, 25, yPos)
      yPos += 6
    })
  }

  yPos += 10

  // Payment Summary
  pdf.setFontSize(14)
  pdf.setTextColor(0, 5, 46)
  pdf.text('RINGKASAN PEMBAYARAN', 20, yPos)
  yPos += 10

  // Payment method
  if (feeBreakdown.paymentMethodName) {
    pdf.setFontSize(10)
    pdf.setTextColor(0, 0, 0)
    pdf.text(`Metode Pembayaran: ${feeBreakdown.paymentMethodName}`, 20, yPos)
    yPos += 8
  }

  // Payment breakdown table
  const tableStartY = yPos
  const leftCol = 20
  const rightCol = 150

  pdf.setFontSize(10)
  
  // Package Price
  pdf.text(`Harga Paket (${reservation.package?.name || 'Paket Foto'}):`, leftCol, yPos)
  pdf.text(formatPrice(reservation.package_price), rightCol, yPos)
  yPos += 6

  // Add-ons (if any)
  if (reservation.reservation_addons && reservation.reservation_addons.length > 0) {
    reservation.reservation_addons.forEach((addon) => {
      const addonText = `${addon.addon?.name} ${addon.quantity > 1 ? `(${addon.quantity}x)` : ''}:`
      pdf.text(addonText, leftCol, yPos)
      pdf.text(formatPrice(addon.unit_price * addon.quantity), rightCol, yPos)
      yPos += 6
    })
  }

  // Subtotal
  pdf.setDrawColor(230, 230, 230)
  pdf.line(leftCol, yPos, rightCol + 30, yPos)
  yPos += 4
  
  pdf.setFont('helvetica', 'bold')
  pdf.text('Subtotal:', leftCol, yPos)
  pdf.text(formatPrice(reservation.total_amount), rightCol, yPos)
  yPos += 8

  // DP Calculation
  pdf.setFont('helvetica', 'normal')
  const dpPercentage = Math.round((reservation.dp_amount / reservation.total_amount) * 100)
  pdf.text(`DP (${dpPercentage}%):`, leftCol, yPos)
  pdf.text(formatPrice(feeBreakdown.subtotal), rightCol, yPos)
  yPos += 6

  // Fee (if applicable)
  if (feeBreakdown.fee > 0) {
    pdf.text(`Biaya Transfer (${feeBreakdown.feeDisplay}):`, leftCol, yPos)
    pdf.text(`+${formatPrice(feeBreakdown.fee)}`, rightCol, yPos)
    yPos += 6
  }

  // Total DP paid
  pdf.setDrawColor(200, 200, 200)
  pdf.line(leftCol, yPos, rightCol + 30, yPos)
  yPos += 4

  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(0, 150, 0)
  pdf.text('DP Dibayar:', leftCol, yPos)
  pdf.text(formatPrice(feeBreakdown.total), rightCol, yPos)
  yPos += 8

  // Remaining payment
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(200, 130, 0)
  pdf.text('Sisa Pembayaran:', leftCol, yPos)
  pdf.text(formatPrice(reservation.remaining_amount), rightCol, yPos)
  yPos += 6

  // Grand total
  pdf.line(leftCol, yPos, rightCol + 30, yPos)
  yPos += 4

  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(176, 131, 77) // #b0834d
  pdf.text('Total Keseluruhan:', leftCol, yPos)
  pdf.text(formatPrice(reservation.total_amount), rightCol, yPos)
  yPos += 15

  // Payment Status
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(0, 150, 0)
  pdf.text(`Status Pembayaran: ${payment.status.toUpperCase()}`, 20, yPos)
  yPos += 6

  if (payment.paid_at) {
    pdf.setTextColor(100, 100, 100)
    pdf.text(`Dibayar pada: ${format(new Date(payment.paid_at), 'dd/MM/yyyy HH:mm')}`, 20, yPos)
    yPos += 15
  }

  // Notes
  if (reservation.special_requests) {
    pdf.setFontSize(12)
    pdf.setTextColor(0, 5, 46)
    pdf.text('CATATAN:', 20, yPos)
    yPos += 8

    pdf.setFontSize(10)
    pdf.setTextColor(0, 0, 0)
    const notes = pdf.splitTextToSize(reservation.special_requests, 170)
    pdf.text(notes, 20, yPos)
    yPos += notes.length * 6 + 10
  }

  // Footer
  const footerY = 270
  pdf.setDrawColor(200, 200, 200)
  pdf.line(20, footerY - 10, 190, footerY - 10)

  pdf.setFontSize(8)
  pdf.setTextColor(100, 100, 100)
  pdf.text('Terima kasih atas kepercayaan Anda.', 20, footerY)
  pdf.text('Silakan datang 15 menit sebelum jadwal dengan membawa invoice ini.', 20, footerY + 4)
  pdf.text('Sisa pembayaran akan diselesaikan pada hari sesi foto.', 20, footerY + 8)

  // Return as blob
  const pdfBlob = pdf.output('blob')
  return pdfBlob
}