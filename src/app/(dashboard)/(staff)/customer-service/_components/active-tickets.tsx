"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Clock, MessageSquare, User } from "lucide-react"

const tickets = [
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
  },
  {
    id: "TKT-004",
    title: "Question about package inclusions",
    customer: "James Wilson",
    priority: "low",
    status: "open",
    category: "General",
    lastUpdated: "2 days ago", 
    messages: 1
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

export function ActiveTickets() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Active Support Tickets</CardTitle>
          <CardDescription>
            Recent customer service requests requiring attention
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/customer-service/tickets">View All</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tickets.map((ticket) => (
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
  )
}