"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Settings,
  User,
  Bell,
  Shield,
  Database,
  Mail,
  Smartphone,
  DollarSign,
  Camera,
  Palette,
  Globe,
  Key,
  Download,
  Upload,
  Trash2,
  Save,
  Calendar,
} from "lucide-react"
import { toast } from "sonner"

interface SystemSettings {
  booking_settings: {
    auto_confirm: boolean
    require_dp: boolean
    dp_percentage: number
    advance_booking_days: number
    cancellation_hours: number
  }
  notification_settings: {
    email_notifications: boolean
    sms_notifications: boolean
    booking_reminders: boolean
    payment_reminders: boolean
  }
}

interface ProfileSettings {
  full_name: string
  email: string
  phone: string
  avatar_url: string
  role: string
}

// Mock data - replace with actual data fetching
const mockSystemSettings: SystemSettings = {
  booking_settings: {
    auto_confirm: false,
    require_dp: true,
    dp_percentage: 30,
    advance_booking_days: 90,
    cancellation_hours: 24,
  },
  notification_settings: {
    email_notifications: true,
    sms_notifications: true,
    booking_reminders: true,
    payment_reminders: true,
  }
}

const mockProfile: ProfileSettings = {
  full_name: "Admin User",
  email: "admin@luminastudio.id",
  phone: "+62-21-9876-5432",
  avatar_url: "",
  role: "admin",
}

export default function SettingsPage() {
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(mockSystemSettings)
  const [profile, setProfile] = useState<ProfileSettings>(mockProfile)
  const [isBackupDialogOpen, setIsBackupDialogOpen] = useState(false)

  const handleSystemSettingsChange = (section: string, field: string, value: any) => {
    setSystemSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof SystemSettings],
        [field]: value
      }
    }))
  }

  const handleSaveSettings = () => {
    // Implement save settings logic
    toast.success("Settings saved successfully!")
  }

  const handleProfileChange = (field: string, value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSaveProfile = () => {
    // Implement save profile logic
    toast.success("Profile updated successfully!")
  }

  const handleBackupData = () => {
    // Implement backup logic
    toast.success("Backup created successfully!")
    setIsBackupDialogOpen(false)
  }


  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your system settings and preferences
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isBackupDialogOpen} onOpenChange={setIsBackupDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Backup Data
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Data Backup</DialogTitle>
                <DialogDescription>
                  This will create a complete backup of your system data including customers, reservations, and settings.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsBackupDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleBackupData}>
                  Create Backup
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button onClick={handleSaveSettings}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="booking" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="booking">Booking</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>


        {/* Booking Settings */}
        <TabsContent value="booking">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Booking Configuration
              </CardTitle>
              <CardDescription>
                Configure how bookings are handled in your studio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-confirm">Auto-confirm bookings</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically confirm bookings when payment is received
                  </p>
                </div>
                <Switch
                  id="auto-confirm"
                  checked={systemSettings.booking_settings.auto_confirm}
                  onCheckedChange={(checked) => 
                    handleSystemSettingsChange("booking_settings", "auto_confirm", checked)
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="require-dp">Require down payment</Label>
                  <p className="text-sm text-muted-foreground">
                    Require customers to pay a down payment to confirm booking
                  </p>
                </div>
                <Switch
                  id="require-dp"
                  checked={systemSettings.booking_settings.require_dp}
                  onCheckedChange={(checked) => 
                    handleSystemSettingsChange("booking_settings", "require_dp", checked)
                  }
                />
              </div>

              {systemSettings.booking_settings.require_dp && (
                <div className="space-y-2">
                  <Label htmlFor="dp-percentage">Down Payment Percentage</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="dp-percentage"
                      type="number"
                      min="0"
                      max="100"
                      value={systemSettings.booking_settings.dp_percentage}
                      onChange={(e) => 
                        handleSystemSettingsChange("booking_settings", "dp_percentage", parseInt(e.target.value))
                      }
                      className="w-32"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>
              )}

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="advance-booking">Advance booking limit (days)</Label>
                  <Input
                    id="advance-booking"
                    type="number"
                    min="1"
                    max="365"
                    value={systemSettings.booking_settings.advance_booking_days}
                    onChange={(e) => 
                      handleSystemSettingsChange("booking_settings", "advance_booking_days", parseInt(e.target.value))
                    }
                  />
                  <p className="text-sm text-muted-foreground">
                    How many days in advance customers can book
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cancellation-hours">Cancellation deadline (hours)</Label>
                  <Input
                    id="cancellation-hours"
                    type="number"
                    min="1"
                    max="168"
                    value={systemSettings.booking_settings.cancellation_hours}
                    onChange={(e) => 
                      handleSystemSettingsChange("booking_settings", "cancellation_hours", parseInt(e.target.value))
                    }
                  />
                  <p className="text-sm text-muted-foreground">
                    Minimum hours before booking to allow cancellation
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Configure how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <div>
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                </div>
                <Switch
                  id="email-notifications"
                  checked={systemSettings.notification_settings.email_notifications}
                  onCheckedChange={(checked) => 
                    handleSystemSettingsChange("notification_settings", "email_notifications", checked)
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5 flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  <div>
                    <Label htmlFor="sms-notifications">SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via SMS
                    </p>
                  </div>
                </div>
                <Switch
                  id="sms-notifications"
                  checked={systemSettings.notification_settings.sms_notifications}
                  onCheckedChange={(checked) => 
                    handleSystemSettingsChange("notification_settings", "sms_notifications", checked)
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="booking-reminders">Booking Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Send reminders to customers about upcoming bookings
                  </p>
                </div>
                <Switch
                  id="booking-reminders"
                  checked={systemSettings.notification_settings.booking_reminders}
                  onCheckedChange={(checked) => 
                    handleSystemSettingsChange("notification_settings", "booking_reminders", checked)
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="payment-reminders">Payment Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Send reminders to customers about pending payments
                  </p>
                </div>
                <Switch
                  id="payment-reminders"
                  checked={systemSettings.notification_settings.payment_reminders}
                  onCheckedChange={(checked) => 
                    handleSystemSettingsChange("notification_settings", "payment_reminders", checked)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profile Settings */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Manage your personal profile and account settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile.avatar_url} />
                  <AvatarFallback className="text-lg">
                    {profile.full_name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Button variant="outline">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Photo
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    JPG, PNG or GIF (max. 5MB)
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="full-name">Full Name</Label>
                  <Input
                    id="full-name"
                    value={profile.full_name}
                    onChange={(e) => handleProfileChange("full_name", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => handleProfileChange("email", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) => handleProfileChange("phone", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value={profile.role}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Change Password</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      placeholder="Enter current password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="Enter new password"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSaveProfile}>
                  Save Profile
                </Button>
                <Button variant="outline">
                  Update Password
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="system">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Data Management
                </CardTitle>
                <CardDescription>
                  Backup, restore, and manage your studio data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Button onClick={() => setIsBackupDialogOpen(true)}>
                    <Download className="mr-2 h-4 w-4" />
                    Create Backup
                  </Button>
                  <Button variant="outline">
                    <Upload className="mr-2 h-4 w-4" />
                    Restore from Backup
                  </Button>
                </div>
                
                <div className="p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-medium mb-2">Last Backup</h4>
                  <p className="text-sm text-muted-foreground">
                    September 1, 2025 at 3:00 AM (Automatic backup)
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Size: 2.3 GB
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <Trash2 className="h-5 w-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription>
                  Irreversible and destructive actions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      Delete All Data
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete all
                        your system data including customers, reservations, and settings.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction className="bg-red-600 hover:bg-red-700">
                        Delete Everything
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                
                <p className="text-sm text-muted-foreground">
                  This will permanently delete all data. Make sure you have a backup.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}