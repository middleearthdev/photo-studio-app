"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const updateProfileSchema = z.object({
  full_name: z.string().min(1, "Nama lengkap harus diisi"),
  email: z.string().email("Format email tidak valid"),
  phone: z.string().optional(),
  address: z.string().optional(),
  birth_date: z.string().optional(),
})

export type UpdateProfileData = z.infer<typeof updateProfileSchema>

export async function updateProfileAction(data: UpdateProfileData) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: "Unauthorized" }
    }

    // Validate input
    const validatedData = updateProfileSchema.parse(data)

    // Update user profile
    const { error } = await supabase
      .from("user_profiles")
      .update({
        full_name: validatedData.full_name,
        email: validatedData.email,
        phone: validatedData.phone || null,
        address: validatedData.address || null,
        birth_date: validatedData.birth_date || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (error) {
      console.error("Profile update error:", error)
      return { success: false, error: "Gagal memperbarui profil" }
    }

    // Revalidate relevant paths
    revalidatePath("/admin/profile")
    revalidatePath("/cs/profile")
    
    return { success: true }
  } catch (error) {
    console.error("Update profile action error:", error)
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.issues[0]?.message || "Data tidak valid" 
      }
    }
    return { success: false, error: "Terjadi kesalahan sistem" }
  }
}

export async function uploadAvatarAction(formData: FormData) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: "Unauthorized" }
    }

    const file = formData.get("avatar") as File
    if (!file) {
      return { success: false, error: "Tidak ada file yang dipilih" }
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return { success: false, error: "File harus berupa gambar" }
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: "Ukuran file maksimal 5MB" }
    }

    // Create unique filename
    const fileExt = file.name.split(".").pop()
    const fileName = `${user.id}-${Date.now()}.${fileExt}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      })

    if (uploadError) {
      console.error("Avatar upload error:", uploadError)
      return { success: false, error: "Gagal mengupload avatar" }
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName)

    // Update user profile with new avatar URL
    const { error: updateError } = await supabase
      .from("user_profiles")
      .update({
        avatar_url: publicUrlData.publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (updateError) {
      console.error("Profile avatar update error:", updateError)
      return { success: false, error: "Gagal memperbarui avatar" }
    }

    // Revalidate relevant paths
    revalidatePath("/admin/profile")
    revalidatePath("/cs/profile")
    
    return { success: true, avatarUrl: publicUrlData.publicUrl }
  } catch (error) {
    console.error("Upload avatar action error:", error)
    return { success: false, error: "Terjadi kesalahan sistem" }
  }
}

export async function getProfileAction() {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: "Unauthorized" }
    }

    // Get user profile
    const { data: profile, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (error) {
      console.error("Get profile error:", error)
      return { success: false, error: "Gagal mengambil data profil" }
    }

    return { success: true, profile }
  } catch (error) {
    console.error("Get profile action error:", error)
    return { success: false, error: "Terjadi kesalahan sistem" }
  }
}