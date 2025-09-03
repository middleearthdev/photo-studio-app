// 🗂️ ADMIN ROUTES STRUCTURE - STUDIO FOTO

// ================================
// FOLDER STRUCTURE APP ROUTER
// ================================

/_
src/app/
├── (auth)/ # Auth group routes
│ ├── login/page.tsx
│ └── register/page.tsx
├── (public)/ # Public pages
│ ├── page.tsx # Homepage
│ ├── portfolio/page.tsx
│ ├── packages/page.tsx
│ └── about/page.tsx
├── (dashboard)/ # Protected dashboard routes
│ ├── admin/ # Studio Owner/Admin only
│ │ ├── layout.tsx # Admin sidebar layout
│ │ ├── page.tsx # Dashboard redirect
│ │ ├── dashboard/page.tsx # Main admin dashboard
│ │ ├── studio/ # Studio Management
│ │ │ ├── page.tsx # Studio info & settings
│ │ │ ├── facilities/page.tsx # Manage facilities
│ │ │ └── staff/page.tsx # Staff management
│ │ ├── time-slots/ # Time Slots Management
│ │ │ ├── page.tsx # Calendar view
│ │ │ ├── generate/page.tsx # Bulk generate slots
│ │ │ └── blackout/page.tsx # Holiday/blackout dates
│ │ ├── portfolio/ # Portfolio Management
│ │ │ ├── page.tsx # Gallery management
│ │ │ ├── categories/page.tsx # Manage categories
│ │ │ ├── upload/page.tsx # Bulk upload
│ │ │ └── [id]/page.tsx # Edit specific portfolio
│ │ ├── packages/ # Package Management
│ │ │ ├── page.tsx # Package list
│ │ │ ├── create/page.tsx # Create new package
│ │ │ ├── categories/page.tsx # Package categories
│ │ │ ├── addons/page.tsx # Add-ons management
│ │ │ └── [id]/edit/page.tsx # Edit specific package
│ │ ├── reservations/ # Reservation Management
│ │ │ ├── page.tsx # All reservations
│ │ │ ├── calendar/page.tsx # Calendar view
│ │ │ ├── [id]/page.tsx # Reservation details
│ │ │ └── [id]/edit/page.tsx # Edit reservation
│ │ ├── customers/ # Customer Management
│ │ │ ├── page.tsx # Customer list
│ │ │ ├── [id]/page.tsx # Customer profile
│ │ │ └── [id]/history/page.tsx # Customer booking history
│ │ ├── payments/ # Payment & Finance
│ │ │ ├── page.tsx # Payment overview
│ │ │ ├── pending/page.tsx # Pending verifications
│ │ │ ├── verified/page.tsx # Verified payments
│ │ │ ├── refunds/page.tsx # Refund requests
│ │ │ ├── methods/page.tsx # Payment methods config
│ │ │ └── [id]/page.tsx # Payment details
│ │ ├── reviews/ # Review Management
│ │ │ ├── page.tsx # All reviews
│ │ │ ├── published/page.tsx # Published reviews
│ │ │ ├── pending/page.tsx # Pending moderation
│ │ │ └── [id]/page.tsx # Review details
│ │ ├── analytics/ # Analytics
│ │ │ ├── page.tsx # Main analytics
│ │ │ ├── revenue/page.tsx # Revenue analytics
│ │ │ ├── bookings/page.tsx # Booking analytics
│ │ │ ├── customers/page.tsx # Customer analytics
│ │ │ └── performance/page.tsx # Studio performance
│ │ ├── reports/ # Reports
│ │ │ ├── page.tsx # Report dashboard
│ │ │ ├── financial/page.tsx # Financial reports
│ │ │ ├── operational/page.tsx # Operational reports
│ │ │ ├── customer/page.tsx # Customer reports
│ │ │ └── export/page.tsx # Export utilities
│ │ └── settings/ # Settings
│ │ ├── page.tsx # General settings
│ │ ├── business/page.tsx # Business rules
│ │ ├── notifications/page.tsx # Notification settings
│ │ ├── integrations/page.tsx # Third-party integrations
│ │ ├── promotions/page.tsx # Promotions & discounts
│ │ └── security/page.tsx # Security settings
│ ├── cs/ # Customer Service only
│ │ ├── layout.tsx
│ │ ├── page.tsx # CS dashboard
│ │ ├── tickets/ # Support tickets
│ │ │ ├── page.tsx # All tickets
│ │ │ ├── open/page.tsx # Open tickets
│ │ │ ├── [id]/page.tsx # Ticket details
│ │ │ └── create/page.tsx # Create ticket
│ │ ├── bookings/ # Booking assistance
│ │ │ ├── page.tsx # Booking management
│ │ │ ├── create/page.tsx # Create for customer
│ │ │ └── [id]/modify/page.tsx # Modify booking
│ │ ├── customers/ # Customer support
│ │ │ ├── page.tsx # Customer search
│ │ │ ├── [id]/page.tsx # Customer profile
│ │ │ └── [id]/communication/page.tsx # Communication history
│ │ └── communications/ # Notifications
│ │ ├── page.tsx # Send notifications
│ │ ├── templates/page.tsx # Message templates
│ │ └── history/page.tsx # Communication history
│  
├── booking/ # Public booking flow
│ ├── page.tsx # Select date & time
│ ├── packages/page.tsx # Select package
│ ├── addons/page.tsx # Select add-ons
│ ├── confirm/page.tsx # Confirm booking
│ └── payment/page.tsx # Payment page
├── api/ # API routes
│ ├── auth/
│ ├── public/ # Public APIs
│ ├── customer/ # Customer APIs
│ ├── staff/ # Staff APIs
│ ├── cs/ # Customer Service APIs
│ ├── admin/ # Admin APIs
│ └── webhooks/ # Payment webhooks
_/

// ================================
// ROUTE PERMISSIONS MAPPING
// ================================

export const routePermissions = {
// Public routes (no auth required)
public: [
'/',
'/portfolio',
'/packages',
'/about',
'/contact',
'/login',
'/register'
],

// Customer Service routes
customer_service: [
'/cs',
'/cs/tickets',
'/cs/tickets/[id]',
'/cs/bookings',
'/cs/customers',
'/cs/customers/[id]',
'/cs/communications'
],

// Admin routes (Studio Owner/Admin)
admin: [
'/admin',
'/admin/dashboard',
'/admin/studio',
'/admin/studio/facilities',
'/admin/time-slots',
'/admin/portfolio',
'/admin/packages',
'/admin/reservations',
'/admin/customers',
'/admin/payments',
'/admin/reviews',
'/admin/analytics',
'/admin/reports',
'/admin/settings'
]
};

// ================================
// NAVIGATION MENU CONFIGURATION
// ================================

export const navigationMenus = {
admin: {
sections: [
{
title: "Studio Management",
items: [
{
title: "Dashboard",
href: "/admin/dashboard",
icon: "LayoutDashboard",
description: "Overview statistik dan aktivitas studio"
},
{
title: "Studio Management",
href: "/admin/studio",
icon: "Building2",
description: "Kelola informasi dan pengaturan studio"
},
{
title: "Facilities",
href: "/admin/studio/facilities",
icon: "Camera",
description: "Kelola fasilitas yang tersedia"
},
{
title: "Time Slots",
href: "/admin/time-slots",
icon: "Clock",
description: "Kelola jadwal dan ketersediaan waktu"
},
{
title: "Portfolio",
href: "/admin/portfolio",
icon: "Image",
description: "Kelola galeri foto dan portfolio"
},
{
title: "Packages",
href: "/admin/packages",
icon: "Package",
description: "Kelola paket foto dan add-ons"
}
]
},
{
title: "Business Operations",
items: [
{
title: "Reservations",
href: "/admin/reservations",
icon: "Calendar",
description: "Kelola semua reservasi dan booking",
badge: "pending_count" // Dynamic badge
},
{
title: "Customers",
href: "/admin/customers",
icon: "Users",
description: "Database dan profil customer"
},
{
title: "Payments & Finance",
href: "/admin/payments",
icon: "DollarSign",
description: "Verifikasi pembayaran dan keuangan",
badge: "pending_payments"
},
{
title: "Reviews",
href: "/admin/reviews",
icon: "Star",
description: "Moderasi review dan rating"
}
]
},
{
title: "Reports & Settings",
items: [
{
title: "Analytics",
href: "/admin/analytics",
icon: "BarChart3",
description: "Analisis performa dan insights"
},
{
title: "Reports",
href: "/admin/reports",
icon: "FileText",
description: "Laporan keuangan dan operasional"
},
{
title: "Settings",
href: "/admin/settings",
icon: "Settings",
description: "Pengaturan sistem dan bisnis"
}
]
}
]
},

customer_service: {
sections: [
{
title: "Customer Support",
items: [
{
title: "Support Tickets",
href: "/cs/tickets",
icon: "MessageSquare",
description: "Handle customer inquiries",
badge: "open_tickets"
},
{
title: "Booking Assistance",
href: "/cs/bookings",
icon: "Calendar",
description: "Bantu customer dengan booking"
},
{
title: "Customer Database",
href: "/cs/customers",
icon: "Users",
description: "Cari dan kelola data customer"
}
]
},
{
title: "Communication",
items: [
{
title: "Send Notifications",
href: "/cs/communications",
icon: "Bell",
description: "Kirim notifikasi manual"
},
{
title: "Message Templates",
href: "/cs/communications/templates",
icon: "FileText",
description: "Template pesan otomatis"
}
]
}
]
},
};
