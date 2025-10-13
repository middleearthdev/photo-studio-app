"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Calendar,
  Bell,
  LogOut,
  HeadphonesIcon,
  ChevronDown,
  DollarSign,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { signOutAction } from "@/actions/auth"
import { toast } from "sonner"
import { RemindersNotification } from "@/components/cs/reminders-notification"
import { useAuthStore } from "@/stores/auth-store"

interface CSLayoutProps {
  children: React.ReactNode
}

const menuItems = [
  {
    title: "Reminders",
    icon: Bell,
    href: "/cs/reminders",
  },
  {
    title: "Booking Management",
    icon: Calendar,
    href: "/cs/reservations",
  },
  {
    title: "Payment History",
    icon: DollarSign,
    href: "/cs/payments",
  }
]

export default function CSLayout({ children }: CSLayoutProps) {
  const pathname = usePathname()
  const { profile } = useAuthStore()


  const handleSignOut = async () => {
    try {
      await signOutAction()
      // signOutAction redirects automatically, no need for additional handling
    } catch (error) {
      toast.error("Terjadi kesalahan saat logout")
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
            <SidebarGroupLabel>Operations & Approvals</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => (
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
                      </div>
                    </div>
                  </DropdownMenuLabel>
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
              <RemindersNotification />

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
                    CS Portal
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