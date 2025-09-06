"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Star,
  MoreHorizontal,
  Eye,
  MessageSquare,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  Camera,
  Search,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Review {
  id: string
  customer: {
    name: string
    email: string
    avatar?: string
  }
  reservation: {
    booking_code: string
    package_name: string
    date: string
  }
  rating: number
  title: string
  comment: string
  photos?: string[]
  is_featured: boolean
  is_approved: boolean
  reply_text?: string
  replied_at?: string
  created_at: string
}

// Mock data - replace with actual data fetching
const mockReviews: Review[] = [
  {
    id: "1",
    customer: {
      name: "Sarah Johnson",
      email: "sarah@example.com",
      avatar: "/avatars/sarah.jpg"
    },
    reservation: {
      booking_code: "BK001",
      package_name: "Pre-Wedding Classic",
      date: "2025-08-15"
    },
    rating: 5,
    title: "Absolutely Amazing Experience!",
    comment: "The team was incredibly professional and the photos turned out beyond our expectations. The studio setup was perfect and they made us feel comfortable throughout the session.",
    photos: ["/reviews/1-1.jpg", "/reviews/1-2.jpg"],
    is_featured: true,
    is_approved: true,
    reply_text: "Thank you so much Sarah! We're thrilled you loved your pre-wedding session.",
    replied_at: "2025-08-16T10:00:00Z",
    created_at: "2025-08-16T09:00:00Z"
  },
  {
    id: "2", 
    customer: {
      name: "Michael Chen",
      email: "michael@example.com"
    },
    reservation: {
      booking_code: "BK002",
      package_name: "Professional Headshots",
      date: "2025-08-20"
    },
    rating: 4,
    title: "Great Professional Service",
    comment: "Very professional service for my LinkedIn headshots. The makeup artist was skilled and the photographer gave great direction.",
    is_featured: false,
    is_approved: true,
    created_at: "2025-08-21T14:30:00Z"
  },
  {
    id: "3",
    customer: {
      name: "Lisa Wang",
      email: "lisa@example.com"
    },
    reservation: {
      booking_code: "BK003", 
      package_name: "Family Package",
      date: "2025-08-25"
    },
    rating: 5,
    title: "Perfect Family Photos",
    comment: "They were amazing with our kids and got some beautiful natural shots. The outdoor garden setting was perfect for our family photos.",
    is_featured: false,
    is_approved: false,
    created_at: "2025-08-26T16:00:00Z"
  }
]

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>(mockReviews)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [ratingFilter, setRatingFilter] = useState("all")
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [replyText, setReplyText] = useState("")
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false)

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
        }`}
      />
    ))
  }

  const filteredReviews = reviews.filter((review) => {
    const matchesSearch = review.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.reservation.booking_code.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "approved" && review.is_approved) ||
      (statusFilter === "pending" && !review.is_approved) ||
      (statusFilter === "featured" && review.is_featured)
    
    const matchesRating = ratingFilter === "all" || review.rating === parseInt(ratingFilter)
    
    return matchesSearch && matchesStatus && matchesRating
  })

  const handleApprove = (reviewId: string) => {
    setReviews(reviews.map(review => 
      review.id === reviewId ? { ...review, is_approved: true } : review
    ))
  }

  const handleReject = (reviewId: string) => {
    setReviews(reviews.map(review => 
      review.id === reviewId ? { ...review, is_approved: false } : review
    ))
  }

  const handleFeature = (reviewId: string) => {
    setReviews(reviews.map(review => 
      review.id === reviewId ? { ...review, is_featured: !review.is_featured } : review
    ))
  }

  const handleReply = () => {
    if (selectedReview && replyText.trim()) {
      setReviews(reviews.map(review => 
        review.id === selectedReview.id 
          ? { ...review, reply_text: replyText, replied_at: new Date().toISOString() } 
          : review
      ))
      setReplyText("")
      setIsReplyDialogOpen(false)
      setSelectedReview(null)
    }
  }

  const openReplyDialog = (review: Review) => {
    setSelectedReview(review)
    setReplyText(review.reply_text || "")
    setIsReplyDialogOpen(true)
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reviews Management</h1>
          <p className="text-muted-foreground">
            Manage customer reviews and feedback
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reviews.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length).toFixed(1)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reviews.filter(r => r.is_approved).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Featured</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reviews.filter(r => r.is_featured).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reviews..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="featured">Featured</SelectItem>
              </SelectContent>
            </Select>
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="5">5 Stars</SelectItem>
                <SelectItem value="4">4 Stars</SelectItem>
                <SelectItem value="3">3 Stars</SelectItem>
                <SelectItem value="2">2 Stars</SelectItem>
                <SelectItem value="1">1 Star</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reviews Table */}
      <Card>
        <CardHeader>
          <CardTitle>Reviews</CardTitle>
          <CardDescription>
            Manage customer reviews and feedback
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Reservation</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Review</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReviews.map((review) => (
                <TableRow key={review.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={review.customer.avatar} />
                        <AvatarFallback>
                          {review.customer.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{review.customer.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {review.customer.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{review.reservation.booking_code}</div>
                      <div className="text-sm text-muted-foreground">
                        {review.reservation.package_name}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {renderStars(review.rating)}
                      <span className="ml-1 text-sm">({review.rating})</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div>
                      <div className="font-medium text-sm">{review.title}</div>
                      <div className="text-sm text-muted-foreground truncate">
                        {review.comment}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge variant={review.is_approved ? "default" : "secondary"}>
                        {review.is_approved ? "Approved" : "Pending"}
                      </Badge>
                      {review.is_featured && (
                        <Badge variant="outline" className="text-yellow-600">
                          Featured
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(review.created_at).toLocaleDateString()}
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
                        <DropdownMenuItem onClick={() => openReplyDialog(review)}>
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Reply
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {!review.is_approved && (
                          <DropdownMenuItem onClick={() => handleApprove(review.id)}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Approve
                          </DropdownMenuItem>
                        )}
                        {review.is_approved && (
                          <DropdownMenuItem onClick={() => handleReject(review.id)}>
                            <XCircle className="mr-2 h-4 w-4" />
                            Unapprove
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleFeature(review.id)}>
                          <Star className="mr-2 h-4 w-4" />
                          {review.is_featured ? "Unfeature" : "Feature"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Reply Dialog */}
      <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Reply to Review</DialogTitle>
            <DialogDescription>
              Reply to {selectedReview?.customer.name}'s review
            </DialogDescription>
          </DialogHeader>
          
          {selectedReview && (
            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-1 mb-2">
                  {renderStars(selectedReview.rating)}
                </div>
                <h4 className="font-semibold">{selectedReview.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedReview.comment}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium">Your Reply</label>
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write your reply to this review..."
                  rows={4}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReplyDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReply} disabled={!replyText.trim()}>
              Send Reply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}