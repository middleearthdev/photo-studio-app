"use client"

import React, { useState } from "react"
import { DollarSign, CheckCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
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
import { Badge } from "@/components/ui/badge"
import { useActivePaymentManualMethods, usePaymentMethods } from "@/hooks/use-payment-methods"
import { useCompletePayment } from "@/hooks/use-payments"
import { type Reservation } from "@/actions/reservations"

interface CompletePaymentDialogProps {
  isOpen: boolean
  onClose: () => void
  reservation: Reservation | null
}

export function CompletePaymentDialog({ isOpen, onClose, reservation }: CompletePaymentDialogProps) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('')

  // Get payment methods for the studio
  const { data: paymentMethods = [], isLoading: isLoadingPaymentMethods } = useActivePaymentManualMethods(reservation?.studio_id!)

  // Complete payment mutation
  const completePaymentMutation = useCompletePayment()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const handleComplete = () => {
    if (!reservation) return

    completePaymentMutation.mutate(
      {
        reservationId: reservation.id,
        paymentMethodId: selectedPaymentMethod === 'none' || !selectedPaymentMethod ? undefined : selectedPaymentMethod
      },
      {
        onSuccess: (result) => {
          if (result.success) {
            onClose()
            // Reset form
            setSelectedPaymentMethod('')
          }
        }
      }
    )
  }

  const handleClose = () => {
    if (!completePaymentMutation.isPending) {
      setSelectedPaymentMethod('')
      onClose()
    }
  }

  // Calculate remaining amount
  const remainingAmount = reservation ? reservation.total_amount - reservation.dp_amount : 0

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Konfirmasi Pelunasan
          </DialogTitle>
          <DialogDescription>
            Tandai reservasi ini sebagai lunas dengan mencatat pembayaran akhir.
          </DialogDescription>
        </DialogHeader>

        {reservation && (
          <div className="space-y-4">
            {/* Reservation Summary */}
            <div className="p-4 bg-gray-50 rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-medium text-gray-600">Kode Booking</Label>
                <span className="font-mono text-sm">{reservation.booking_code}</span>
              </div>

              <div className="flex justify-between items-center">
                <Label className="text-sm font-medium text-gray-600">Customer</Label>
                <span className="text-sm">{reservation.customer?.full_name || 'Unknown'}</span>
              </div>

              <div className="flex justify-between items-center">
                <Label className="text-sm font-medium text-gray-600">Status Saat Ini</Label>
                <Badge variant="secondary">
                  {reservation.payment_status === 'partial' ? 'DP Dibayar' : 'Menunggu Pembayaran'}
                </Badge>
              </div>

              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-medium text-gray-600">Total Tagihan</Label>
                  <span className="font-semibold">{formatCurrency(reservation.total_amount)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <Label className="text-sm font-medium text-gray-600">DP Dibayar</Label>
                  <span className="text-green-600">-{formatCurrency(reservation.dp_amount)}</span>
                </div>

                <div className="flex justify-between items-center border-t pt-2">
                  <Label className="text-sm font-medium text-gray-900">Sisa Tagihan</Label>
                  <span className="font-bold text-lg text-orange-600">{formatCurrency(remainingAmount)}</span>
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="space-y-3">
              <Label htmlFor="payment_method">Metode Pembayaran (Opsional)</Label>
              {isLoadingPaymentMethods ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <Select value={selectedPaymentMethod || 'none'} onValueChange={setSelectedPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih metode pembayaran (opsional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Tidak ada metode khusus</SelectItem>
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

            {/* Warning */}
            {remainingAmount > 0 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div className="text-sm text-green-800">
                    <p className="font-medium">Tindakan ini akan:</p>
                    <ul className="mt-1 list-disc list-inside text-xs space-y-1">
                      <li>Membuat catatan pembayaran sebesar {formatCurrency(remainingAmount)} dengan tipe "remaining"</li>
                      <li>Mengubah status pembayaran reservasi menjadi "Selesai"</li>
                      <li>Menandai pembayaran diterima pada waktu saat ini</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {remainingAmount <= 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-amber-600">⚠️</span>
                  <span className="text-sm text-amber-800">
                    Tidak ada sisa tagihan. Reservasi ini mungkin sudah lunas.
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose} disabled={completePaymentMutation.isPending}>
            <X className="h-4 w-4 mr-2" />
            Batal
          </Button>
          <Button
            onClick={handleComplete}
            disabled={completePaymentMutation.isPending || remainingAmount <= 0}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {completePaymentMutation.isPending ? 'Memproses...' : 'Konfirmasi Pelunasan'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}