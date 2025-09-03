"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useCreatePackageCategory, useUpdatePackageCategory } from "@/hooks/use-packages"
import { type CreatePackageCategoryData, type UpdatePackageCategoryData } from "@/actions/packages"
import { Loader2, Tag } from "lucide-react"

const packageCategorySchema = z.object({
  name: z.string().min(1, "Nama kategori harus diisi").max(100, "Nama kategori maksimal 100 karakter"),
  description: z.string().optional(),
  studio_id: z.string().min(1, "Studio ID harus ada"),
})

type FormData = z.infer<typeof packageCategorySchema>

interface PackageCategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categoryData?: {
    id: string
    name: string
    description?: string | null
    studio_id: string
  } | null
  onCategorySaved?: () => void
  studioId: string
}

export function PackageCategoryDialog({
  open,
  onOpenChange,
  categoryData,
  onCategorySaved,
  studioId,
}: PackageCategoryDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const createMutation = useCreatePackageCategory()
  const updateMutation = useUpdatePackageCategory()

  const form = useForm<FormData>({
    resolver: zodResolver(packageCategorySchema),
    defaultValues: {
      name: "",
      description: "",
      studio_id: studioId,
    },
  })

  useEffect(() => {
    if (categoryData) {
      form.reset({
        name: categoryData.name,
        description: categoryData.description || "",
        studio_id: categoryData.studio_id,
      })
    } else {
      form.reset({
        name: "",
        description: "",
        studio_id: studioId,
      })
    }
  }, [categoryData, form, studioId])

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)

    try {
      if (categoryData?.id) {
        const updateData: UpdatePackageCategoryData = {
          name: data.name,
          description: data.description || undefined,
        }
        
        const result = await updateMutation.mutateAsync({
          categoryId: categoryData.id,
          categoryData: updateData,
        })
        
        if (result.success) {
          onCategorySaved?.()
          onOpenChange(false)
          form.reset()
        }
      } else {
        const createData: CreatePackageCategoryData = {
          name: data.name,
          description: data.description || undefined,
          studio_id: data.studio_id,
        }
        
        const result = await createMutation.mutateAsync(createData)
        
        if (result.success) {
          onCategorySaved?.()
          onOpenChange(false)
          form.reset()
        }
      }
    } catch (error) {
      console.error('Error saving category:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset()
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            {categoryData ? "Edit Kategori Paket" : "Tambah Kategori Paket"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Kategori</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: Wedding, Prewedding, Family..." {...field} />
                  </FormControl>
                  <FormDescription>
                    Masukkan nama kategori paket yang mudah dikenali
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi (Opsional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Deskripsi kategori paket..."
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Deskripsi singkat tentang kategori paket ini
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {categoryData ? "Simpan Perubahan" : "Tambah Kategori"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}