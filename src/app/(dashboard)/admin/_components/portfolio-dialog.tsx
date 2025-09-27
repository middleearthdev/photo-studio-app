"use client"

import React, { useState, useEffect } from "react"
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
import { Loader2, Star, Eye, Image as ImageIcon, Upload, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"

// Simple upload component using NEXT_UPLOAD_DESTINATION
function ImageUploadComponent({ studioId, value, onChange }: {
  studioId: string
  value: string
  onChange: (url: string) => void
}) {
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const uploadToDestination = async (file: File): Promise<string> => {
    const destination = process.env.NEXT_PUBLIC_UPLOAD_DESTINATION || 'server'
    
    if (destination === 'supabase') {
      // Upload to Supabase
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      
      const fileName = `${studioId}/${Date.now()}-${file.name}`
      const { data, error } = await supabase.storage
        .from('portfolio-images')
        .upload(fileName, file)
      
      if (error) throw error
      
      const { data: { publicUrl } } = supabase.storage
        .from('portfolio-images')
        .getPublicUrl(fileName)
      
      return publicUrl
    } else {
      // Upload to server
      const formData = new FormData()
      formData.append('file', file)
      formData.append('studioId', studioId)
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }
      
      const result = await response.json()
      
      // Create full URL for server uploads
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const fullUrl = result.url.startsWith('http') 
        ? result.url 
        : `${baseUrl}${result.url}`
      
      return fullUrl
    }
  }

  const handleFileSelect = async (file: File) => {
    if (!file || file.type.indexOf('image/') !== 0) return

    setIsUploading(true)
    setProgress(0)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => prev + 10)
      }, 200)

      const url = await uploadToDestination(file)
      
      clearInterval(progressInterval)
      setProgress(100)
      
      setTimeout(() => {
        onChange(url)
        setIsUploading(false)
        setProgress(0)
      }, 500)
    } catch (error) {
      setIsUploading(false)
      setProgress(0)
      console.error('Upload failed:', error)
      alert(error instanceof Error ? error.message : 'Upload failed')
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
  }

  const destination = process.env.NEXT_PUBLIC_UPLOAD_DESTINATION || 'server'

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />
      
      {isUploading ? (
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <div>
            <p className="text-sm font-medium">Uploading to {destination}...</p>
            <div className="bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">{progress}%</p>
          </div>
        </div>
      ) : (
        <div 
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm font-medium">Click to upload or drag and drop</p>
          <p className="text-xs text-gray-500">Upload to: {destination}</p>
        </div>
      )}

      {/* Manual URL Input - Always visible */}
      <div className="space-y-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Atau masukkan URL gambar langsung"
        />
      </div>
    </div>
  )
}

const formSchema = z.object({
  title: z.string().min(1, "Judul portfolio wajib diisi"),
  description: z.string().optional(),
  image_url: z.string().min(1, "URL gambar wajib diisi").refine((val) => {
    try {
      new URL(val)
      return true
    } catch {
      return false
    }
  }, "URL gambar tidak valid"),
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
              <FormField
                control={form.control}
                name="image_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gambar Portfolio *</FormLabel>
                    <div className="space-y-4">
                      {/* Image Upload Area */}
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                        <ImageUploadComponent
                          studioId={studioId}
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </div>
                      
                      {/* Preview */}
                      {field.value && (
                        <div className="relative w-full max-w-sm mx-auto">
                          <img
                            src={field.value}
                            alt="Portfolio preview"
                            className="w-full h-48 object-cover rounded-lg border"
                          />
                        </div>
                      )}
                    </div>
                    <FormDescription>
                      Upload gambar portfolio atau masukkan URL langsung
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