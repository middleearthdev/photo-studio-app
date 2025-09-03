"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  MessageSquare,
  Users,
  Calendar,
  Settings,
  LogOut,
  HeadphonesIcon,
  Menu,
  X,
  Phone,
  Mail,
  AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuthStore } from "@/stores/auth-store"
import { signOutAction } from "@/actions/auth"
import { toast } from "sonner"

const navigation = [
  { name: "Dashboard", href: "/customer-service", icon: MessageSquare },
  { name: "Active Tickets", href: "/customer-service/tickets", icon: AlertCircle },
  { name: "Customer Inquiries", href: "/customer-service/inquiries", icon: Mail },
  { name: "Booking Support", href: "/customer-service/bookings", icon: Calendar },
  { name: "Customer Database", href: "/customer-service/customers", icon: Users },
  { name: "Live Chat", href: "/customer-service/chat", icon: Phone },
  { name: "Settings", href: "/customer-service/settings", icon: Settings },
]

interface CustomerServiceLayoutProps {
  children: React.ReactNode
}

export function CustomerServiceLayout({ children }: CustomerServiceLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const { profile } = useAuthStore()

  const handleSignOut = async () => {
    try {
      const result = await signOutAction()
      if (result.success) {
        toast.success("Logout berhasil")
        window.location.href = "/staff/login"
      } else {
        toast.error("Gagal logout")
      }
    } catch (error) {
      toast.error("Terjadi kesalahan")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Mobile sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 bg-orange-600">
          <div className="flex items-center space-x-3">
            <HeadphonesIcon className="h-8 w-8 text-white" />
            <div className="text-white">
              <span className="text-xl font-bold">Customer Service</span>
              <p className="text-sm text-orange-100">Support Portal</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-white hover:bg-orange-700"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-orange-50 text-orange-700 border-r-2 border-orange-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url || ""} />
                  <AvatarFallback className="bg-orange-100 text-orange-700">
                    {profile?.full_name?.charAt(0) || "CS"}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {profile?.full_name || "Customer Service"}
                  </p>
                  <p className="text-xs text-gray-500">Support Agent</p>
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/customer-service/profile">
                  <Users className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/customer-service/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-64">
        <div className="sticky top-0 z-10 bg-white shadow-sm border-b border-gray-200 lg:hidden">
          <div className="flex items-center justify-between h-16 px-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">
              {navigation.find(item => item.href === pathname)?.name || "Customer Service"}
            </h1>
            <div className="w-10" /> {/* Spacer */}
          </div>
        </div>

        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}