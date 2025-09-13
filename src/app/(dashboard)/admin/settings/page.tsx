"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User } from "lucide-react"
import { toast } from "sonner"
import {
  useProfile,
  useUpdateProfile,
  useUpdatePassword
} from "@/hooks/use-settings"


export default function SettingsPage() {
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    phone: ''
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: ''
  })

  // Queries and mutations
  const { data: profile, isLoading: profileLoading } = useProfile()
  const updateProfileMutation = useUpdateProfile()
  const updatePasswordMutation = useUpdatePassword()

  // Initialize forms when data loads
  React.useEffect(() => {
    if (profile) {
      setProfileForm({
        full_name: profile.full_name || '',
        phone: profile.phone || ''
      })
    }
  }, [profile])

  const handleProfileChange = (field: string, value: string) => {
    setProfileForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSaveProfile = async () => {
    await updateProfileMutation.mutateAsync(profileForm)
  }

  const handleUpdatePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      toast.error('Please fill in both password fields')
      return
    }
    await updatePasswordMutation.mutateAsync(passwordForm)
    setPasswordForm({ currentPassword: '', newPassword: '' })
  }

  if (profileLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
          <p className="text-muted-foreground">
            Kelola informasi profil dan pengaturan akun Anda
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Update your personal information and security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile?.avatar_url || ''} />
              <AvatarFallback className="text-lg">
                {profile?.full_name ? profile.full_name.split(' ').map(n => n[0]).join('') : 'U'}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="full-name">Full Name</Label>
              <Input
                id="full-name"
                value={profileForm.full_name}
                onChange={(e) => handleProfileChange("full_name", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile?.email || ''}
                disabled
                className="bg-muted"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={profileForm.phone}
                onChange={(e) => handleProfileChange("phone", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                value={profile?.role || ''}
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
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Enter new password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleSaveProfile}
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? 'Saving...' : 'Save Profile'}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleUpdatePassword}
              disabled={updatePasswordMutation.isPending}
            >
              {updatePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}