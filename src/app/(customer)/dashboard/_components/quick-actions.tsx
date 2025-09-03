"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Camera, History, Star, Phone, MessageSquare } from "lucide-react"

const actions = [
  {
    title: "Book New Session",
    description: "Schedule your next photo shoot",
    icon: Calendar,
    href: "/booking",
    color: "bg-blue-500 hover:bg-blue-600"
  },
  {
    title: "Browse Packages",
    description: "View available photo packages",
    icon: Camera,
    href: "/packages", 
    color: "bg-green-500 hover:bg-green-600"
  },
  {
    title: "View History",
    description: "See your booking history",
    icon: History,
    href: "/history",
    color: "bg-purple-500 hover:bg-purple-600"
  },
  {
    title: "Leave Review",
    description: "Rate your experience",
    icon: Star,
    href: "/reviews",
    color: "bg-yellow-500 hover:bg-yellow-600"
  }
]

const supportActions = [
  {
    title: "Contact Support",
    description: "Get help with your booking",
    icon: Phone,
    href: "/support",
  },
  {
    title: "Chat with CS",
    description: "Live chat support",
    icon: MessageSquare,
    href: "/chat",
  }
]

export function QuickActions() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common actions you might want to take
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {actions.map((action) => (
              <Link key={action.title} href={action.href}>
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className={`p-2 rounded-lg text-white ${action.color}`}>
                    <action.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{action.title}</p>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
          <CardDescription>
            Get support when you need it
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {supportActions.map((action) => (
              <Link key={action.title} href={action.href}>
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <action.icon className="h-4 w-4 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">{action.title}</p>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}