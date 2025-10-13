"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { z } from "zod"

const updateProfileSchema = z.object({
  full_name: z.string().min(1, "Nama lengkap harus diisi"),
  email: z.string().email("Format email tidak valid"),
  phone: z.string().optional(),
  address: z.string().optional(),
  birth_date: z.string().optional(),
})

export type UpdateProfileData = z.infer<typeof updateProfileSchema>

// Helper function to get current user session
async function getCurrentUser() {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  return session?.user || null
}

export async function updateProfileAction(data: UpdateProfileData) {
  try {
    // Get current user
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: "Unauthorized" }
    }

    // Validate input
    const validatedData = updateProfileSchema.parse(data)

    // Update user profile
    await prisma.user.update({
      where: { id: user.id },
      data: {
        full_name: validatedData.full_name,
        email: validatedData.email,
        phone: validatedData.phone || null,
        address: validatedData.address || null,
        birth_date: validatedData.birth_date ? new Date(validatedData.birth_date) : null,
      }
    })

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
    // Get current user
    const user = await getCurrentUser()
    if (!user) {
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

    // Upload using the storage system
    const { uploadFile } = await import('@/lib/storage')
    const uploadResult = await uploadFile({
      bucket: 'avatars',
      path: fileName,
      file: file
    })

    if (uploadResult.error) {
      console.error("Avatar upload error:", uploadResult.error)
      return { success: false, error: "Gagal mengupload avatar" }
    }

    const avatarUrl = uploadResult.publicUrl || ''

    // Update user profile with new avatar URL
    await prisma.user.update({
      where: { id: user.id },
      data: {
        avatar_url: avatarUrl,
      }
    })

    // Revalidate relevant paths
    revalidatePath("/admin/profile")
    revalidatePath("/cs/profile")
    
    return { success: true, avatarUrl }
  } catch (error) {
    console.error("Upload avatar action error:", error)
    return { success: false, error: "Terjadi kesalahan sistem" }
  }
}

export async function getProfileAction() {
  try {
    // Get current user
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: "Unauthorized" }
    }

    // Get user profile
    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        studio_id: true,
        role: true,
        full_name: true,
        phone: true,
        address: true,
        birth_date: true,
        preferences: true,
        avatar_url: true,
        is_active: true,
        last_login: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!profile) {
      return { success: false, error: "Gagal mengambil data profil" }
    }

    // Format the profile data
    const formattedProfile = {
      ...profile,
      birth_date: profile.birth_date?.toISOString() || null,
      last_login: profile.last_login?.toISOString() || null,
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString()
    }

    return { success: true, profile: formattedProfile }
  } catch (error) {
    console.error("Get profile action error:", error)
    return { success: false, error: "Terjadi kesalahan sistem" }
  }
}