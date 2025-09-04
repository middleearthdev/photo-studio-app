"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  AlertCircle,
  Clock,
  CheckCircle,
  Users,
  MessageSquare,
  User,
  Calendar,
  Phone,
  Mail,
  Star,
  Bell
} from "lucide-react"
import Link from "next/link"

const serviceStats = [
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

const activeTickets = [
  {
    id: "TKT-001",
    title: "Booking cancellation request",
    customer: "Sarah Johnson",
    priority: "high",
    status: "open",
    category: "Booking",
    lastUpdated: "2 hours ago",
    messages: 3
  },
  {
    id: "TKT-002",
    title: "Payment issue for wedding package",
    customer: "Michael Chen",
    priority: "urgent",
    status: "pending",
    category: "Payment",
    lastUpdated: "4 hours ago",
    messages: 5
  },
  {
    id: "TKT-003",
    title: "Rescheduling portrait session",
    customer: "Emma Davis",
    priority: "medium",
    status: "in_progress",
    category: "Booking",
    lastUpdated: "1 day ago",
    messages: 2
  }
]

const recentRequests = [
  {
    id: "REQ-001",
    type: "booking_inquiry",
    customer: "Anna Rodriguez",
    subject: "Wedding package pricing inquiry",
    timestamp: "5 min ago",
    priority: "medium",
    contact: "phone"
  },
  {
    id: "REQ-002",
    type: "complaint",
    customer: "David Kim",
    subject: "Unsatisfied with photo quality",
    timestamp: "15 min ago",
    priority: "high",
    contact: "email"
  },
  {
    id: "REQ-003",
    type: "booking_change",
    customer: "Lisa Thompson",
    subject: "Need to reschedule session",
    timestamp: "1 hour ago",
    priority: "medium",
    contact: "chat"
  }
]

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return 'bg-red-100 text-red-800'
    case 'high':
      return 'bg-orange-100 text-orange-800'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800'
    case 'low':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'open':
      return 'bg-blue-100 text-blue-800'
    case 'in_progress':
      return 'bg-purple-100 text-purple-800'
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'resolved':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getContactIcon = (contact: string) => {
  switch (contact) {
    case 'phone':
      return Phone
    case 'chat':
      return MessageSquare
    default:
      return Mail
  }
}

export default function CustomerServiceDashboard() {
  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Customer Service Dashboard</h2>
          <p className="text-muted-foreground">
            Manage customer inquiries, bookings, and support tickets
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" asChild>
            <Link href="/cs/tickets">View All Tickets</Link>
          </Button>
          <Button asChild>
            <Link href="/cs/tickets/create">Create Ticket</Link>
          </Button>
        </div>
      </div>

      {/* Service Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {serviceStats.map((stat) => (
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Active Tickets */}
        <Card className="col-span-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Active Support Tickets</CardTitle>
              <CardDescription>
                Recent customer service requests requiring attention
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/cs/tickets">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeTickets.map((ticket) => (
                <div key={ticket.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-start space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-orange-100 text-orange-700">
                        {ticket.customer.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900">{ticket.title}</h4>
                        <Badge className={getPriorityColor(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                        <Badge className={getStatusColor(ticket.status)}>
                          {ticket.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>{ticket.customer}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{ticket.lastUpdated}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageSquare className="h-4 w-4" />
                          <span>{ticket.messages} messages</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">#{ticket.id} • {ticket.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-800">
                      View Ticket
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Customer Requests */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Customer Requests</CardTitle>
            <CardDescription>
              Latest inquiries and requests from customers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentRequests.map((request) => {
                const ContactIcon = getContactIcon(request.contact)

                return (
                  <div key={request.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-orange-100 text-orange-700">
                        {request.customer.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-medium text-gray-900">{request.customer}</h4>
                        <Badge className={getPriorityColor(request.priority)} variant="secondary">
                          {request.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700">{request.subject}</p>
                      <div className="flex items-center space-x-3 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <ContactIcon className="h-3 w-3" />
                          <span>{request.contact}</span>
                        </div>
                        <span>{request.timestamp}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-800">
                      Respond
                    </Button>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/cs/tickets">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="text-center">
              <MessageSquare className="h-8 w-8 mx-auto text-orange-600" />
              <CardTitle className="text-lg">Support Tickets</CardTitle>
              <CardDescription>
                Handle customer support tickets
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/cs/bookings">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="text-center">
              <Calendar className="h-8 w-8 mx-auto text-blue-600" />
              <CardTitle className="text-lg">Booking Assistance</CardTitle>
              <CardDescription>
                Help customers with bookings
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/cs/customers">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="text-center">
              <Users className="h-8 w-8 mx-auto text-green-600" />
              <CardTitle className="text-lg">Customer Database</CardTitle>
              <CardDescription>
                Search and manage customers
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/cs/communications">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="text-center">
              <Bell className="h-8 w-8 mx-auto text-purple-600" />
              <CardTitle className="text-lg">Communications</CardTitle>
              <CardDescription>
                Send notifications and messages
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  )
}