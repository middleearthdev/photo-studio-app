"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Clock, AlertCircle } from "lucide-react"

interface PaymentSummaryItem {
  title: string
  value: string
  count: string
  status: 'pending' | 'confirmed'
}

interface PaymentAnalyticsProps {
  paymentSummary: PaymentSummaryItem[]
}

export function PaymentAnalytics({ paymentSummary }: PaymentAnalyticsProps) {
  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Payment Analytics</CardTitle>
        <CardDescription>
          Financial overview and payment status
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {paymentSummary.map((payment, index) => (
            <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-4">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  payment.status === 'confirmed' ? 'bg-green-100' :
                  payment.status === 'pending' ? 'bg-yellow-100' : 'bg-red-100'
                }`}>
                  {payment.status === 'confirmed' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : payment.status === 'pending' ? (
                    <Clock className="w-5 h-5 text-yellow-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{payment.title}</p>
                  <p className="text-sm text-muted-foreground">{payment.count}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold">{payment.value}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}