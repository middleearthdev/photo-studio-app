"use client"

import React from "react"
import { usePathname } from "next/navigation"
import { ProgressLink } from "@/components/ui/progress-link"
import {
  Building2,
  Calendar,
  LayoutDashboard,
  Package,
  Settings,
  Users,
  Camera,
  DollarSign,
  BarChart3,
  Shield,
  Bell,
  LogOut,
  ChevronDown,
  Clock,
  Image,
  FileText,
  User,
  Tag,
  Monitor,
  Images,
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
import { NavigationProgress } from "@/components/ui/navigation-progress"
import { useProfile } from "@/hooks/use-profile"
import { signOutAction } from "@/actions/auth"
import { toast } from "sonner"
import { useAuthStore } from "@/stores/auth-store"

interface AdminLayoutProps {
  children: React.ReactNode
}



const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/admin/dashboard",
  },
  {
    title: "Studio Management",
    icon: Building2,
    href: "/admin/studio",
  },
  {
    title: "User Management",
    icon: Users,
    href: "/admin/users",
  },
  {
    title: "Facilities",
    icon: Camera,
    href: "/admin/facilities",
  },
  {
    title: "Time Slots",
    icon: Clock,
    href: "/admin/time-slots",
  },
  {
    title: "Portfolio",
    icon: Image,
    href: "/admin/portfolio",
  },
  {
    title: "Hero Images",
    icon: Images,
    href: "/admin/hero-images",
  },
  {
    title: "Packages",
    icon: Package,
    href: "/admin/packages",
  },
  {
    title: "Discounts",
    icon: Tag,
    href: "/admin/discounts",
  },
  {
    title: "Reservations",
    icon: Calendar,
    href: "/admin/reservations",
  },
  {
    title: "Customers",
    icon: Users,
    href: "/admin/customers",
  },
  {
    title: "Payments & Finance",
    icon: DollarSign,
    href: "/admin/payments",
  },

  {
    title: "Analytics",
    icon: BarChart3,
    href: "/admin/analytics",
  },
  {
    title: "Reports",
    icon: FileText,
    href: "/admin/reports",
  },
  {
    title: "Settings",
    icon: Settings,
    href: "/admin/settings",
  },
]

export default function AdminLayout({ children }: AdminLayoutProps) {
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
    <>
      <NavigationProgress />
      <SidebarProvider>
        <Sidebar variant="inset">
          <SidebarHeader>
            <div className="flex items-center gap-2 px-4 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Shield className="h-4 w-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Studio Admin</span>
                <span className="truncate text-xs text-muted-foreground">
                  Studio Owner/Admin
                </span>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Studio Management</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.slice(0, 9).map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                      >
                        <ProgressLink href={item.href}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </ProgressLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Business Operations</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.slice(9, 12).map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                      >
                        <ProgressLink href={item.href}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </ProgressLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Reports & Settings</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.slice(12).map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                      >
                        <ProgressLink href={item.href}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </ProgressLink>
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
                        <AvatarImage src={profile?.avatar_url || ""} alt={profile?.full_name || "Admin"} />
                        <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                          {profile?.full_name?.charAt(0) || "A"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">
                          {profile?.full_name || "Admin"}
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
                          <AvatarImage src={profile?.avatar_url || ""} alt={profile?.full_name || "Admin"} />
                          <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                            {profile?.full_name?.charAt(0) || "A"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                          <span className="truncate font-semibold">
                            {profile?.full_name || "Admin"}
                          </span>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <ProgressLink href="/admin/profile">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </ProgressLink>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <ProgressLink href="/admin/settings">
                        <Settings className="mr-2 h-4 w-4" />
                        Account Settings
                      </ProgressLink>
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
                  {menuItems.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))?.title || "Dashboard"}
                </h1>
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
    </>
  )
}