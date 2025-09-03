"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, Star, Camera } from "lucide-react"

const stats = [
  {
    title: "Total Bookings",
    value: "12",
    description: "3 upcoming",
    icon: Calendar,
    color: "text-blue-600 bg-blue-100",
  },
  {
    title: "Completed Sessions",
    value: "8",
    description: "This year",
    icon: Camera,
    color: "text-green-600 bg-green-100",
  },
  {
    title: "Hours Booked",
    value: "24",
    description: "Total time",
    icon: Clock,
    color: "text-purple-600 bg-purple-100",
  },
  {
    title: "Average Rating",
    value: "4.8",
    description: "From your reviews",
    icon: Star,
    color: "text-yellow-600 bg-yellow-100",
  },
]

export function DashboardStats() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${stat.color}`}>
              <stat.icon className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <p className="text-xs text-gray-500 mt-1">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}