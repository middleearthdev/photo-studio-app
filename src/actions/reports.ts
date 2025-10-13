"use server"

import { prisma } from '@/lib/prisma'
import { type ReportData, reportTemplates } from '@/types/reports'

export async function generateRevenueReport(studioId: string, dateFrom: string, dateTo: string) {
  try {
    // Get detailed revenue data with customer and package information
    const reservations = await prisma.reservation.findMany({
      where: {
        studio_id: studioId,
        reservation_date: {
          gte: new Date(dateFrom),
          lte: new Date(dateTo)
        },
        status: {
          in: ['confirmed', 'in_progress', 'completed']
        }
      },
      include: {
        package: {
          select: {
            name: true,
            price: true
          }
        },
        customer: {
          select: {
            full_name: true,
            email: true,
            phone: true
          }
        },
        payments: {
          include: {
            payment_method: {
              select: {
                name: true,
                type: true
              }
            }
          }
        },
        reservation_addons: {
          include: {
            addon: {
              select: {
                name: true,
                price: true
              }
            }
          }
        }
      },
      orderBy: {
        reservation_date: 'desc'
      }
    })

    const totalRevenue = reservations.reduce((sum, r) => sum + Number(r.total_amount), 0)
    const totalBookings = reservations.length

    // Group by month with detailed breakdown
    const monthlyData = new Map()
    reservations.forEach(reservation => {
      const month = reservation.reservation_date.toISOString().substring(0, 7) // YYYY-MM
      const existing = monthlyData.get(month) || { 
        revenue: 0, 
        bookings: 0, 
        avgRevenue: 0,
        packages: new Set()
      }
      existing.revenue += Number(reservation.total_amount)
      existing.bookings += 1
      existing.avgRevenue = existing.revenue / existing.bookings
      if (reservation.package?.name) {
        existing.packages.add(reservation.package.name)
      }
      monthlyData.set(month, existing)
    })

    // Payment methods breakdown with more details
    const paymentMethods = new Map()
    reservations.forEach(reservation => {
      reservation.payments?.forEach((payment) => {
        const methodName = payment.payment_method?.name || 'Belum Bayar'
        const methodType = payment.payment_method?.type || 'unknown'
        
        if (!paymentMethods.has(methodName)) {
          paymentMethods.set(methodName, { amount: 0, count: 0, type: methodType })
        }
        const existing = paymentMethods.get(methodName)
        existing.amount += Number(payment.amount)
        existing.count += 1
      })
    })

    // Package performance breakdown
    const packageStats = new Map()
    reservations.forEach(reservation => {
      if (reservation.package?.name) {
        const packageName = reservation.package.name
        if (!packageStats.has(packageName)) {
          packageStats.set(packageName, { 
            bookings: 0, 
            revenue: 0, 
            avgPrice: 0,
            basePrice: Number(reservation.package.price) || 0
          })
        }
        const existing = packageStats.get(packageName)
        existing.bookings += 1
        existing.revenue += Number(reservation.total_amount)
        existing.avgPrice = existing.revenue / existing.bookings
      }
    })

    // Detailed reservations with enhanced information
    const detailedReservations = reservations.map(reservation => {
      const customerName = reservation.is_guest_booking 
        ? 'Guest Customer'
        : (reservation.customer?.full_name || 'Unknown')
      
      const customerContact = reservation.is_guest_booking
        ? (reservation.guest_email || reservation.guest_phone || 'No contact')
        : (reservation.customer?.email || reservation.customer?.phone || 'No contact')

      const paymentInfo = reservation.payments?.length > 0
        ? reservation.payments.map((p) => ({
            method: p.payment_method?.name || 'Unknown',
            amount: Number(p.amount),
            status: p.status,
            date: p.created_at?.toISOString() || null
          }))
        : [{ method: 'Belum Bayar', amount: 0, status: 'pending', date: null }]

      // Parse selected facilities and addons from JSON
      let facilitiesCount = 0
      let addonsCount = 0
      
      try {
        if (reservation.selected_facilities) {
          const facilities = typeof reservation.selected_facilities === 'string' 
            ? JSON.parse(reservation.selected_facilities as string) 
            : reservation.selected_facilities
          facilitiesCount = Array.isArray(facilities) ? facilities.length : 0
        }
      } catch (e) {
        console.error('Error parsing facilities:', e)
      }

      addonsCount = reservation.reservation_addons?.length || 0

      return {
        ...reservation,
        reservation_date: reservation.reservation_date.toISOString(),
        start_time: reservation.start_time.toISOString(),
        end_time: reservation.end_time.toISOString(),
        created_at: reservation.created_at?.toISOString() || '',
        total_amount: Number(reservation.total_amount),
        discount_amount: Number(reservation.discount_amount),
        customerName,
        customerContact,
        packageName: reservation.package?.name || 'No Package',
        paymentInfo,
        facilitiesCount,
        addonsCount
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
  } catch (error) {
    console.error('Error generating revenue report:', error)
    throw error
  }
}

export async function generateBookingReport(studioId: string, dateFrom: string, dateTo: string) {
  try {
    // Get comprehensive booking data with all related information
    const reservations = await prisma.reservation.findMany({
      where: {
        studio_id: studioId,
        reservation_date: {
          gte: new Date(dateFrom),
          lte: new Date(dateTo)
        }
      },
      include: {
        package: {
          select: {
            name: true,
            price: true,
            duration_minutes: true
          }
        },
        customer: {
          select: {
            full_name: true,
            email: true,
            phone: true,
            created_at: true
          }
        },
        payments: {
          include: {
            payment_method: {
              select: {
                name: true,
                type: true
              }
            }
          }
        },
        reservation_addons: {
          include: {
            addon: {
              select: {
                name: true,
                price: true
              }
            }
          }
        }
      },
      orderBy: {
        reservation_date: 'desc'
      }
    })

    // Get facilities data for better reporting
    const facilities = await prisma.facility.findMany({
      where: { studio_id: studioId },
      select: {
        id: true,
        name: true,
        hourly_rate: true
      }
    })

    const facilityMap = new Map()
    facilities.forEach(facility => {
      facilityMap.set(facility.id, facility)
    })

    // Enhanced status breakdown with revenue per status
    const statusBreakdown = new Map()
    reservations.forEach(reservation => {
      const status = reservation.status
      if (!statusBreakdown.has(status)) {
        statusBreakdown.set(status, { count: 0, revenue: 0, avgRevenue: 0 })
      }
      const existing = statusBreakdown.get(status)
      existing.count += 1
      existing.revenue += Number(reservation.total_amount)
      existing.avgRevenue = existing.revenue / existing.count
    })

    // Enhanced time slot analysis with revenue and day of week
    const timeSlots = new Map()
    const dayOfWeekStats = new Map()
    reservations.forEach(reservation => {
      const timeSlot = `${reservation.start_time.toISOString().split('T')[1].substring(0, 5)}-${reservation.end_time.toISOString().split('T')[1].substring(0, 5)}`
      const reservationDate = new Date(reservation.reservation_date)
      const dayOfWeek = reservationDate.toLocaleDateString('id-ID', { weekday: 'long' })
      
      // Time slot analysis
      if (!timeSlots.has(timeSlot)) {
        timeSlots.set(timeSlot, { count: 0, revenue: 0, avgRevenue: 0 })
      }
      const timeSlotData = timeSlots.get(timeSlot)
      timeSlotData.count += 1
      timeSlotData.revenue += Number(reservation.total_amount)
      timeSlotData.avgRevenue = timeSlotData.revenue / timeSlotData.count

      // Day of week analysis
      if (!dayOfWeekStats.has(dayOfWeek)) {
        dayOfWeekStats.set(dayOfWeek, { count: 0, revenue: 0, avgRevenue: 0 })
      }
      const dayData = dayOfWeekStats.get(dayOfWeek)
      dayData.count += 1
      dayData.revenue += Number(reservation.total_amount)
      dayData.avgRevenue = dayData.revenue / dayData.count
    })

    // Enhanced facility usage analysis
    const facilityUsage = new Map()
    reservations.forEach(reservation => {
      if (reservation.selected_facilities) {
        try {
          const facilitiesData = typeof reservation.selected_facilities === 'string' 
            ? JSON.parse(reservation.selected_facilities as string) 
            : reservation.selected_facilities
          
          if (Array.isArray(facilitiesData)) {
            facilitiesData.forEach((facilityId: string) => {
              const facilityInfo = facilityMap.get(facilityId)
              const facilityName = facilityInfo?.name || `Facility ${facilityId}`
              
              if (!facilityUsage.has(facilityName)) {
                facilityUsage.set(facilityName, { 
                  count: 0, 
                  revenue: 0, 
                  avgRevenue: 0,
                  facilityId,
                  hourlyRate: Number(facilityInfo?.hourly_rate) || 0
                })
              }
              const existing = facilityUsage.get(facilityName)
              existing.count += 1
              existing.revenue += Number(reservation.total_amount)
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
    reservations.forEach(reservation => {
      const type = reservation.is_guest_booking ? 'Guest' : 'Registered'
      if (!customerTypes.has(type)) {
        customerTypes.set(type, { count: 0, revenue: 0, avgRevenue: 0 })
      }
      const existing = customerTypes.get(type)
      existing.count += 1
      existing.revenue += Number(reservation.total_amount)
      existing.avgRevenue = existing.revenue / existing.count
    })

    // Payment status analysis
    const paymentStatusStats = new Map()
    reservations.forEach(reservation => {
      const paymentStatus = reservation.payment_status
      if (!paymentStatusStats.has(paymentStatus)) {
        paymentStatusStats.set(paymentStatus, { count: 0, revenue: 0, avgRevenue: 0 })
      }
      const existing = paymentStatusStats.get(paymentStatus)
      existing.count += 1
      existing.revenue += Number(reservation.total_amount)
      existing.avgRevenue = existing.revenue / existing.count
    })

    // Detailed booking information
    const detailedBookings = reservations.map(reservation => {
      const customerName = reservation.is_guest_booking 
        ? 'Guest Customer'
        : (reservation.customer?.full_name || 'Unknown Customer')
      
      const customerContact = reservation.is_guest_booking
        ? (reservation.guest_email || reservation.guest_phone || 'No contact')
        : (reservation.customer?.email || reservation.customer?.phone || 'No contact')

      const customerType = reservation.is_guest_booking ? 'Guest' : 'Registered'
      
      let selectedFacilities: string[] = []
      try {
        if (reservation.selected_facilities) {
          selectedFacilities = typeof reservation.selected_facilities === 'string' 
            ? JSON.parse(reservation.selected_facilities as string)
            : reservation.selected_facilities as string[]
        }
      } catch (e) {
        console.error('Error parsing facilities:', e)
      }

      const facilityNames = selectedFacilities.map((facilityId: string) => 
        facilityMap.get(facilityId)?.name || `Facility ${facilityId}`
      ).join(', ') || 'No facilities'

      const paymentInfo = reservation.payments?.length > 0
        ? reservation.payments.map((p) => ({
            method: p.payment_method?.name || 'Unknown',
            amount: Number(p.amount),
            status: p.status,
            date: p.created_at?.toISOString() || null
          }))
        : [{ method: 'Belum Bayar', amount: 0, status: 'pending', date: null }]

      const totalPaid = reservation.payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
      const remainingAmount = Number(reservation.total_amount) - totalPaid

      return {
        ...reservation,
        reservation_date: reservation.reservation_date.toISOString(),
        start_time: reservation.start_time.toISOString(),
        end_time: reservation.end_time.toISOString(),
        created_at: reservation.created_at?.toISOString() || '',
        total_amount: Number(reservation.total_amount),
        discount_amount: Number(reservation.discount_amount),
        customerName,
        customerContact,
        customerType,
        packageName: reservation.package?.name || 'No Package',
        facilityNames,
        facilitiesCount: selectedFacilities.length,
        addonsCount: reservation.reservation_addons?.length || 0,
        paymentInfo,
        totalPaid,
        remainingAmount,
        isFullyPaid: remainingAmount <= 0,
        dayOfWeek: new Date(reservation.reservation_date).toLocaleDateString('id-ID', { weekday: 'long' }),
        timeSlot: `${reservation.start_time.toISOString().split('T')[1].substring(0, 5)}-${reservation.end_time.toISOString().split('T')[1].substring(0, 5)}`
      }
    })

    return {
      totalBookings: reservations.length,
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
  } catch (error) {
    console.error('Error generating booking report:', error)
    throw error
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