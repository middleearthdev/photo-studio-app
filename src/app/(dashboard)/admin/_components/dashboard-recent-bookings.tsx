"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useRecentBookings, formatCurrency, getStatusColor, getStatusLabel } from "@/hooks/use-dashboard-analytics"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar, Clock, User, Hash, ExternalLink } from "lucide-react"
import Link from "next/link"

interface RecentBookingsProps {
  studioId?: string
}

export function RecentBookings({ studioId }: RecentBookingsProps) {
  const { data: bookings, isLoading, error } = useRecentBookings(studioId)

  if (isLoading) {
    return (
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
          <CardDescription>Latest booking requests and confirmations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <div className="text-right space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="col-span-4 border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Recent Bookings</CardTitle>
          <CardDescription>Unable to load recent bookings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-600">
            <p className="text-sm">Error loading recent bookings</p>
            <Button variant="outline" size="sm" className="mt-2">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!bookings || bookings.length === 0) {
    return (
      <Card className="col-span-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Bookings</CardTitle>
            <CardDescription>Latest booking requests and confirmations</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/reservations">Create New</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-1">No Recent Bookings</p>
            <p className="text-sm mb-4">Start by creating your first booking or wait for customers to book.</p>
            <Button asChild>
              <Link href="/admin/reservations">Manage Bookings</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="col-span-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Bookings</CardTitle>
          <CardDescription>
            Latest booking requests and confirmations ({bookings.length} recent)
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/reservations" className="flex items-center gap-2">
            View All <ExternalLink className="h-3 w-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div 
              key={booking.id} 
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{booking.customerName}</p>
                    {booking.isGuest && (
                      <Badge variant="secondary" className="text-xs">
                        Guest
                      </Badge>
                    )}
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={getStatusColor(booking.status)}
                  >
                    {getStatusLabel(booking.status)}
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground font-medium">
                  {booking.packageName}
                </p>
                
                <div className="flex items-center gap-6 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(booking.date).toLocaleDateString('id-ID')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{booking.time}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Hash className="h-3 w-3" />
                    <span className="font-mono">{booking.bookingCode}</span>
                  </div>
                </div>
              </div>
              
              <div className="text-right space-y-1">
                <p className="font-semibold text-lg">
                  {formatCurrency(booking.amount)}
                </p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-blue-600 hover:text-blue-800 h-6 px-2"
                  asChild
                >
                  <Link href={`/admin/reservations/${booking.id}`}>
                    View Details
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}