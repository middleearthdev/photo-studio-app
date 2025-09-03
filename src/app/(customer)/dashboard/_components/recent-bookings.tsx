"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CalendarDays, Clock, MapPin } from "lucide-react"

const bookings = [
  {
    id: "1",
    booking_code: "STD20241201001",
    package_name: "Wedding Package",
    studio_name: "Studio Phoenix",
    date: "2024-12-15",
    time: "10:00 - 14:00",
    status: "confirmed",
    amount: "Rp 2.500.000"
  },
  {
    id: "2", 
    booking_code: "STD20241128002",
    package_name: "Prewedding Session",
    studio_name: "Studio Lens",
    date: "2024-12-08",
    time: "14:00 - 17:00",
    status: "pending",
    amount: "Rp 1.800.000"
  },
  {
    id: "3",
    booking_code: "STD20241120003",
    package_name: "Portrait Session",
    studio_name: "Studio Focus",
    date: "2024-11-25",
    time: "09:00 - 11:00", 
    status: "completed",
    amount: "Rp 800.000"
  }
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'confirmed':
      return 'bg-green-100 text-green-800'
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'completed':
      return 'bg-blue-100 text-blue-800'
    case 'cancelled':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function RecentBookings() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Bookings</CardTitle>
          <CardDescription>
            Your latest studio bookings and sessions
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/bookings">View All</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium text-gray-900">{booking.package_name}</h4>
                  <Badge className={getStatusColor(booking.status)}>
                    {booking.status}
                  </Badge>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4" />
                    <span>{booking.studio_name}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <CalendarDays className="h-4 w-4" />
                    <span>{new Date(booking.date).toLocaleDateString('id-ID')}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{booking.time}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500">#{booking.booking_code}</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">{booking.amount}</p>
                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800">
                  View Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}