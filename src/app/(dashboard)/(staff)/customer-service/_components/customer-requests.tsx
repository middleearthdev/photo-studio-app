"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Calendar, Phone, Mail, MessageSquare } from "lucide-react"

const requests = [
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
  },
  {
    id: "REQ-004",
    type: "general",
    customer: "Robert Brown",
    subject: "Question about studio location",
    timestamp: "2 hours ago",
    priority: "low", 
    contact: "phone"
  },
  {
    id: "REQ-005",
    type: "booking_inquiry",
    customer: "Sophie Martin",
    subject: "Corporate headshot availability",
    timestamp: "3 hours ago",
    priority: "medium",
    contact: "email"
  }
]

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'booking_inquiry':
    case 'booking_change':
      return Calendar
    case 'complaint':
      return MessageSquare
    default:
      return Mail
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

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-800'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800'
    case 'low':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getTypeColor = (type: string) => {
  switch (type) {
    case 'booking_inquiry':
      return 'bg-blue-100 text-blue-800'
    case 'booking_change':
      return 'bg-purple-100 text-purple-800'
    case 'complaint':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function CustomerRequests() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Customer Requests</CardTitle>
        <CardDescription>
          Latest inquiries and requests from customers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {requests.map((request) => {
            const TypeIcon = getTypeIcon(request.type)
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
                      <TypeIcon className="h-3 w-3" />
                      <Badge className={getTypeColor(request.type)} variant="outline">
                        {request.type.replace('_', ' ')}
                      </Badge>
                    </div>
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
  )
}