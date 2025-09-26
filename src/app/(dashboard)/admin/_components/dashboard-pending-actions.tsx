"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { usePendingActions } from "@/hooks/use-dashboard-analytics"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  AlertCircle, 
  DollarSign, 
  Star, 
  Calendar, 
  Users,
  ArrowRight,
  CheckCircle
} from "lucide-react"
import Link from "next/link"

interface PendingActionsProps {
  studioId?: string
}

const getActionIcon = (type: string) => {
  switch (type) {
    case 'payment':
      return DollarSign
    case 'review':
      return Star
    case 'booking':
      return Calendar
    case 'customer':
      return Users
    default:
      return AlertCircle
  }
}

const getActionColor = (type: string, urgent: boolean) => {
  if (urgent) {
    return {
      bg: 'bg-red-100 hover:bg-red-200',
      border: 'border-red-200',
      icon: 'bg-red-100 text-red-600',
      badge: 'bg-red-100 text-red-800',
      text: 'text-red-900'
    }
  }
  
  switch (type) {
    case 'payment':
      return {
        bg: 'bg-yellow-50 hover:bg-yellow-100',
        border: 'border-yellow-200',
        icon: 'bg-yellow-100 text-yellow-600',
        badge: 'bg-yellow-100 text-yellow-800',
        text: 'text-yellow-900'
      }
    case 'review':
      return {
        bg: 'bg-purple-50 hover:bg-purple-100',
        border: 'border-purple-200',
        icon: 'bg-purple-100 text-purple-600',
        badge: 'bg-purple-100 text-purple-800',
        text: 'text-purple-900'
      }
    case 'booking':
      return {
        bg: 'bg-blue-50 hover:bg-blue-100',
        border: 'border-blue-200',
        icon: 'bg-blue-100 text-blue-600',
        badge: 'bg-blue-100 text-blue-800',
        text: 'text-blue-900'
      }
    default:
      return {
        bg: 'bg-gray-50 hover:bg-gray-100',
        border: 'border-gray-200',
        icon: 'bg-gray-100 text-gray-600',
        badge: 'bg-gray-100 text-gray-800',
        text: 'text-gray-900'
      }
  }
}

export function PendingActions({ studioId }: PendingActionsProps) {
  const { data: actions, isLoading, error } = usePendingActions(studioId)

  if (isLoading) {
    return (
      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>Pending Actions</CardTitle>
          <CardDescription>Items that require your attention</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
                <Skeleton className="h-6 w-8 rounded-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="col-span-3 border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Pending Actions</CardTitle>
          <CardDescription>Unable to load pending actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-600">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">Error loading pending actions</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!actions || actions.length === 0) {
    return (
      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>Pending Actions</CardTitle>
          <CardDescription>Items that require your attention</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50 text-green-500" />
            <p className="text-lg font-medium mb-1">All Clear!</p>
            <p className="text-sm">No pending actions require your attention right now.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Pending Actions
          {actions.some(a => a.urgent) && (
            <div className="flex h-2 w-2 items-center justify-center">
              <div className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-red-400 opacity-75"></div>
              <div className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></div>
            </div>
          )}
        </CardTitle>
        <CardDescription>
          {actions.length} items require your attention
          {actions.some(a => a.urgent) && (
            <span className="text-red-600 font-medium"> • Urgent items present</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {actions.map((action) => {
            const Icon = getActionIcon(action.type)
            const colors = getActionColor(action.type, action.urgent)
            
            return (
              <Link 
                key={`${action.type}-${action.title}`}
                href={action.href}
                className="block group"
              >
                <div 
                  className={`
                    flex items-center justify-between p-3 border rounded-lg 
                    transition-all duration-200 cursor-pointer
                    ${colors.bg} ${colors.border}
                    group-hover:shadow-md
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${colors.icon} group-hover:scale-105 transition-transform`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className={`font-medium text-sm ${colors.text}`}>
                        {action.title}
                        {action.urgent && (
                          <span className="ml-2 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">
                            URGENT
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {action.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className={`
                      px-2 py-1 text-xs font-medium rounded-full min-w-[24px] text-center
                      ${colors.badge}
                    `}>
                      {action.count}
                    </div>
                    <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-current transition-colors" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}