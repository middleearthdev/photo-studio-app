export type ContactMethod = 'phone' | 'email' | 'chat' | 'whatsapp'
export type CustomerStatus = 'active' | 'inactive' | 'vip' | 'blocked'
export type CommunicationType = 'email' | 'sms' | 'call' | 'chat' | 'whatsapp'
export type ReviewStatus = 'pending' | 'published' | 'hidden'

// Enhanced Customer interface
export interface Customer {
  id: string
  full_name: string
  email: string
  phone?: string
  address?: string
  birth_date?: string
  avatar_url?: string
  status: CustomerStatus
  customer_since: string
  total_bookings: number
  total_spent: number
  last_booking?: string
  preferences?: Record<string, unknown>
  tags?: string[]
  notes?: string
  created_at: string
  updated_at: string
  
  // Relations
  bookings?: Array<{
    id: string
    booking_date: string
    package_name: string
    total_amount: number
    status: string
  }>
  reviews?: Array<{
    id: string
    rating: number
    comment: string
    created_at: string
  }>
}

export interface CustomerFilter {
  status?: CustomerStatus[]
  customer_since_from?: string
  customer_since_to?: string
  total_spent_min?: number
  total_spent_max?: number
  tags?: string[]
  search?: string
}

export interface CustomerServiceStats {
  total_customers: number
  active_customers: number
  new_customers_today: number
  active_chats: number
  avg_response_time: number
  customer_satisfaction: number
  reviews_pending: number
}

export interface MessageTemplate {
  id: string
  title: string
  content: string
  category: string
  variables?: string[]
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export interface CommunicationLog {
  id: string
  customer_id: string
  staff_id: string
  type: CommunicationType
  subject?: string
  content: string
  status: 'sent' | 'delivered' | 'read' | 'failed'
  sent_at: string
  
  // Relations
  customer?: {
    id: string
    full_name: string
    email: string
    phone?: string
  }
  staff?: {
    id: string
    full_name: string
    email: string
  }
}

// Customer Review interface
export interface CustomerReview {
  id: string
  customer_id: string
  booking_id?: string
  rating: number
  comment: string
  status: ReviewStatus
  staff_response?: string
  responded_by?: string
  responded_at?: string
  helpful_count: number
  created_at: string
  updated_at: string
  
  // Relations
  customer?: {
    id: string
    full_name: string
    email: string
    avatar_url?: string
  }
  booking?: {
    id: string
    booking_date: string
    package_name: string
  }
  staff_responder?: {
    id: string
    full_name: string
  }
}

export interface ChatSession {
  id: string
  customer_id: string
  staff_id?: string
  status: 'waiting' | 'active' | 'ended'
  started_at: string
  ended_at?: string
  
  // Relations
  customer?: {
    id: string
    full_name: string
    email: string
    avatar_url?: string
  }
  staff?: {
    id: string
    full_name: string
    avatar_url?: string
  }
  messages?: ChatMessage[]
}

export interface ChatMessage {
  id: string
  session_id: string
  sender_id: string
  sender_type: 'customer' | 'staff'
  message: string
  message_type: 'text' | 'image' | 'file'
  file_url?: string
  sent_at: string
  read_at?: string
}

export interface KnowledgeBaseArticle {
  id: string
  title: string
  content: string
  summary?: string
  category_id: string
  tags?: string[]
  is_published: boolean
  view_count: number
  helpful_count: number
  not_helpful_count: number
  created_by: string
  created_at: string
  updated_at: string
  
  // Relations
  category?: {
    id: string
    name: string
    description?: string
  }
  author?: {
    id: string
    full_name: string
  }
}

export interface FAQ {
  id: string
  question: string
  answer: string
  category_id: string
  order_index: number
  is_active: boolean
  view_count: number
  helpful_count: number
  created_at: string
  updated_at: string
}

export interface CSAnalytics {
  period: 'day' | 'week' | 'month' | 'year'
  total_customers: number
  new_customers: number
  active_chats: number
  avg_response_time: number
  customer_satisfaction: number
  reviews_received: number
  staff_performance: Array<{
    staff_id: string
    full_name: string
    chats_handled: number
    avg_response_time: number
    customer_rating: number
  }>
  customer_trends: Array<{
    date: string
    new_customers: number
    active_customers: number
  }>
  communication_breakdown: Array<{
    type: CommunicationType
    count: number
    percentage: number
  }>
  review_trends: Array<{
    date: string
    rating: number
    count: number
  }>
}

export interface BookingAssistance {
  id: string
  customer_id: string
  booking_id?: string
  assistance_type: 'modification' | 'cancellation' | 'inquiry' | 'technical_support'
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assigned_to?: string
  created_at: string
  updated_at: string
  
  // Relations
  customer?: {
    id: string
    full_name: string
    email: string
    phone?: string
  }
  booking?: {
    id: string
    booking_date: string
    session_time: string
    package_name: string
    status: string
  }
  assigned_staff?: {
    id: string
    full_name: string
  }
}