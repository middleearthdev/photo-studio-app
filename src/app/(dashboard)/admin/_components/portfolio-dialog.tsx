"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useCreatePortfolio, useUpdatePortfolio } from "@/hooks/use-portfolios"
import { usePortfolioCategories } from "@/hooks/use-portfolios"
import { type Portfolio } from "@/actions/portfolios"
import { Loader2, Upload, Image as ImageIcon, X, Star, Eye } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"

const formSchema = z.object({
  title: z.string().min(1, "Judul portfolio wajib diisi"),
  description: z.string().optional(),
  image_url: z.string().url("URL gambar tidak valid").min(1, "URL gambar wajib diisi"),
  alt_text: z.string().optional(),
  category_id: z.string().optional(),
  display_order: z.number().min(0, "Urutan tampil tidak boleh negatif"),
  is_featured: z.boolean(),
  is_active: z.boolean(),
})

type FormData = z.infer<typeof formSchema>

interface PortfolioDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  portfolioData?: Portfolio | null
  onPortfolioSaved: () => void
  studioId: string
}

export function PortfolioDialog({
  open,
  onOpenChange,
  portfolioData,
  onPortfolioSaved,
  studioId
}: PortfolioDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imagePreview, setImagePreview] = useState<string>("")
  const { data: categories = [] } = usePortfolioCategories(studioId)
  const createPortfolioMutation = useCreatePortfolio()
  const updatePortfolioMutation = useUpdatePortfolio()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      image_url: "",
      alt_text: "",
      category_id: "general",
      display_order: 0,
      is_featured: false,
      is_active: true,
    },
  })

  // Watch image URL for preview
  const imageUrl = form.watch("image_url")

  useEffect(() => {
    if (imageUrl && imageUrl.startsWith('http')) {
      setImagePreview(imageUrl)
    } else {
      setImagePreview("")
    }
  }, [imageUrl])

  // Reset form when dialog opens/closes or portfolio data changes
  useEffect(() => {
    if (open) {
      if (portfolioData) {
        // Edit mode
        form.reset({
          title: portfolioData.title,
          description: portfolioData.description || "",
          image_url: portfolioData.image_url,
          alt_text: portfolioData.alt_text || "",
          category_id: portfolioData.category_id || "general",
          display_order: portfolioData.display_order,
          is_featured: portfolioData.is_featured,
          is_active: portfolioData.is_active,
        })
      } else {
        // Create mode
        form.reset({
          title: "",
          description: "",
          image_url: "",
          alt_text: "",
          category_id: "general",
          display_order: 0,
          is_featured: false,
          is_active: true,
        })
      }
    }
  }, [open, portfolioData, form])

  const onSubmit = async (values: FormData) => {
    setIsSubmitting(true)
    try {
      if (portfolioData) {
        // Update existing portfolio
        await updatePortfolioMutation.mutateAsync({
          id: portfolioData.id,
          data: {
            title: values.title,
            description: values.description || undefined,
            image_url: values.image_url,
            alt_text: values.alt_text || undefined,
            category_id: values.category_id === "general" ? undefined : values.category_id,
            display_order: values.display_order,
            is_featured: values.is_featured,
            is_active: values.is_active,
          }
        })
      } else {
        // Create new portfolio
        await createPortfolioMutation.mutateAsync({
          studio_id: studioId,
          title: values.title,
          description: values.description || undefined,
          image_url: values.image_url,
          alt_text: values.alt_text || undefined,
          category_id: values.category_id === "general" ? undefined : values.category_id,
          display_order: values.display_order,
          is_featured: values.is_featured,
          is_active: values.is_active,
        })
      }

      onPortfolioSaved()
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving portfolio:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleImageUpload = () => {
    // Placeholder for actual image upload functionality
    // This would integrate with Cloudinary or other image service
    const sampleImages = [
      "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800",
      "https://images.unsplash.com/photo-1519741497674-611481863552?w=800",
      "https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=800",
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800",
    ]
    
    const randomImage = sampleImages[Math.floor(Math.random() * sampleImages.length)]
    form.setValue("image_url", randomImage)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            {portfolioData ? "Edit Portfolio" : "Tambah Portfolio Baru"}
          </DialogTitle>
          <DialogDescription>
            {portfolioData
              ? "Perbarui informasi portfolio yang ada"
              : "Tambahkan karya baru ke galeri portfolio studio"
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Image Upload Section */}
            <div className="space-y-4">
              <label className="text-sm font-medium">Gambar Portfolio *</label>
              
              {/* Image Preview */}
              {imagePreview ? (
                <Card className="relative overflow-hidden">
                  <CardContent className="p-0">
                    <div className="relative aspect-video">
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8"
                        onClick={() => {
                          form.setValue("image_url", "")
                          setImagePreview("")
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-2 border-dashed border-muted-foreground/25">
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Drag gambar ke sini atau klik untuk upload
                    </p>
                    <Button type="button" variant="outline" onClick={handleImageUpload}>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Gambar
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Manual Image URL Input */}
              <FormField
                control={form.control}
                name="image_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL Gambar (Manual)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://example.com/image.jpg"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Masukkan URL gambar langsung atau gunakan upload di atas
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Judul Portfolio *</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: Wedding Photography Session" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deskripsi</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Deskripsi karya portfolio..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Ceritakan tentang karya ini dan konsep yang digunakan
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="alt_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alt Text</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Deskripsi gambar untuk aksesibilitas"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Text alternatif untuk screen reader dan SEO
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Category and Settings */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kategori</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih kategori" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="general">
                          <span className="text-muted-foreground">Umum/General</span>
                        </SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Pilih kategori untuk mengelompokkan portfolio
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="display_order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Urutan Tampil</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Semakin kecil angka, semakin depan urutannya
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Status Toggles */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="is_featured"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        Portfolio Unggulan
                      </FormLabel>
                      <FormDescription>
                        Portfolio akan ditampilkan di bagian unggulan
                      </FormDescription>
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

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base flex items-center gap-2">
                        <Eye className="h-4 w-4 text-blue-500" />
                        Status Aktif
                      </FormLabel>
                      <FormDescription>
                        Portfolio akan terlihat di galeri publik jika diaktifkan
                      </FormDescription>
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
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {portfolioData ? "Perbarui Portfolio" : "Tambah Portfolio"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}