"use server"

import { createClient } from '@/lib/supabase/server'
import { type ReportData, type ReportTemplate, reportTemplates } from '@/types/reports'

export async function generateRevenueReport(studioId: string, dateFrom: string, dateTo: string) {
  const supabase = await createClient()
  
  // Get detailed revenue data with customer and package information
  const { data: reservations, error } = await supabase
    .from('reservations')
    .select(`
      id,
      booking_code,
      total_amount,
      created_at,
      reservation_date,
      start_time,
      end_time,
      status,
      payment_status,
      customer_id,
      guest_email,
      guest_phone,
      is_guest_booking,
      packages(name, price),
      customers(full_name, email, phone),
      payments(amount, payment_method_id, created_at, status, payment_methods(name, type)),
      selected_facilities,
      selected_addons,
      discount_amount
    `)
    .eq('studio_id', studioId)
    .gte('reservation_date', dateFrom)
    .lte('reservation_date', dateTo)
    .in('status', ['confirmed', 'in_progress', 'completed'])
    .order('reservation_date', { ascending: false })

  if (error) throw error

  const totalRevenue = reservations?.reduce((sum, r) => sum + (Number(r.total_amount) || 0), 0) || 0
  const totalBookings = reservations?.length || 0

  // Group by month with detailed breakdown
  const monthlyData = new Map()
  reservations?.forEach(reservation => {
    const month = reservation.reservation_date.substring(0, 7) // YYYY-MM
    const existing = monthlyData.get(month) || { 
      revenue: 0, 
      bookings: 0, 
      avgRevenue: 0,
      packages: new Set()
    }
    existing.revenue += Number(reservation.total_amount) || 0
    existing.bookings += 1
    existing.avgRevenue = existing.revenue / existing.bookings
    const packageData = Array.isArray(reservation.packages) ? reservation.packages[0] : reservation.packages
    if (packageData?.name) {
      existing.packages.add(packageData.name)
    }
    monthlyData.set(month, existing)
  })

  // Payment methods breakdown with more details
  const paymentMethods = new Map()
  const paymentStats = new Map()
  reservations?.forEach(reservation => {
    reservation.payments?.forEach((payment: any) => {
      const methodName = payment.payment_methods?.name || 'Belum Bayar'
      const methodType = payment.payment_methods?.type || 'unknown'
      
      if (!paymentMethods.has(methodName)) {
        paymentMethods.set(methodName, { amount: 0, count: 0, type: methodType })
      }
      const existing = paymentMethods.get(methodName)
      existing.amount += Number(payment.amount) || 0
      existing.count += 1
    })
  })

  // Package performance breakdown
  const packageStats = new Map()
  reservations?.forEach(reservation => {
    const packageData = Array.isArray(reservation.packages) ? reservation.packages[0] : reservation.packages
    if (packageData?.name) {
      const packageName = packageData.name
      if (!packageStats.has(packageName)) {
        packageStats.set(packageName, { 
          bookings: 0, 
          revenue: 0, 
          avgPrice: 0,
          basePrice: packageData.price || 0
        })
      }
      const existing = packageStats.get(packageName)
      existing.bookings += 1
      existing.revenue += Number(reservation.total_amount) || 0
      existing.avgPrice = existing.revenue / existing.bookings
    }
  })

  // Detailed reservations with enhanced information
  const detailedReservations = reservations?.map(reservation => {
    const customerData = Array.isArray(reservation.customers) ? reservation.customers[0] : reservation.customers
    const customerName = reservation.is_guest_booking 
      ? 'Guest Customer'
      : (customerData?.full_name || 'Unknown')
    
    const customerContact = reservation.is_guest_booking
      ? (reservation.guest_email || reservation.guest_phone || 'No contact')
      : (customerData?.email || customerData?.phone || 'No contact')

    const paymentInfo = reservation.payments?.length > 0
      ? reservation.payments.map((p: any) => {
          const paymentMethodData = Array.isArray(p.payment_methods) ? p.payment_methods[0] : p.payment_methods
          return {
            method: paymentMethodData?.name || 'Unknown',
            amount: p.amount,
            status: p.status,
            date: p.created_at
          }
        })
      : [{ method: 'Belum Bayar', amount: 0, status: 'pending', date: null }]

    const packageData = Array.isArray(reservation.packages) ? reservation.packages[0] : reservation.packages

    return {
      ...reservation,
      customerName,
      customerContact,
      packageName: packageData?.name || 'No Package',
      paymentInfo,
      facilitiesCount: reservation.selected_facilities ? 
        (typeof reservation.selected_facilities === 'string' 
          ? JSON.parse(reservation.selected_facilities).length 
          : reservation.selected_facilities.length) : 0,
      addonsCount: reservation.selected_addons ?
        (typeof reservation.selected_addons === 'string'
          ? JSON.parse(reservation.selected_addons).length
          : reservation.selected_addons.length) : 0
    }
  })

  return {
    totalRevenue,
    totalBookings,
    avgRevenuePerBooking: totalBookings > 0 ? totalRevenue / totalBookings : 0,
    monthlyData: Array.from(monthlyData.entries()).map(([month, data]) => ({ 
      month, 
      ...data,
      packages: Array.from(data.packages)
    })),
    paymentMethods: Array.from(paymentMethods.entries()).map(([method, data]) => ({ 
      method, 
      ...data 
    })),
    packageStats: Array.from(packageStats.entries()).map(([name, data]) => ({ 
      name, 
      ...data 
    })),
    detailedReservations,
    reportGenerated: new Date().toISOString(),
    dateRange: { from: dateFrom, to: dateTo }
  }
}

export async function generateBookingReport(studioId: string, dateFrom: string, dateTo: string) {
  const supabase = await createClient()
  
  // Get comprehensive booking data with all related information
  const { data: reservations, error } = await supabase
    .from('reservations')
    .select(`
      id,
      booking_code,
      total_amount,
      created_at,
      reservation_date,
      start_time,
      end_time,
      total_duration,
      status,
      payment_status,
      customer_id,
      guest_email,
      guest_phone,
      is_guest_booking,
      packages(name, price, duration),
      customers(full_name, email, phone, created_at),
      payments(amount, status, created_at, payment_methods(name, type)),
      selected_facilities,
      selected_addons,
      discount_amount,
      notes
    `)
    .eq('studio_id', studioId)
    .gte('reservation_date', dateFrom)
    .lte('reservation_date', dateTo)
    .order('reservation_date', { ascending: false })

  if (error) throw error

  // Get facilities data for better reporting
  const { data: facilities } = await supabase
    .from('facilities')
    .select('id, name, hourly_rate')
    .eq('studio_id', studioId)

  const facilityMap = new Map()
  facilities?.forEach(facility => {
    facilityMap.set(facility.id, facility)
  })

  // Enhanced status breakdown with revenue per status
  const statusBreakdown = new Map()
  reservations?.forEach(reservation => {
    const status = reservation.status
    if (!statusBreakdown.has(status)) {
      statusBreakdown.set(status, { count: 0, revenue: 0, avgRevenue: 0 })
    }
    const existing = statusBreakdown.get(status)
    existing.count += 1
    existing.revenue += Number(reservation.total_amount) || 0
    existing.avgRevenue = existing.revenue / existing.count
  })

  // Enhanced time slot analysis with revenue and day of week
  const timeSlots = new Map()
  const dayOfWeekStats = new Map()
  reservations?.forEach(reservation => {
    const timeSlot = `${reservation.start_time}-${reservation.end_time}`
    const reservationDate = new Date(reservation.reservation_date)
    const dayOfWeek = reservationDate.toLocaleDateString('id-ID', { weekday: 'long' })
    
    // Time slot analysis
    if (!timeSlots.has(timeSlot)) {
      timeSlots.set(timeSlot, { count: 0, revenue: 0, avgRevenue: 0 })
    }
    const timeSlotData = timeSlots.get(timeSlot)
    timeSlotData.count += 1
    timeSlotData.revenue += Number(reservation.total_amount) || 0
    timeSlotData.avgRevenue = timeSlotData.revenue / timeSlotData.count

    // Day of week analysis
    if (!dayOfWeekStats.has(dayOfWeek)) {
      dayOfWeekStats.set(dayOfWeek, { count: 0, revenue: 0, avgRevenue: 0 })
    }
    const dayData = dayOfWeekStats.get(dayOfWeek)
    dayData.count += 1
    dayData.revenue += Number(reservation.total_amount) || 0
    dayData.avgRevenue = dayData.revenue / dayData.count
  })

  // Enhanced facility usage analysis
  const facilityUsage = new Map()
  reservations?.forEach(reservation => {
    if (reservation.selected_facilities) {
      try {
        const facilities = typeof reservation.selected_facilities === 'string' 
          ? JSON.parse(reservation.selected_facilities) 
          : reservation.selected_facilities
        
        if (Array.isArray(facilities)) {
          facilities.forEach((facilityId: string) => {
            const facilityInfo = facilityMap.get(facilityId)
            const facilityName = facilityInfo?.name || `Facility ${facilityId}`
            
            if (!facilityUsage.has(facilityName)) {
              facilityUsage.set(facilityName, { 
                count: 0, 
                revenue: 0, 
                avgRevenue: 0,
                facilityId,
                hourlyRate: facilityInfo?.hourly_rate || 0
              })
            }
            const existing = facilityUsage.get(facilityName)
            existing.count += 1
            existing.revenue += Number(reservation.total_amount) || 0
            existing.avgRevenue = existing.revenue / existing.count
          })
        }
      } catch (e) {
        console.error('Error parsing facilities:', e)
      }
    }
  })

  // Customer type analysis
  const customerTypes = new Map()
  reservations?.forEach(reservation => {
    const type = reservation.is_guest_booking ? 'Guest' : 'Registered'
    if (!customerTypes.has(type)) {
      customerTypes.set(type, { count: 0, revenue: 0, avgRevenue: 0 })
    }
    const existing = customerTypes.get(type)
    existing.count += 1
    existing.revenue += Number(reservation.total_amount) || 0
    existing.avgRevenue = existing.revenue / existing.count
  })

  // Payment status analysis
  const paymentStatusStats = new Map()
  reservations?.forEach(reservation => {
    const paymentStatus = reservation.payment_status
    if (!paymentStatusStats.has(paymentStatus)) {
      paymentStatusStats.set(paymentStatus, { count: 0, revenue: 0, avgRevenue: 0 })
    }
    const existing = paymentStatusStats.get(paymentStatus)
    existing.count += 1
    existing.revenue += Number(reservation.total_amount) || 0
    existing.avgRevenue = existing.revenue / existing.count
  })

  // Detailed booking information
  const detailedBookings = reservations?.map(reservation => {
    const customerData = Array.isArray(reservation.customers) ? reservation.customers[0] : reservation.customers
    const customerName = reservation.is_guest_booking 
      ? 'Guest Customer'
      : (customerData?.full_name || 'Unknown Customer')
    
    const customerContact = reservation.is_guest_booking
      ? (reservation.guest_email || reservation.guest_phone || 'No contact')
      : (customerData?.email || customerData?.phone || 'No contact')

    const customerType = reservation.is_guest_booking ? 'Guest' : 'Registered'
    
    const selectedFacilities = reservation.selected_facilities ? 
      (typeof reservation.selected_facilities === 'string' 
        ? JSON.parse(reservation.selected_facilities)
        : reservation.selected_facilities) : []

    const facilityNames = selectedFacilities.map((facilityId: string) => 
      facilityMap.get(facilityId)?.name || `Facility ${facilityId}`
    ).join(', ') || 'No facilities'

    const paymentInfo = reservation.payments?.length > 0
      ? reservation.payments.map((p: any) => {
          const paymentMethodData = Array.isArray(p.payment_methods) ? p.payment_methods[0] : p.payment_methods
          return {
            method: paymentMethodData?.name || 'Unknown',
            amount: p.amount,
            status: p.status,
            date: p.created_at
          }
        })
      : [{ method: 'Belum Bayar', amount: 0, status: 'pending', date: null }]

    const totalPaid = reservation.payments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0
    const remainingAmount = Number(reservation.total_amount) - totalPaid

    const packageData = Array.isArray(reservation.packages) ? reservation.packages[0] : reservation.packages

    return {
      ...reservation,
      customerName,
      customerContact,
      customerType,
      packageName: packageData?.name || 'No Package',
      facilityNames,
      facilitiesCount: selectedFacilities.length,
      addonsCount: reservation.selected_addons ?
        (typeof reservation.selected_addons === 'string'
          ? JSON.parse(reservation.selected_addons).length
          : reservation.selected_addons.length) : 0,
      paymentInfo,
      totalPaid,
      remainingAmount,
      isFullyPaid: remainingAmount <= 0,
      dayOfWeek: new Date(reservation.reservation_date).toLocaleDateString('id-ID', { weekday: 'long' }),
      timeSlot: `${reservation.start_time}-${reservation.end_time}`
    }
  })

  return {
    totalBookings: reservations?.length || 0,
    statusBreakdown: Array.from(statusBreakdown.entries()).map(([status, data]) => ({ 
      status, 
      ...data 
    })),
    timeSlotAnalysis: Array.from(timeSlots.entries()).map(([timeSlot, data]) => ({ 
      timeSlot, 
      ...data 
    })),
    dayOfWeekStats: Array.from(dayOfWeekStats.entries()).map(([day, data]) => ({ 
      day, 
      ...data 
    })),
    facilityUsage: Array.from(facilityUsage.entries()).map(([facilityName, data]) => ({ 
      facilityName, 
      ...data 
    })),
    customerTypes: Array.from(customerTypes.entries()).map(([type, data]) => ({ 
      type, 
      ...data 
    })),
    paymentStatusStats: Array.from(paymentStatusStats.entries()).map(([status, data]) => ({ 
      status, 
      ...data 
    })),
    detailedBookings,
    reportGenerated: new Date().toISOString(),
    dateRange: { from: dateFrom, to: dateTo }
  }
}


export async function generateReport(
  templateId: string, 
  studioId: string, 
  dateFrom: string, 
  dateTo: string,
  reportName: string
): Promise<ReportData> {
  let data: any = {}

  switch (templateId) {
    case 'revenue-report':
      data = await generateRevenueReport(studioId, dateFrom, dateTo)
      break
    case 'booking-report':
      data = await generateBookingReport(studioId, dateFrom, dateTo)
      break
    default:
      throw new Error('Report template tidak tersedia. Hanya laporan booking dan pendapatan yang didukung.')
  }

  const template = reportTemplates.find(t => t.id === templateId)
  if (!template) throw new Error('Template tidak ditemukan')

  return {
    id: `report_${Date.now()}`,
    name: reportName,
    description: template.description,
    type: template.type,
    studioId,
    dateFrom,
    dateTo,
    generatedAt: new Date().toISOString(),
    data
  }
}