"use client"

import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { generateReport } from "@/actions/reports"
import { type ReportData } from "@/types/reports"

export function useGenerateReport() {
  const [generatedReports, setGeneratedReports] = useState<ReportData[]>([])

  const generateReportMutation = useMutation({
    mutationFn: async ({
      templateId,
      studioId,
      dateFrom,
      dateTo,
      reportName
    }: {
      templateId: string
      studioId: string
      dateFrom: string
      dateTo: string
      reportName: string
    }) => {
      return await generateReport(templateId, studioId, dateFrom, dateTo, reportName)
    },
    onSuccess: (data) => {
      setGeneratedReports(prev => [data, ...prev])
    },
  })

  const exportToCSV = (reportData: ReportData) => {
    let csvContent = ""
    
    switch (reportData.type) {
      case "financial":
        csvContent = generateDetailedRevenueCSV(reportData)
        break
      case "operational":
        csvContent = generateDetailedBookingCSV(reportData)
        break
      default:
        throw new Error('Tipe laporan tidak didukung')
    }

    // Download CSV with BOM for proper Excel encoding
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `${reportData.name}_${timestamp}.csv`
    link.setAttribute("download", filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }


  return {
    generateReport: generateReportMutation.mutate,
    isGenerating: generateReportMutation.isPending,
    generatedReports,
    exportToCSV,
    error: generateReportMutation.error
  }
}

function generateDetailedRevenueCSV(reportData: ReportData): string {
  const { data } = reportData
  let csv = ""
  
  // Header with report information
  csv += "=== LAPORAN PENDAPATAN DETAIL ===\n"
  csv += `Nama Laporan:,${reportData.name}\n`
  csv += `Periode:,${formatDate(reportData.dateFrom)} - ${formatDate(reportData.dateTo)}\n`
  csv += `Dibuat:,${formatDateTime(reportData.generatedAt)}\n`
  csv += `Studio ID:,${reportData.studioId}\n\n`
  
  // Executive Summary
  csv += "=== RINGKASAN EKSEKUTIF ===\n"
  csv += `Total Pendapatan:,${formatCurrency(data.totalRevenue)}\n`
  csv += `Total Booking:,${data.totalBookings}\n`
  csv += `Rata-rata Pendapatan per Booking:,${formatCurrency(data.avgRevenuePerBooking)}\n\n`
  
  // Monthly Breakdown
  if (data.monthlyData && data.monthlyData.length > 0) {
    csv += "=== BREAKDOWN BULANAN ===\n"
    csv += "Bulan,Total Pendapatan,Jumlah Booking,Rata-rata per Booking,Paket Unik\n"
    data.monthlyData.forEach((item: any) => {
      csv += `${formatMonth(item.month)},${formatCurrency(item.revenue)},${item.bookings},${formatCurrency(item.avgRevenue)},${item.packages.join('; ')}\n`
    })
    csv += "\n"
  }
  
  // Payment Methods Analysis
  if (data.paymentMethods && data.paymentMethods.length > 0) {
    csv += "=== ANALISIS METODE PEMBAYARAN ===\n"
    csv += "Metode Pembayaran,Tipe,Total Amount,Jumlah Transaksi,Rata-rata per Transaksi\n"
    data.paymentMethods.forEach((item: any) => {
      const avgPerTransaction = item.count > 0 ? item.amount / item.count : 0
      csv += `${item.method},${item.type},${formatCurrency(item.amount)},${item.count},${formatCurrency(avgPerTransaction)}\n`
    })
    csv += "\n"
  }
  
  // Package Performance
  if (data.packageStats && data.packageStats.length > 0) {
    csv += "=== PERFORMA PAKET ===\n"
    csv += "Nama Paket,Jumlah Booking,Total Pendapatan,Rata-rata Harga,Harga Base,Markup (%)\n"
    data.packageStats.forEach((item: any) => {
      const markup = item.basePrice > 0 ? ((item.avgPrice - item.basePrice) / item.basePrice * 100) : 0
      csv += `${item.name},${item.bookings},${formatCurrency(item.revenue)},${formatCurrency(item.avgPrice)},${formatCurrency(item.basePrice)},${markup.toFixed(1)}%\n`
    })
    csv += "\n"
  }
  
  // Detailed Transaction Records
  if (data.detailedReservations && data.detailedReservations.length > 0) {
    csv += "=== DETAIL TRANSAKSI ===\n"
    csv += "Kode Booking,Tanggal Reservasi,Waktu,Durasi,Nama Customer,Kontak,Paket,Total Amount,Status Reservasi,Status Pembayaran,Jumlah Fasilitas,Jumlah Addon,Diskon,Metode Pembayaran,Notes\n"
    
    data.detailedReservations.forEach((reservation: any) => {
      const timeSlot = `${reservation.start_time}-${reservation.end_time}`
      const paymentMethods = reservation.paymentInfo.map((p: any) => p.method).join('; ')
      const notes = (reservation.notes || '').replace(/,/g, ';').replace(/\n/g, ' ')
      
      csv += `${reservation.booking_code},${formatDate(reservation.reservation_date)},${timeSlot},${reservation.total_duration} menit,${reservation.customerName},${reservation.customerContact},${reservation.packageName},${formatCurrency(reservation.total_amount)},${reservation.status},${reservation.payment_status},${reservation.facilitiesCount},${reservation.addonsCount},${formatCurrency(reservation.discount_amount || 0)},${paymentMethods},"${notes}"\n`
    })
  }
  
  return csv
}

function generateDetailedBookingCSV(reportData: ReportData): string {
  const { data } = reportData
  let csv = ""
  
  // Header with report information
  csv += "=== LAPORAN BOOKING DETAIL ===\n"
  csv += `Nama Laporan:,${reportData.name}\n`
  csv += `Periode:,${formatDate(reportData.dateFrom)} - ${formatDate(reportData.dateTo)}\n`
  csv += `Dibuat:,${formatDateTime(reportData.generatedAt)}\n`
  csv += `Studio ID:,${reportData.studioId}\n\n`
  
  // Executive Summary
  csv += "=== RINGKASAN EKSEKUTIF ===\n"
  csv += `Total Booking:,${data.totalBookings}\n\n`
  
  // Status Breakdown
  if (data.statusBreakdown && data.statusBreakdown.length > 0) {
    csv += "=== BREAKDOWN STATUS BOOKING ===\n"
    csv += "Status,Jumlah Booking,Total Pendapatan,Rata-rata Pendapatan\n"
    data.statusBreakdown.forEach((item: any) => {
      csv += `${item.status},${item.count},${formatCurrency(item.revenue)},${formatCurrency(item.avgRevenue)}\n`
    })
    csv += "\n"
  }
  
  // Time Slot Analysis
  if (data.timeSlotAnalysis && data.timeSlotAnalysis.length > 0) {
    csv += "=== ANALISIS SLOT WAKTU ===\n"
    csv += "Slot Waktu,Jumlah Booking,Total Pendapatan,Rata-rata Pendapatan\n"
    data.timeSlotAnalysis.forEach((item: any) => {
      csv += `${item.timeSlot},${item.count},${formatCurrency(item.revenue)},${formatCurrency(item.avgRevenue)}\n`
    })
    csv += "\n"
  }
  
  // Day of Week Analysis
  if (data.dayOfWeekStats && data.dayOfWeekStats.length > 0) {
    csv += "=== ANALISIS HARI DALAM MINGGU ===\n"
    csv += "Hari,Jumlah Booking,Total Pendapatan,Rata-rata Pendapatan\n"
    data.dayOfWeekStats.forEach((item: any) => {
      csv += `${item.day},${item.count},${formatCurrency(item.revenue)},${formatCurrency(item.avgRevenue)}\n`
    })
    csv += "\n"
  }
  
  // Facility Usage
  if (data.facilityUsage && data.facilityUsage.length > 0) {
    csv += "=== PENGGUNAAN FASILITAS ===\n"
    csv += "Nama Fasilitas,Jumlah Booking,Total Pendapatan,Rata-rata Pendapatan,Tarif per Jam\n"
    data.facilityUsage.forEach((item: any) => {
      csv += `${item.facilityName},${item.count},${formatCurrency(item.revenue)},${formatCurrency(item.avgRevenue)},${formatCurrency(item.hourlyRate)}\n`
    })
    csv += "\n"
  }
  
  // Customer Type Analysis
  if (data.customerTypes && data.customerTypes.length > 0) {
    csv += "=== ANALISIS TIPE CUSTOMER ===\n"
    csv += "Tipe Customer,Jumlah Booking,Total Pendapatan,Rata-rata Pendapatan\n"
    data.customerTypes.forEach((item: any) => {
      csv += `${item.type},${item.count},${formatCurrency(item.revenue)},${formatCurrency(item.avgRevenue)}\n`
    })
    csv += "\n"
  }
  
  // Payment Status Analysis
  if (data.paymentStatusStats && data.paymentStatusStats.length > 0) {
    csv += "=== ANALISIS STATUS PEMBAYARAN ===\n"
    csv += "Status Pembayaran,Jumlah Booking,Total Pendapatan,Rata-rata Pendapatan\n"
    data.paymentStatusStats.forEach((item: any) => {
      csv += `${item.status},${item.count},${formatCurrency(item.revenue)},${formatCurrency(item.avgRevenue)}\n`
    })
    csv += "\n"
  }
  
  // Detailed Booking Records
  if (data.detailedBookings && data.detailedBookings.length > 0) {
    csv += "=== DETAIL BOOKING ===\n"
    csv += "Kode Booking,Tanggal Reservasi,Hari,Slot Waktu,Durasi,Nama Customer,Tipe Customer,Kontak,Paket,Fasilitas,Jumlah Fasilitas,Jumlah Addon,Total Amount,Dibayar,Sisa,Status Lunas,Status Reservasi,Status Pembayaran,Metode Pembayaran,Notes\n"
    
    data.detailedBookings.forEach((booking: any) => {
      const paymentMethods = booking.paymentInfo.map((p: any) => `${p.method} (${formatCurrency(p.amount)})`).join('; ')
      const notes = (booking.notes || '').replace(/,/g, ';').replace(/\n/g, ' ')
      
      csv += `${booking.booking_code},${formatDate(booking.reservation_date)},${booking.dayOfWeek},${booking.timeSlot},${booking.total_duration} menit,${booking.customerName},${booking.customerType},${booking.customerContact},${booking.packageName},"${booking.facilityNames}",${booking.facilitiesCount},${booking.addonsCount},${formatCurrency(booking.total_amount)},${formatCurrency(booking.totalPaid)},${formatCurrency(booking.remainingAmount)},${booking.isFullyPaid ? 'Ya' : 'Tidak'},${booking.status},${booking.payment_status},"${paymentMethods}","${notes}"\n`
    })
  }
  
  return csv
}

// Helper formatting functions
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric'
  })
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('id-ID', {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatMonth(monthString: string): string {
  const [year, month] = monthString.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1)
  return date.toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric'
  })
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value)
}