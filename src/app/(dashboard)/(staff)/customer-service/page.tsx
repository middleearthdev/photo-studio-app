"use client"

import { CustomerServiceLayout } from "./_components/customer-service-layout"
import { ServiceStats } from "./_components/service-stats"
import { ActiveTickets } from "./_components/active-tickets"
import { CustomerRequests } from "./_components/customer-requests"

export default function CustomerServiceDashboard() {
  return (
    <CustomerServiceLayout>
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Customer Service Dashboard</h2>
            <p className="text-muted-foreground">
              Manage customer inquiries, bookings, and support tickets
            </p>
          </div>
        </div>
        
        <ServiceStats />
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          <div className="col-span-4">
            <ActiveTickets />
          </div>
          <div className="col-span-3">
            <CustomerRequests />
          </div>
        </div>
      </div>
    </CustomerServiceLayout>
  )
}