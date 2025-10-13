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
import { useCreateHeroImage, useUpdateHeroImage } from "@/hooks/use-hero-images"
import { type HeroImage } from "@/actions/hero-images"
import { Loader2, Image as ImageIcon, Upload, X } from "lucide-react"

// Image Upload Component (reusing from portfolio dialog)
function ImageUploadComponent({ value, onChange }: {
  value: string
  onChange: (url: string) => void
}) {
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const uploadToDestination = async (file: File): Promise<string> => {
    const destination = process.env.NEXT_PUBLIC_UPLOAD_DESTINATION || 'server'
    
    if (destination === 'vercel') {
      // Upload to Vercel Blob Store
      const fileName = `hero-images/${Date.now()}-${file.name}`
      
      const formData = new FormData()
      formData.append('file', file)
      formData.append('filename', fileName)
      
      const response = await fetch('/api/upload/vercel', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Vercel upload failed')
      }
      
      const result = await response.json()
      return result.url
    } else {
      // Upload to server
      const formData = new FormData()
      formData.append('file', file)
      formData.append('studioId', 'general')
      
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

    let progressInterval: NodeJS.Timeout | null = null

    try {
      progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 85) return prev
          if (prev < 30) return Math.min(prev + 12, 85)
          else if (prev < 60) return Math.min(prev + 8, 85)
          else return Math.min(prev + 3, 85)
        })
      }, 350)

      const url = await uploadToDestination(file)
      
      if (progressInterval) {
        clearInterval(progressInterval)
        progressInterval = null
      }
      
      onChange(url)
      
      setProgress(95)
      setTimeout(() => {
        setProgress(100)
        setTimeout(() => {
          setIsUploading(false)
          setProgress(0)
        }, 400)
      }, 300)
    } catch (error) {
      if (progressInterval) clearInterval(progressInterval)
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
  const destinationDisplay = {
    server: 'Local Server',
    vercel: 'Vercel Blob Store'
  }[destination] || destination

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
            <p className="text-sm font-medium">
              {progress < 25 ? `Preparing upload to ${destinationDisplay}...` :
               progress < 85 ? `Uploading to ${destinationDisplay}...` :
               progress < 100 ? `Processing and finalizing...` :
               'Upload complete!'}
            </p>
            <div className="bg-gray-200 rounded-full h-3 mt-2">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${
                  progress === 100 ? 'bg-green-600' : 'bg-blue-600'
                }`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">{Math.round(progress)}%</p>
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
          <p className="text-xs text-gray-500">Upload to: {destinationDisplay}</p>
        </div>
      )}

      {/* Manual URL Input */}
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

// Image Preview Component
function ImagePreview({ src, alt }: { src: string; alt: string }) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    setIsLoading(true)
    setHasError(false)
  }, [src])

  const handleLoad = () => {
    setIsLoading(false)
    setHasError(false)
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
  }

  if (hasError) {
    return (
      <div className="w-full h-48 bg-gray-100 rounded-lg border border-red-200 flex items-center justify-center">
        <div className="text-center">
          <ImageIcon className="h-8 w-8 mx-auto text-red-400 mb-2" />
          <p className="text-sm text-red-600">Failed to load image</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-48">
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 rounded-lg border flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className={`w-full h-48 object-cover rounded-lg border transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
      />
    </div>
  )
}

const formSchema = z.object({
  title: z.string().min(1, "Judul hero image wajib diisi"),
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
  display_order: z.number().min(1, "Urutan tampil harus minimal 1").max(5, "Urutan tampil maksimal 5"),
  is_active: z.boolean(),
})

type FormData = z.infer<typeof formSchema>

interface HeroImagesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  heroImageData?: HeroImage | null
  onHeroImageSaved: () => void
  existingOrders: number[]
}

export function HeroImagesDialog({
  open,
  onOpenChange,
  heroImageData,
  onHeroImageSaved,
  existingOrders
}: HeroImagesDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const createHeroImageMutation = useCreateHeroImage()
  const updateHeroImageMutation = useUpdateHeroImage()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      image_url: "",
      alt_text: "",
      display_order: 1,
      is_active: true,
    },
  })

  // Reset form when dialog opens/closes or hero image data changes
  useEffect(() => {
    if (open) {
      if (heroImageData) {
        // Edit mode
        form.reset({
          title: heroImageData.title,
          description: heroImageData.description || "",
          image_url: heroImageData.image_url,
          alt_text: heroImageData.alt_text || "",
          display_order: heroImageData.display_order,
          is_active: heroImageData.is_active,
        })
      } else {
        // Create mode - find next available order
        const nextOrder = Math.min(...Array.from({length: 5}, (_, i) => i + 1).filter(n => !existingOrders.includes(n)))
        form.reset({
          title: "",
          description: "",
          image_url: "",
          alt_text: "",
          display_order: nextOrder || 1,
          is_active: true,
        })
      }
    }
  }, [open, heroImageData, form, existingOrders])

  const onSubmit = async (values: FormData) => {
    setIsSubmitting(true)
    try {
      if (heroImageData) {
        // Update existing hero image
        await updateHeroImageMutation.mutateAsync({
          id: heroImageData.id,
          data: {
            title: values.title,
            description: values.description || undefined,
            image_url: values.image_url,
            alt_text: values.alt_text || undefined,
            display_order: values.display_order,
            is_active: values.is_active,
          }
        })
      } else {
        // Create new hero image
        await createHeroImageMutation.mutateAsync({
          title: values.title,
          description: values.description || undefined,
          image_url: values.image_url,
          alt_text: values.alt_text || undefined,
          display_order: values.display_order,
          is_active: values.is_active,
        })
      }

      onHeroImageSaved()
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving hero image:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get available display orders
  const availableOrders = Array.from({length: 5}, (_, i) => i + 1)
    .filter(n => heroImageData?.display_order === n || !existingOrders.includes(n))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            {heroImageData ? "Edit Hero Image" : "Tambah Hero Image Baru"}
          </DialogTitle>
          <DialogDescription>
            {heroImageData
              ? "Perbarui informasi hero image"
              : "Tambahkan gambar hero baru untuk homepage (maksimal 5 gambar)"
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Image Upload Section */}
            <FormField
              control={form.control}
              name="image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gambar Hero *</FormLabel>
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                      <ImageUploadComponent
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </div>
                    
                    {/* Preview */}
                    {field.value && (
                      <div className="relative w-full max-w-sm mx-auto">
                        <ImagePreview
                          key={field.value}
                          src={field.value}
                          alt="Hero image preview"
                        />
                      </div>
                    )}
                  </div>
                  <FormDescription>
                    Upload gambar hero atau masukkan URL langsung
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Basic Information */}
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Judul Hero Image *</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: Studio Photography Session" {...field} />
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
                        placeholder="Deskripsi hero image..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Deskripsi hero image untuk SEO dan aksesibilitas
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

            {/* Settings */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="display_order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Urutan Tampil *</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(Number(value))} 
                      value={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih urutan" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableOrders.map((order) => (
                          <SelectItem key={order} value={order.toString()}>
                            Urutan {order}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Urutan tampil di homepage (1-5)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Status Aktif</FormLabel>
                      <FormDescription>
                        Hero image akan ditampilkan di homepage jika diaktifkan
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
                {heroImageData ? "Perbarui Hero Image" : "Tambah Hero Image"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}