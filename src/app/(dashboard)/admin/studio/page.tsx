"use client"

import React, { useState } from "react"
import { Building2, MapPin, Phone, Mail, Clock, Plus, Edit, Trash, Eye, MoreHorizontal, Settings, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Mock data - replace with actual data from your API
const mockStudios = [
  {
    id: "1",
    name: "Lumina Photography Studio",
    address: "Jl. Sudirman No. 123, Jakarta Selatan",
    phone: "+62 21 1234-5678",
    email: "info@lumina.studio",
    description: "Studio fotografi profesional dengan peralatan lengkap",
    status: "active",
    owner: "John Doe",
    established: "2020-01-15",
    facilitiesCount: 5,
    activeBookings: 12,
    totalRevenue: 45000000,
    rating: 4.8,
    operatingHours: "09:00 - 21:00",
    image: "/placeholder-studio.jpg"
  },
  {
    id: "2", 
    name: "Creative Photo Lab",
    address: "Jl. Thamrin No. 456, Jakarta Pusat",
    phone: "+62 21 8765-4321",
    email: "contact@creativelab.studio",
    description: "Studio kreatif untuk berbagai kebutuhan fotografi",
    status: "active",
    owner: "Jane Smith",
    established: "2019-06-20",
    facilitiesCount: 3,
    activeBookings: 8,
    totalRevenue: 32000000,
    rating: 4.6,
    operatingHours: "10:00 - 20:00",
    image: "/placeholder-studio.jpg"
  }
]

export default function StudioManagementPage() {
  const [studios] = useState(mockStudios)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default'
      case 'inactive':
        return 'secondary'
      case 'maintenance':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Aktif'
      case 'inactive':
        return 'Tidak Aktif'
      case 'maintenance':
        return 'Maintenance'
      default:
        return status
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Studio Management</h2>
          <p className="text-muted-foreground">
            Kelola semua studio foto yang terdaftar dalam sistem
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Studio
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Studios</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studios.length}</div>
            <p className="text-xs text-muted-foreground">
              {studios.filter(s => s.status === 'active').length} aktif
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Facilities</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {studios.reduce((sum, studio) => sum + studio.facilitiesCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all studios
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {studios.reduce((sum, studio) => sum + studio.activeBookings, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Current reservations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(studios.reduce((sum, studio) => sum + studio.totalRevenue, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              All time revenue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Studios Table */}
      <Card>
        <CardHeader>
          <CardTitle>Studios</CardTitle>
          <CardDescription>
            Daftar semua studio foto yang terdaftar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Studio</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Facilities</TableHead>
                  <TableHead>Bookings</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studios.map((studio) => (
                  <TableRow key={studio.id}>
                    <TableCell>
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={studio.image} />
                          <AvatarFallback>
                            {studio.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{studio.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Owner: {studio.owner}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Est. {formatDate(studio.established)}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span className="truncate max-w-[200px]">{studio.address}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Phone className="h-3 w-3 mr-1" />
                          {studio.phone}
                        </div>
                        <div className="flex items-center text-sm">
                          <Mail className="h-3 w-3 mr-1" />
                          {studio.email}
                        </div>
                        <div className="flex items-center text-sm">
                          <Clock className="h-3 w-3 mr-1" />
                          {studio.operatingHours}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(studio.status)}>
                        {getStatusLabel(studio.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <div className="font-medium">{studio.facilitiesCount}</div>
                        <div className="text-xs text-muted-foreground">facilities</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <div className="font-medium">{studio.activeBookings}</div>
                        <div className="text-xs text-muted-foreground">active</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {formatCurrency(studio.totalRevenue)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <div className="font-medium">⭐ {studio.rating}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Studio
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Settings className="mr-2 h-4 w-4" />
                            Manage Facilities
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash className="mr-2 h-4 w-4" />
                            Delete Studio
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}