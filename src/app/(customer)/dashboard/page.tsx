"use client"

import { CustomerDashboardLayout } from "./_components/customer-dashboard-layout"
import { DashboardStats } from "./_components/dashboard-stats"
import { RecentBookings } from "./_components/recent-bookings"
import { QuickActions } from "./_components/quick-actions"

export default function CustomerDashboard() {
  return (
    <CustomerDashboardLayout>
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        </div>
        
        <DashboardStats />
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          <div className="col-span-4">
            <RecentBookings />
          </div>
          <div className="col-span-3">
            <QuickActions />
          </div>
        </div>
      </div>
    </CustomerDashboardLayout>
  )
}