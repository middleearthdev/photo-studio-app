"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  MessageSquare,
  Calendar,
  Users,
  Bell,
  FileText,
  LogOut,
  HeadphonesIcon,
  Settings,
  ChevronDown,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/stores/auth-store"
import { signOutAction } from "@/actions/auth"
import { toast } from "sonner"

interface CSLayoutProps {
  children: React.ReactNode
}

const menuItems = [
  {
    title: "Dashboard",
    icon: MessageSquare,
    href: "/cs",
  },
  {
    title: "Support Tickets",
    icon: MessageSquare,
    href: "/cs/tickets",
  },
  {
    title: "Booking Assistance",
    icon: Calendar,
    href: "/cs/bookings",
  },
  {
    title: "Customer Database",
    icon: Users,
    href: "/cs/customers",
  },
  {
    title: "Send Notifications",
    icon: Bell,
    href: "/cs/communications",
  },
  {
    title: "Message Templates",
    icon: FileText,
    href: "/cs/communications/templates",
  },
]

export default function CSLayout({ children }: CSLayoutProps) {
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
    <SidebarProvider>
      <Sidebar variant="inset">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-4 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-600 text-white">
              <HeadphonesIcon className="h-4 w-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">Customer Service</span>
              <span className="truncate text-xs text-muted-foreground">
                Support Portal
              </span>
            </div>
          </div>
        </SidebarHeader>
        
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Customer Support</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.slice(0, 4).map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                    >
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          
          <SidebarGroup>
            <SidebarGroupLabel>Communication</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.slice(4).map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                    >
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={profile?.avatar_url || ""} alt={profile?.full_name || "CS"} />
                      <AvatarFallback className="rounded-lg bg-orange-100 text-orange-700">
                        {profile?.full_name?.charAt(0) || "CS"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {profile?.full_name || "Customer Service"}
                      </span>
                      <span className="truncate text-xs">
                        {profile?.email || "cs@studio.com"}
                      </span>
                    </div>
                    <ChevronDown className="ml-auto size-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                  side="bottom"
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                      <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarImage src={profile?.avatar_url || ""} alt={profile?.full_name || "CS"} />
                        <AvatarFallback className="rounded-lg bg-orange-100 text-orange-700">
                          {profile?.full_name?.charAt(0) || "CS"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">
                          {profile?.full_name || "Customer Service"}
                        </span>
                        <span className="truncate text-xs">
                          {profile?.email || "cs@studio.com"}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/cs/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      Account Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Bell className="mr-2 h-4 w-4" />
                    Notifications
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600" onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex flex-1 items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">
                {menuItems.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))?.title || "Customer Service"}
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" className="relative">
                <Bell className="h-4 w-4" />
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
                >
                  5
                </Badge>
              </Button>
              
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url || ""} alt={profile?.full_name || "CS"} />
                  <AvatarFallback className="bg-orange-100 text-orange-700">
                    {profile?.full_name?.charAt(0) || "CS"}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <div className="text-sm font-medium">
                    {profile?.full_name || "Customer Service"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {profile?.email || "cs@studio.com"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>
        
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}