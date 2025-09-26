"use client"

import React, { useState, useEffect } from "react"
import { Calendar, User, Package as PackageIcon, DollarSign, Save, X, Plus, Minus, Search, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { usePublicPackages } from "@/hooks/use-customer-packages"
import { useAvailableTimeSlots } from "@/hooks/use-time-slots"
import { useActivePaymentManualMethods } from "@/hooks/use-payment-methods"
import { createManualReservationAction } from "@/actions/reservations"
import { getPackageAddonsAction } from "@/actions/addons"
import { getActiveDiscountsAction, validateDiscountAction, type Discount } from "@/actions/discounts"
import type { Package } from "@/actions/customer-packages"
import type { Addon } from "@/actions/addons"

interface SelectedAddon {
  id: string
  name: string
  price: number
  quantity: number
  max_quantity: number
}

interface SelectedDiscount {
  id: string
  name: string
  type: 'percentage' | 'fixed_amount'
  value: number
  discount_amount: number
}

interface ManualBookingFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  studioId: string
}

export function ManualBookingForm({ isOpen, onClose, onSuccess, studioId }: ManualBookingFormProps) {

  // Form state
  const [formData, setFormData] = useState({
    // Customer info
    customer_name: '',
    customer_email: '',
    customer_whatsapp: '',

    // Booking details
    package_id: '',
    reservation_date: '',
    start_time: '',
    end_time: '',

    // Pricing
    package_price: 0,
    dp_amount: 0,
    total_amount: 0,
    discount_amount: 0,

    // Notes
    special_requests: '',
    internal_notes: '',

    // Payment
    payment_status: 'partial' as 'partial' | 'completed',
    payment_option: 'dp' as 'dp' | 'full'
  })

  const [availableAddons, setAvailableAddons] = useState<Addon[]>([])
  const [selectedAddons, setSelectedAddons] = useState<SelectedAddon[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingAddons, setIsLoadingAddons] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)
  const [packageSearch, setPackageSearch] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [customDpAmount, setCustomDpAmount] = useState('')

  // Discount states
  const [availableDiscounts, setAvailableDiscounts] = useState<Discount[]>([])
  const [selectedDiscount, setSelectedDiscount] = useState<SelectedDiscount | null>(null)
  const [isLoadingDiscounts, setIsLoadingDiscounts] = useState(false)

  // Use real API hooks
  const { data: packages = [], isLoading: packagesLoading } = usePublicPackages(studioId)
  const { data: paymentMethods = [], isLoading: isLoadingPaymentMethods } = useActivePaymentManualMethods(studioId)

  // Set default payment method to cash when payment methods are loaded
  useEffect(() => {
    if (paymentMethods.length > 0 && !paymentMethod) {
      // Find cash payment method (assuming it has 'cash' in type or name)
      const cashMethod = paymentMethods.find(method =>
        method.type === 'cash' ||
        method.name.toLowerCase().includes('cash') ||
        method.name.toLowerCase().includes('tunai')
      )
      if (cashMethod) {
        setPaymentMethod(cashMethod.id)
      } else {
        // If no cash method found, use first available method
        setPaymentMethod(paymentMethods[0].id)
      }
    }
  }, [paymentMethods, paymentMethod])

  // Load discounts when component mounts
  useEffect(() => {
    const loadDiscounts = async () => {
      try {
        setIsLoadingDiscounts(true)
        const result = await getActiveDiscountsAction(studioId)
        if (result.success && result.data) {
          setAvailableDiscounts(result.data)
        }
      } catch (error) {
        console.error('Error loading discounts:', error)
      } finally {
        setIsLoadingDiscounts(false)
      }
    }

    if (studioId) {
      loadDiscounts()
    }
  }, [studioId])

  // Filter packages based on search
  const filteredPackages = packages.filter(pkg =>
    pkg.name.toLowerCase().includes(packageSearch.toLowerCase())
  )
  const {
    data: availableSlots = [],
    isLoading: isLoadingSlots
  } = useAvailableTimeSlots(
    studioId,
    formData.reservation_date,
    selectedPackage?.duration_minutes,
    selectedPackage?.id
  )

  // Load addons when package changes
  useEffect(() => {
    if (formData.package_id) {
      loadPackageAddons(formData.package_id)
    } else {
      setAvailableAddons([])
      setSelectedAddons([])
    }
  }, [formData.package_id])

  // Sync selectedAddons with availableAddons data when addons are loaded
  useEffect(() => {
    if (availableAddons.length > 0 && selectedAddons.length > 0) {
      setSelectedAddons(prevSelected =>
        prevSelected.map(selectedAddon => {
          const availableAddon = availableAddons.find(a => a.id === selectedAddon.id)
          if (availableAddon) {
            const isIncluded = availableAddon.package_addon?.is_included
            const finalPrice = isIncluded ? 0 : (availableAddon.package_addon?.final_price !== undefined ? availableAddon.package_addon.final_price : availableAddon.price)
            return {
              ...selectedAddon,
              price: finalPrice
            }
          }
          return selectedAddon
        })
      )
    }
  }, [availableAddons])

  // Recalculate pricing when addons, package price, or discount changes
  useEffect(() => {
    if (formData.package_price > 0) { // Only recalculate if package is selected
      const addonTotal = selectedAddons.reduce((sum, addon) => sum + (addon.price * addon.quantity), 0)
      const subtotal = formData.package_price + addonTotal
      
      
      const totalAmount = Math.max(0, subtotal - formData.discount_amount) // Ensure total is never negative

      // Only update if values are different to avoid infinite loops
      if (Math.abs(formData.total_amount - totalAmount) > 0.01) {
        const currentDpAmount = formData.dp_amount
        let newDpAmount = currentDpAmount
        let paymentStatus: 'partial' | 'completed' = currentDpAmount >= totalAmount ? 'completed' : 'partial'

        // Adjust DP amount based on payment option
        if (formData.payment_option === 'full') {
          newDpAmount = totalAmount
          paymentStatus = 'completed'
          setCustomDpAmount(totalAmount.toString())
        } else if (formData.payment_option === 'dp') {
          // If in DP mode, auto-adjust DP based on new total (especially when discount is applied)
          const dpPercentage = (selectedPackage?.dp_percentage || 50) / 100
          const calculatedDp = Math.floor(totalAmount * dpPercentage)
          
          // Always recalculate DP when total changes - this is expected behavior when discount is applied
          newDpAmount = calculatedDp
          setCustomDpAmount(calculatedDp.toString())
          
          paymentStatus = newDpAmount >= totalAmount ? 'completed' : 'partial'
        }

        setFormData(prev => ({
          ...prev,
          total_amount: totalAmount,
          dp_amount: newDpAmount,
          payment_status: paymentStatus
        }))
      }
    }
  }, [selectedAddons, formData.package_price, formData.discount_amount, formData.payment_option])

  // Separate useEffect to handle discount revalidation when addons change
  useEffect(() => {
    if (selectedDiscount && formData.discount_amount > 0 && formData.package_price > 0) {
      const addonTotal = selectedAddons.reduce((sum, addon) => sum + (addon.price * addon.quantity), 0)
      const newSubtotal = formData.package_price + addonTotal
      const currentSubtotal = formData.total_amount + formData.discount_amount
      
      // Only revalidate if subtotal actually changed
      if (Math.abs(newSubtotal - currentSubtotal) > 0.01) {
        handleDiscountRevalidation(newSubtotal)
      }
    }
  }, [selectedAddons]) // Only trigger when addons change

  const loadPackageAddons = async (packageId: string) => {
    try {
      setIsLoadingAddons(true)
      const result = await getPackageAddonsAction(packageId)
      if (result.success) {
        setAvailableAddons(result.data || [])
      } else {
        console.error('Failed to load addons:', result.error)
        setAvailableAddons([])
      }
    } catch (error) {
      console.error('Error loading addons:', error)
      setAvailableAddons([])
    } finally {
      setIsLoadingAddons(false)
    }
  }

  // Handle discount revalidation when subtotal changes
  const handleDiscountRevalidation = async (newSubtotal: number) => {
    if (!selectedDiscount) return

    try {
      const validation = await validateDiscountAction(selectedDiscount.id, newSubtotal, studioId)
      
      if (validation.success && validation.data?.is_valid) {
        const newDiscountAmount = validation.data.discount_amount

        // Update discount amount if it changed
        if (newDiscountAmount !== selectedDiscount.discount_amount) {
          setSelectedDiscount(prev => prev ? {
            ...prev,
            discount_amount: newDiscountAmount
          } : null)

          setFormData(prev => ({
            ...prev,
            discount_amount: newDiscountAmount
          }))
        }
      } else {
        // If discount becomes invalid, remove it
        toast.warning(`Discount "${selectedDiscount.name}" tidak valid untuk total baru: ${validation.data?.error_message || 'Unknown error'}`)
        setSelectedDiscount(null)
        setFormData(prev => ({ ...prev, discount_amount: 0 }))
      }
    } catch (error) {
      console.error('Error revalidating discount:', error)
      // Keep current discount on error
    }
  }

  // Handle discount selection
  const handleDiscountSelect = async (discountId: string) => {
    if (!discountId || discountId === 'no-discount') {
      setSelectedDiscount(null)
      setFormData(prev => ({ ...prev, discount_amount: 0 }))
      return
    }

    const discount = availableDiscounts.find(d => d.id === discountId)
    if (!discount) return

    try {
      // Calculate subtotal (package + addons) before discount
      const addonTotal = selectedAddons.reduce((sum, addon) => sum + (addon.price * addon.quantity), 0)
      const subtotal = formData.package_price + addonTotal

      // Validate discount
      const validation = await validateDiscountAction(discountId, subtotal, studioId)

      if (validation.success && validation.data?.is_valid) {
        const discountAmount = validation.data.discount_amount

        setSelectedDiscount({
          id: discount.id,
          name: discount.name,
          type: discount.type,
          value: discount.value,
          discount_amount: discountAmount
        })

        setFormData(prev => ({
          ...prev,
          discount_amount: discountAmount
        }))

        toast.success(`Discount applied: ${discount.name}`)
      } else {
        toast.error(validation.data?.error_message || 'Invalid discount')
        setSelectedDiscount(null)
      }
    } catch (error) {
      console.error('Error validating discount:', error)
      toast.error('Failed to apply discount')
      setSelectedDiscount(null)
    }
  }


  const handlePackageSelect = (packageId: string) => {
    const pkg = packages.find(p => p.id === packageId)
    if (pkg) {
      setSelectedPackage(pkg)

      // Reset addons and discount when package changes
      setSelectedAddons([])
      setSelectedDiscount(null)

      // Recalculate pricing
      const addonTotal = 0 // No addons selected yet
      const totalAmount = pkg.price + addonTotal

      // Use package DP percentage or default 50%
      const dpPercentage = (pkg.dp_percentage || 50) / 100
      const initialDpAmount = Math.floor(totalAmount * dpPercentage)

      setFormData(prev => ({
        ...prev,
        package_id: packageId,
        package_price: pkg.price,
        total_amount: totalAmount,
        dp_amount: initialDpAmount,
        discount_amount: 0 // Reset discount amount
      }))

      // Set custom DP amount for display
      setCustomDpAmount(initialDpAmount.toString())
    }
  }

  const handleTimeSlotSelect = (slot: any) => {
    if (!slot.available || !selectedPackage) return

    // Calculate end time based on package duration
    const startTime = new Date(`1970-01-01 ${slot.time}:00`)
    const endTime = new Date(startTime.getTime() + selectedPackage.duration_minutes * 60000)
    const endTimeString = endTime.toTimeString().slice(0, 5)

    setFormData(prev => ({
      ...prev,
      start_time: slot.time,
      end_time: endTimeString
    }))
  }

  const handlePaymentOptionChange = (option: 'dp' | 'full') => {
    let dpAmount = 0
    let paymentStatus: 'partial' | 'completed' = 'partial'

    if (option === 'dp') {
      // Use package DP percentage or default 50% of total after discount
      const dpPercentage = (selectedPackage?.dp_percentage || 50) / 100
      const calculatedDp = Math.floor(formData.total_amount * dpPercentage)
      dpAmount = calculatedDp
      paymentStatus = 'partial'
      setCustomDpAmount(dpAmount.toString())
    } else if (option === 'full') {
      dpAmount = formData.total_amount
      paymentStatus = 'completed'
      setCustomDpAmount(dpAmount.toString())
    }

    setFormData(prev => ({
      ...prev,
      payment_option: option,
      dp_amount: dpAmount,
      payment_status: paymentStatus
    }))
  }

  const handleDpChange = (value: string) => {
    const dpAmount = parseInt(value) || 0
    const dpPercentage = selectedPackage?.dp_percentage || 50
    const minimumDp = Math.floor(formData.total_amount * (dpPercentage / 100))

    // Validate minimum DP requirement for DP option
    if (formData.payment_option === 'dp' && dpAmount > 0 && dpAmount < minimumDp) {
      toast.error(`DP minimum adalah ${dpPercentage}% dari total setelah diskon (${formatCurrency(minimumDp)})`)
      return
    }

    const paymentStatus = dpAmount >= formData.total_amount ? 'completed' : 'partial'

    setFormData(prev => ({
      ...prev,
      dp_amount: dpAmount,
      payment_status: paymentStatus
    }))
  }

  const handleCustomDpChange = (value: string) => {
    setCustomDpAmount(value)
    const dpAmount = parseInt(value) || 0
    const dpPercentage = selectedPackage?.dp_percentage || 50
    const minimumDp = Math.floor(formData.total_amount * (dpPercentage / 100))

    // Validate minimum DP requirement for DP option (calculated from total after discount)
    if (formData.payment_option === 'dp' && dpAmount < minimumDp && dpAmount > 0) {
      toast.error(`DP minimum adalah ${dpPercentage}% dari total setelah diskon (${formatCurrency(minimumDp)})`)
      return
    }

    const paymentStatus = dpAmount >= formData.total_amount ? 'completed' : 'partial'

    setFormData(prev => ({
      ...prev,
      dp_amount: dpAmount,
      payment_status: paymentStatus
    }))
  }

  const handleAddonSelect = (addon: Addon) => {
    const existing = selectedAddons.find(a => a.id === addon.id)
    if (existing) {
      // Remove addon
      setSelectedAddons(prev => prev.filter(a => a.id !== addon.id))
    } else {
      // Add addon - if is_included is true, price should be 0 for calculation
      const isIncluded = addon.package_addon?.is_included
      const finalPrice = isIncluded ? 0 : (addon.package_addon?.final_price !== undefined ? addon.package_addon.final_price : addon.price)
      setSelectedAddons(prev => [...prev, {
        id: addon.id,
        name: addon.name,
        price: finalPrice,
        quantity: 1,
        max_quantity: addon.max_quantity
      }])
    }
  }

  const handleAddonQuantityChange = (addonId: string, newQuantity: number) => {
    setSelectedAddons(prev =>
      prev.map(addon =>
        addon.id === addonId
          ? { ...addon, quantity: Math.max(1, Math.min(newQuantity, addon.max_quantity)) }
          : addon
      )
    )
  }


  const validateForm = () => {
    const required = [
      'customer_name',
      'customer_email',
      'customer_whatsapp',
      'package_id',
      'reservation_date',
      'start_time'
    ]

    for (const field of required) {
      if (!formData[field as keyof typeof formData]) {
        toast.error(`${field.replace('_', ' ')} is required`)
        return false
      }
    }

    // Validate WhatsApp format
    if (!/^[0-9+\-\s()]+$/.test(formData.customer_whatsapp)) {
      toast.error("Invalid WhatsApp number format")
      return false
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customer_email)) {
      toast.error("Invalid email format")
      return false
    }

    // Validate payment method selection
    if (!paymentMethod) {
      toast.error("Pilih metode pembayaran")
      return false
    }

    // Validate DP amount for DP option
    if (formData.payment_option === 'dp') {
      const dpPercentage = selectedPackage?.dp_percentage || 50
      const minimumDp = Math.floor(formData.total_amount * (dpPercentage / 100))
      if (formData.dp_amount < minimumDp) {
        toast.error(`DP minimum adalah ${dpPercentage}% dari total setelah diskon (${formatCurrency(minimumDp)})`)
        return false
      }
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      if (!selectedPackage) {
        toast.error("Paket harus dipilih")
        return
      }

      // Prepare addon data
      const selectedAddonData = selectedAddons.map(addon => ({
        addon_id: addon.id,
        quantity: addon.quantity,
        unit_price: addon.price
      }))

      // Calculate addon total
      const totalAddonsPrice = selectedAddons.reduce((sum, addon) => sum + (addon.price * addon.quantity), 0)

      // Create reservation data
      const reservationData = {
        studio_id: studioId,
        package_id: formData.package_id,
        customer_name: formData.customer_name,
        customer_email: formData.customer_email || undefined,
        customer_phone: formData.customer_whatsapp,
        is_guest_booking: true,
        reservation_date: formData.reservation_date,
        start_time: formData.start_time,
        duration_minutes: selectedPackage.duration_minutes,
        selected_addons: selectedAddonData.length > 0 ? selectedAddonData : undefined,
        package_price: formData.package_price,
        dp_percentage: selectedPackage.dp_percentage || 30,
        total_addons_price: totalAddonsPrice,
        special_requests: formData.special_requests || undefined,
        internal_notes: formData.internal_notes || undefined,
        payment_method: paymentMethod || undefined,
        payment_status: formData.payment_status, // partial for DP, completed for full payment
        dp_amount: formData.dp_amount,
        // Discount data
        discount_id: selectedDiscount?.id || undefined,
        discount_amount: formData.discount_amount,
      }

      const result = await createManualReservationAction(reservationData)

      if (result.success) {
        toast.success("Manual booking berhasil dibuat")
        onSuccess()
        onClose()
        resetForm()
      } else {
        toast.error(result.error || "Gagal membuat booking")
      }

    } catch (error: any) {
      console.error('Error creating manual booking:', error)
      toast.error(error.message || "Terjadi kesalahan saat membuat booking")
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      customer_name: '',
      customer_email: '',
      customer_whatsapp: '',
      package_id: '',
      reservation_date: '',
      start_time: '',
      end_time: '',
      package_price: 0,
      dp_amount: 0,
      total_amount: 0,
      discount_amount: 0,
      special_requests: '',
      internal_notes: '',
      payment_status: 'partial',
      payment_option: 'dp'
    })
    setSelectedPackage(null)
    setSelectedAddons([])
    setAvailableAddons([])
    setPackageSearch('')
    setPaymentMethod('')
    setCustomDpAmount('')
    setSelectedDiscount(null)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatPhoneNumber = (value: string) => {
    // Remove all non-numeric characters except + at the beginning
    const cleaned = value.replace(/[^\d+]/g, '')

    // If starts with 0, replace with +62
    if (cleaned.startsWith('0')) {
      return '+62' + cleaned.slice(1)
    }

    // If starts with 62, add +
    if (cleaned.startsWith('62') && !cleaned.startsWith('+62')) {
      return '+' + cleaned
    }

    return cleaned
  }

  const handleWhatsAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setFormData(prev => ({ ...prev, customer_whatsapp: formatted }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[99vw] min-w-[320px] sm:min-w-[600px] md:min-w-[800px] lg:min-w-[1000px] max-w-[1600px] max-h-[98vh] overflow-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Manual Booking Entry
          </DialogTitle>
          <DialogDescription>
            Create booking manually for walk-in customers or phone bookings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-w-none">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customer_name">Full Name *</Label>
                  <Input
                    id="customer_name"
                    value={formData.customer_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                    placeholder="Customer full name"
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer_whatsapp">WhatsApp Number *</Label>
                  <div className="relative">
                    <Input
                      id="customer_whatsapp"
                      type="tel"
                      value={formData.customer_whatsapp || ''}
                      onChange={handleWhatsAppChange}
                      placeholder="+62 xxx xxx xxxx"
                      className="w-full pl-3"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Nomor WhatsApp untuk konfirmasi booking
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer_email">Email Address *</Label>
                <Input
                  id="customer_email"
                  type="email"
                  value={formData.customer_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, customer_email: e.target.value }))}
                  placeholder="customer@email.com"
                />
              </div>
            </CardContent>
          </Card>

          {/* Package Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PackageIcon className="h-4 w-4" />
                Package Selection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="package_search">Search Package</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="package_search"
                    type="text"
                    value={packageSearch}
                    onChange={(e) => setPackageSearch(e.target.value)}
                    placeholder="Cari nama paket..."
                    className="pl-10"
                  />
                </div>
              </div>
              {packagesLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : filteredPackages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {packageSearch ? 'Tidak ada paket yang sesuai dengan pencarian' : 'Tidak ada paket tersedia'}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                  {filteredPackages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${formData.package_id === pkg.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                        }`}
                      onClick={() => handlePackageSelect(pkg.id)}
                    >
                      <div className="font-medium text-sm mb-2 break-words">
                        {pkg.name}
                      </div>
                      <div className="text-xs text-gray-500 mb-3 line-clamp-2">
                        {pkg.description || ''}
                      </div>
                      <div className="flex items-center justify-start mb-2">
                        <Badge variant="outline" className="text-xs">
                          {pkg.duration_minutes} min
                        </Badge>
                      </div>
                      <div className="text-sm font-bold text-green-600 break-words">
                        {formatCurrency(pkg.price)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Date & Time Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date & Time Selection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reservation_date">Reservation Date *</Label>
                <Input
                  id="reservation_date"
                  type="date"
                  value={formData.reservation_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, reservation_date: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {formData.reservation_date && selectedPackage && (
                <div className="space-y-2">
                  <Label>Slot Waktu Tersedia</Label>
                  {isLoadingSlots ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      Tidak ada slot waktu tersedia untuk tanggal ini
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-2">
                      {availableSlots.map((slot) => {
                        const endTime = new Date(`1970-01-01 ${slot.time}:00`)
                        endTime.setMinutes(endTime.getMinutes() + selectedPackage.duration_minutes)
                        const endTimeString = endTime.toTimeString().slice(0, 5)

                        return (
                          <Button
                            key={slot.id}
                            variant={
                              formData.start_time === slot.time
                                ? "default"
                                : slot.available
                                  ? "outline"
                                  : "secondary"
                            }
                            size="sm"
                            disabled={!slot.available}
                            onClick={() => handleTimeSlotSelect(slot)}
                            className="text-xs whitespace-nowrap min-w-0"
                          >
                            <span className="truncate">
                              {slot.time} - {endTimeString}
                            </span>
                          </Button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Addon Selection */}
          {selectedPackage && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add-ons (Opsional)
                </CardTitle>
                <CardDescription>
                  Pilih add-on tambahan untuk melengkapi paket Anda
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingAddons ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : availableAddons.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    Tidak ada add-on tersedia untuk paket ini
                  </div>
                ) : (
                  <div className="space-y-3">
                    {availableAddons.map((addon) => {
                      const selectedAddon = selectedAddons.find(sa => sa.id === addon.id)
                      const isSelected = !!selectedAddon
                      const finalPrice = addon.package_addon?.final_price !== undefined ? addon.package_addon.final_price : addon.price
                      const originalPrice = addon.price
                      const hasDiscount = addon.package_addon?.discount_percentage && addon.package_addon.discount_percentage > 0
                      const isIncluded = addon.package_addon?.is_included

                      return (
                        <div
                          key={addon.id}
                          className={`p-4 border rounded-lg transition-colors ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                            }`}
                        >
                          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start gap-3">
                                <div className="mt-1">
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() => handleAddonSelect(addon)}
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm break-words">{addon.name}</div>
                                  {addon.description && (
                                    <div className="text-xs text-gray-500 mt-1 break-words">
                                      {addon.description}
                                    </div>
                                  )}
                                  <div className="flex flex-wrap items-center gap-2 mt-2">
                                    {isIncluded ? (
                                      <Badge variant="outline" className="text-xs whitespace-nowrap border-green-500 text-green-600 bg-green-50">
                                        Gratis
                                      </Badge>
                                    ) : (
                                      <div className="text-sm font-semibold text-green-600 whitespace-nowrap">
                                        {formatCurrency(finalPrice)}
                                      </div>
                                    )}
                                    {hasDiscount && !isIncluded && (
                                      <>
                                        <div className="text-xs text-gray-400 line-through whitespace-nowrap">
                                          {formatCurrency(originalPrice)}
                                        </div>
                                        <Badge variant="secondary" className="text-xs whitespace-nowrap">
                                          -{addon.package_addon?.discount_percentage}%
                                        </Badge>
                                      </>
                                    )}
                                    {addon.package_addon?.is_recommended && (
                                      <Badge variant="default" className="text-xs whitespace-nowrap">
                                        Rekomendasi
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {isSelected && selectedAddon && (
                              <div className="flex items-center gap-2 lg:flex-shrink-0">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleAddonQuantityChange(addon.id, selectedAddon.quantity - 1)}
                                  disabled={selectedAddon.quantity <= 1}
                                  className="h-8 w-8 p-0 flex-shrink-0"
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="text-sm font-medium w-8 text-center flex-shrink-0">
                                  {selectedAddon.quantity}
                                </span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleAddonQuantityChange(addon.id, selectedAddon.quantity + 1)}
                                  disabled={selectedAddon.quantity >= addon.max_quantity}
                                  className="h-8 w-8 p-0 flex-shrink-0"
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Discount Selection */}
          {selectedPackage && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Discount (Optional)
                </CardTitle>
                <CardDescription>
                  Apply discount to reduce the total amount
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingDiscounts ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Label htmlFor="discount_select">Select Discount</Label>
                    <Select
                      value={selectedDiscount?.id || 'no-discount'}
                      onValueChange={handleDiscountSelect}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="No discount selected" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no-discount">No Discount</SelectItem>
                        {availableDiscounts.map((discount) => (
                          <SelectItem key={discount.id} value={discount.id}>
                            <div className="flex items-center justify-between w-full">
                              <div>
                                <div className="font-medium">{discount.name}</div>
                                <div className="text-xs text-gray-500">
                                  {discount.type === 'percentage'
                                    ? `${discount.value}% off`
                                    : `${formatCurrency(discount.value)} off`
                                  }
                                  {discount.minimum_amount > 0 &&
                                    ` (Min: ${formatCurrency(discount.minimum_amount)})`
                                  }
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {selectedDiscount && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-green-800">{selectedDiscount.name}</div>
                            <div className="text-sm text-green-600">
                              {selectedDiscount.type === 'percentage'
                                ? `${selectedDiscount.value}% discount`
                                : `${formatCurrency(selectedDiscount.value)} discount`
                              }
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-700">
                              -{formatCurrency(selectedDiscount.discount_amount)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Payment Information */}
          {selectedPackage && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Payment Option Selection */}
                <div className="space-y-3">
                  <Label>Payment Option</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${formData.payment_option === 'dp'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                        }`}
                      onClick={() => handlePaymentOptionChange('dp')}
                    >
                      <div className="font-medium text-sm">Bayar DP</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Minimum {selectedPackage?.dp_percentage || 50}% dari total setelah diskon (Min: {formatCurrency(Math.floor(formData.total_amount * ((selectedPackage?.dp_percentage || 50) / 100)))})
                      </div>
                    </div>
                    <div
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${formData.payment_option === 'full'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                        }`}
                      onClick={() => handlePaymentOptionChange('full')}
                    >
                      <div className="font-medium text-sm">Bayar Lunas</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Pembayaran penuh ({formatCurrency(formData.total_amount)})
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Method Selection */}
                <div className="space-y-3">
                  <Label htmlFor="payment_method">Payment Method *</Label>
                  {isLoadingPaymentMethods ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  ) : paymentMethods.length === 0 ? (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      Tidak ada metode pembayaran tersedia
                    </div>
                  ) : (
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih metode pembayaran" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map((method) => (
                          <SelectItem key={method.id} value={method.id}>
                            <div className="flex items-center gap-2">
                              <span>{method.type === 'bank_transfer' ? '🏦' : method.type === 'e_wallet' ? '💳' : '💰'}</span>
                              <div>
                                <div className="font-medium">{method.name}</div>
                                <div className="text-xs text-gray-500">
                                  {method.provider} • {method.type.replace('_', ' ')}
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Package Price</Label>
                    <div className="text-lg font-bold text-green-600 break-all">
                      {formatCurrency(formData.package_price)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dp_amount">
                      {formData.payment_option === 'full' ? 'Payment Amount (Full)' : 'Down Payment (DP)'}
                    </Label>
                    <Input
                      id="dp_amount"
                      type="number"
                      value={formData.payment_option === 'dp' ? customDpAmount : formData.dp_amount}
                      onChange={(e) => formData.payment_option === 'dp' ? handleCustomDpChange(e.target.value) : handleDpChange(e.target.value)}
                      placeholder="0"
                      className="w-full"
                      readOnly={formData.payment_option === 'full'}
                      min={formData.payment_option === 'dp' ? Math.floor(formData.total_amount * ((selectedPackage?.dp_percentage || 50) / 100)) : 0}
                      max={formData.total_amount}
                    />
                    {formData.payment_option === 'dp' && (
                      <div className="text-xs text-gray-500">
                        Minimum DP: {formatCurrency(Math.floor(formData.total_amount * ((selectedPackage?.dp_percentage || 50) / 100)))} ({selectedPackage?.dp_percentage || 50}% dari total setelah diskon)
                      </div>
                    )}
                    {formData.payment_option === 'full' && (
                      <div className="text-xs text-gray-500">
                        Amount automatically set to full payment
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Status</Label>
                    <div className="flex">
                      <Badge
                        variant={
                          formData.payment_status === 'completed' ? 'default' :
                            formData.payment_status === 'partial' ? 'secondary' : 'outline'
                        }
                        className="whitespace-nowrap"
                      >
                        {formData.payment_status === 'completed' ? 'Lunas' :
                          formData.payment_status === 'partial' ? 'DP' : 'Belum Bayar'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="text-sm text-gray-600 p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span>Package Price:</span>
                    <span className="font-medium break-all text-right">{formatCurrency(formData.package_price)}</span>
                  </div>
                  {selectedAddons.length > 0 && (
                    <div className="flex justify-between items-center mb-2">
                      <span>Add-ons ({selectedAddons.length}):</span>
                      <span className="font-medium break-all text-right">
                        {formatCurrency(selectedAddons.reduce((sum, addon) => sum + (addon.price * addon.quantity), 0))}
                      </span>
                    </div>
                  )}
                  {formData.discount_amount > 0 && (
                    <div className="flex justify-between items-center mb-2">
                      <span>Discount:</span>
                      <span className="font-medium break-all text-right text-green-600">
                        -{formatCurrency(formData.discount_amount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center border-t pt-2 mt-2 font-semibold">
                    <span>Total Amount:</span>
                    <span className="font-bold break-all text-right">{formatCurrency(formData.total_amount)}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span>DP Amount:</span>
                    <span className="font-medium break-all text-right">{formatCurrency(formData.dp_amount)}</span>
                  </div>
                  <div className="flex justify-between items-center border-t pt-2 mt-2">
                    <span>Remaining:</span>
                    <span className="font-bold break-all text-right">{formatCurrency(formData.total_amount - formData.dp_amount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="special_requests">Special Requests</Label>
                  <Textarea
                    id="special_requests"
                    value={formData.special_requests}
                    onChange={(e) => setFormData(prev => ({ ...prev, special_requests: e.target.value }))}
                    placeholder="Any special requests from customer..."
                    rows={4}
                    className="w-full resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="internal_notes">Internal Notes</Label>
                  <Textarea
                    id="internal_notes"
                    value={formData.internal_notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, internal_notes: e.target.value }))}
                    placeholder="Internal notes for staff..."
                    rows={4}
                    className="w-full resize-none"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Creating...' : 'Create Booking'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}