"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useCreateUser, useUpdateUser } from "@/hooks/use-users"
import { type UserProfile, type UserRole } from "@/actions/users"

const userSchema = z.object({
  full_name: z.string().min(2, "Nama lengkap minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  phone: z.string().optional(),
  role: z.enum(['customer', 'admin', 'cs']),
  is_active: z.boolean(),
  password: z.string().optional(),
})

type UserFormValues = z.infer<typeof userSchema>

interface UserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: UserProfile | null
  onUserSaved: () => void
}

const roleLabels: Record<UserRole, string> = {
  customer: 'Customer',
  admin: 'Admin',
  cs: 'Customer Service'
}

export function UserDialog({ open, onOpenChange, user, onUserSaved }: UserDialogProps) {
  const isEdit = !!user

  // TanStack Query hooks
  const createUserMutation = useCreateUser()
  const updateUserMutation = useUpdateUser()

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      full_name: "",
      email: "",
      phone: "",
      role: "cs",
      is_active: true,
      password: "",
    },
  })

  useEffect(() => {
    if (user) {
      form.reset({
        full_name: user.full_name || "",
        email: user.email || "",
        phone: user.phone || "",
        role: user.role,
        is_active: user.is_active,
        password: "",
      })
    } else {
      form.reset({
        full_name: "",
        email: "",
        phone: "",
        role: "cs",
        is_active: true,
        password: "",
      })
    }
  }, [user, form])

  const onSubmit = async (data: UserFormValues) => {
    if (isEdit) {
      updateUserMutation.mutate(
        {
          userId: user!.id,
          userData: {
            full_name: data.full_name,
            phone: data.phone,
            role: data.role,
            is_active: data.is_active,
            password: data.password,
          }
        },
        {
          onSuccess: () => {
            onUserSaved()
            onOpenChange(false)
          }
        }
      )
    } else {
      createUserMutation.mutate(
        {
          email: data.email,
          password: data.password || 'defaultpassword123',
          full_name: data.full_name,
          phone: data.phone,
          role: data.role,
          is_active: data.is_active,
        },
        {
          onSuccess: () => {
            onUserSaved()
            onOpenChange(false)
          }
        }
      )
    }
  }

  const isLoading = createUserMutation.isPending || updateUserMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit User" : "Tambah User Baru"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update informasi pengguna di bawah ini."
              : "Buat akun pengguna baru untuk studio."
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Lengkap</FormLabel>
                  <FormControl>
                    <Input placeholder="Masukkan nama lengkap" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Masukkan email"
                      disabled={isEdit}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                  {isEdit && (
                    <div className="text-xs text-muted-foreground">
                      Email tidak dapat diubah setelah akun dibuat
                    </div>
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nomor Telepon</FormLabel>
                  <FormControl>
                    <Input placeholder="Masukkan nomor telepon" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih role pengguna" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(roleLabels).map(([role, label]) => (
                        <SelectItem key={role} value={role}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {isEdit ? "Password Baru (Kosongkan jika tidak diubah)" : "Password"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder={isEdit ? "Masukkan password baru" : "Masukkan password"}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Status Aktif</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Pengguna dapat login dan mengakses sistem
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (isEdit ? "Updating..." : "Creating...") : (isEdit ? "Update" : "Buat User")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}