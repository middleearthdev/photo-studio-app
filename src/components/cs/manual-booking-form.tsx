"use client"

import React, { useState, useEffect } from "react"
import { Calendar, Clock, User, Package as PackageIcon, DollarSign, Save, X, Plus, Minus } from "lucide-react"
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
import { createReservationAction } from "@/actions/reservations"
import { getPackageAddonsAction } from "@/actions/addons"
import type { Package } from "@/actions/customer-packages"
import type { Addon } from "@/actions/addons"

interface SelectedAddon {
  id: string
  name: string
  price: number
  quantity: number
  max_quantity: number
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
    customer_phone: '',

    // Booking details
    package_id: '',
    reservation_date: '',
    start_time: '',
    end_time: '',

    // Pricing
    package_price: 0,
    dp_amount: 0,
    total_amount: 0,

    // Notes
    special_requests: '',
    internal_notes: '',

    // Payment
    payment_status: 'pending' as 'pending' | 'partial' | 'completed',
    payment_option: 'dp' as 'dp' | 'full' | 'none'
  })

  const [availableAddons, setAvailableAddons] = useState<Addon[]>([])
  const [selectedAddons, setSelectedAddons] = useState<SelectedAddon[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingAddons, setIsLoadingAddons] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)

  // Use real API hooks
  const { data: packages = [], isLoading: packagesLoading } = usePublicPackages(studioId)
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


  const handlePackageSelect = (packageId: string) => {
    const pkg = packages.find(p => p.id === packageId)
    if (pkg) {
      setSelectedPackage(pkg)

      // Reset addons when package changes
      setSelectedAddons([])

      // Recalculate pricing
      const addonTotal = 0 // No addons selected yet
      const totalAmount = pkg.price + addonTotal

      setFormData(prev => ({
        ...prev,
        package_id: packageId,
        package_price: pkg.price,
        total_amount: totalAmount,
        dp_amount: Math.floor(totalAmount * (pkg.dp_percentage || 30) / 100)
      }))
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

  const handlePaymentOptionChange = (option: 'dp' | 'full' | 'none') => {
    let dpAmount = 0
    let paymentStatus: 'pending' | 'partial' | 'completed' = 'pending'
    
    if (option === 'dp') {
      dpAmount = Math.floor(formData.total_amount * (selectedPackage?.dp_percentage || 30) / 100)
      paymentStatus = 'partial'
    } else if (option === 'full') {
      dpAmount = formData.total_amount
      paymentStatus = 'completed'
    } else {
      dpAmount = 0
      paymentStatus = 'pending'
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
    const paymentStatus = dpAmount >= formData.total_amount ? 'completed' : dpAmount > 0 ? 'partial' : 'pending'

    setFormData(prev => ({
      ...prev,
      dp_amount: dpAmount,
      payment_status: paymentStatus,
      payment_option: dpAmount === formData.total_amount ? 'full' : dpAmount > 0 ? 'dp' : 'none'
    }))
  }

  const handleAddonSelect = (addon: Addon) => {
    const existing = selectedAddons.find(a => a.id === addon.id)
    if (existing) {
      // Remove addon
      setSelectedAddons(prev => prev.filter(a => a.id !== addon.id))
    } else {
      // Add addon
      setSelectedAddons(prev => [...prev, {
        id: addon.id,
        name: addon.name,
        price: addon.package_addon?.final_price || addon.price,
        quantity: 1,
        max_quantity: addon.max_quantity
      }])
    }
    recalculatePricing()
  }

  const handleAddonQuantityChange = (addonId: string, newQuantity: number) => {
    setSelectedAddons(prev =>
      prev.map(addon =>
        addon.id === addonId
          ? { ...addon, quantity: Math.max(1, Math.min(newQuantity, addon.max_quantity)) }
          : addon
      )
    )
    recalculatePricing()
  }

  const recalculatePricing = () => {
    setTimeout(() => {
      const addonTotal = selectedAddons.reduce((sum, addon) => sum + (addon.price * addon.quantity), 0)
      const totalAmount = formData.package_price + addonTotal
      const dpAmount = formData.dp_amount // Keep current DP amount
      const paymentStatus = dpAmount >= totalAmount ? 'completed' : dpAmount > 0 ? 'partial' : 'pending'

      setFormData(prev => ({
        ...prev,
        total_amount: totalAmount,
        payment_status: paymentStatus
      }))
    }, 0)
  }

  const validateForm = () => {
    const required = [
      'customer_name',
      'customer_email',
      'customer_phone',
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

    // Validate phone format
    if (!/^[0-9+\-\s()]+$/.test(formData.customer_phone)) {
      toast.error("Invalid phone number format")
      return false
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customer_email)) {
      toast.error("Invalid email format")
      return false
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
        customer_phone: formData.customer_phone,
        is_guest_booking: true,
        reservation_date: formData.reservation_date,
        start_time: formData.start_time,
        duration_minutes: selectedPackage.duration_minutes,
        selected_addons: selectedAddonData.length > 0 ? selectedAddonData : undefined,
        package_price: formData.package_price,
        dp_percentage: selectedPackage.dp_percentage || 30,
        total_addons_price: totalAddonsPrice,
        special_requests: formData.special_requests || undefined,
      }

      const result = await createReservationAction(reservationData)

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
      customer_phone: '',
      package_id: '',
      reservation_date: '',
      start_time: '',
      end_time: '',
      package_price: 0,
      dp_amount: 0,
      total_amount: 0,
      special_requests: '',
      internal_notes: '',
      payment_status: 'pending',
      payment_option: 'dp'
    })
    setSelectedPackage(null)
    setSelectedAddons([])
    setAvailableAddons([])
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
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
                  <Label htmlFor="customer_phone">Phone Number *</Label>
                  <Input
                    id="customer_phone"
                    value={formData.customer_phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, customer_phone: e.target.value }))}
                    placeholder="08xxxxxxxxxx"
                    className="w-full"
                  />
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
              {packagesLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : packages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Tidak ada paket tersedia
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                  {packages.map((pkg) => (
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
                      const finalPrice = addon.package_addon?.final_price || addon.price
                      const originalPrice = addon.price
                      const hasDiscount = addon.package_addon?.discount_percentage && addon.package_addon.discount_percentage > 0

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
                                    <div className="text-sm font-semibold text-green-600 whitespace-nowrap">
                                      {formatCurrency(finalPrice)}
                                    </div>
                                    {hasDiscount && (
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
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div 
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        formData.payment_option === 'none' 
                          ? 'border-orange-500 bg-orange-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handlePaymentOptionChange('none')}
                    >
                      <div className="font-medium text-sm">Belum Bayar</div>
                      <div className="text-xs text-gray-500 mt-1">Customer belum melakukan pembayaran</div>
                    </div>
                    <div 
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        formData.payment_option === 'dp' 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handlePaymentOptionChange('dp')}
                    >
                      <div className="font-medium text-sm">Bayar DP</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {selectedPackage?.dp_percentage || 30}% dari total ({formatCurrency(Math.floor(formData.total_amount * (selectedPackage?.dp_percentage || 30) / 100))})
                      </div>
                    </div>
                    <div 
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        formData.payment_option === 'full' 
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Package Price</Label>
                    <div className="text-lg font-bold text-green-600 break-all">
                      {formatCurrency(formData.package_price)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dp_amount">
                      {formData.payment_option === 'full' ? 'Payment Amount (Full)' : 
                       formData.payment_option === 'dp' ? 'Down Payment (DP)' : 
                       'Payment Amount'}
                    </Label>
                    <Input
                      id="dp_amount"
                      type="number"
                      value={formData.dp_amount}
                      onChange={(e) => handleDpChange(e.target.value)}
                      placeholder="0"
                      className="w-full"
                      readOnly={formData.payment_option !== 'none'}
                    />
                    {formData.payment_option !== 'none' && (
                      <div className="text-xs text-gray-500">
                        Amount automatically set based on payment option
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