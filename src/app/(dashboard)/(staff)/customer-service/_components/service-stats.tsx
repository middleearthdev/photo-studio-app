"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Clock, CheckCircle, Users } from "lucide-react"

const stats = [
  {
    title: "Open Tickets",
    value: "23",
    description: "5 urgent",
    icon: AlertCircle,
    color: "text-red-600 bg-red-100",
  },
  {
    title: "Pending Response",
    value: "12",
    description: "Awaiting staff reply",
    icon: Clock,
    color: "text-yellow-600 bg-yellow-100",
  },
  {
    title: "Resolved Today",
    value: "18",
    description: "8 more than yesterday",
    icon: CheckCircle,
    color: "text-green-600 bg-green-100",
  },
  {
    title: "Customer Satisfaction",
    value: "4.8",
    description: "Based on 45 reviews",
    icon: Users,
    color: "text-blue-600 bg-blue-100",
  },
]

export function ServiceStats() {
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