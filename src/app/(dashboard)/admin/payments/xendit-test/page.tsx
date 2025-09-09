'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useCreateXenditPayment } from '@/hooks/use-xendit-payment'
import { toast } from 'sonner'

export default function XenditTestPage() {
  const [bookingCode, setBookingCode] = useState('')
  const [paymentType, setPaymentType] = useState<'dp' | 'remaining' | 'full'>('dp')
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER')
  
  const { mutate: createPayment, isPending } = useCreateXenditPayment()
  
  const handleCreatePayment = () => {
    if (!bookingCode) {
      toast.error('Please enter a booking code')
      return
    }
    
    createPayment({
      reservationId: bookingCode,
      paymentType,
      paymentMethod,
    })
  }
  
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Xendit Payment Test</CardTitle>
          <CardDescription>
            Test the Xendit payment integration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="booking-code">Booking Code</Label>
            <Input
              id="booking-code"
              value={bookingCode}
              onChange={(e) => setBookingCode(e.target.value)}
              placeholder="Enter booking code"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="payment-type">Payment Type</Label>
            <select
              id="payment-type"
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value as any)}
              className="w-full p-2 border rounded"
            >
              <option value="dp">Down Payment</option>
              <option value="remaining">Remaining Payment</option>
              <option value="full">Full Payment</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="payment-method">Payment Method</Label>
            <select
              id="payment-method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="EWALLET">E-Wallet</option>
              <option value="QR_CODE">QR Code</option>
              <option value="RETAIL_OUTLET">Retail Outlet</option>
              <option value="CREDIT_CARD">Credit Card</option>
            </select>
          </div>
          
          <Button 
            onClick={handleCreatePayment} 
            disabled={isPending}
            className="w-full"
          >
            {isPending ? 'Creating Payment...' : 'Create Xendit Payment'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}