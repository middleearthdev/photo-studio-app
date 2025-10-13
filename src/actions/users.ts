"use server"

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { PaginationParams, PaginatedResult, calculatePagination } from '@/lib/constants/pagination'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import crypto from 'crypto'
import { hashPassword } from 'better-auth/crypto'

export type UserRole = 'customer' | 'admin' | 'cs'

export interface UserProfile {
  id: string
  studio_id: string | null
  role: UserRole
  full_name: string | null
  phone: string | null
  address: string | null
  avatar_url: string | null
  is_active: boolean
  last_login: Date | null
  created_at: Date
  updated_at: Date
  email: string
  emailVerified: boolean
  name: string | null
  image: string | null
  birth_date: Date | null
  preferences: any
}

export interface CreateUserData {
  email: string
  password: string
  full_name: string
  phone?: string
  role: UserRole
  is_active: boolean
}

export interface UpdateUserData {
  full_name: string
  phone?: string
  role: UserRole
  is_active: boolean
  password?: string
}

export interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export async function getUsersAction(): Promise<ActionResult<UserProfile[]>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current user profile
    const currentProfile = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, studio_id: true }
    })

    if (!currentProfile || currentProfile.role !== 'admin') {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Get all users
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        studio: {
          select: { id: true, name: true }
        }
      }
    })

    const userProfiles: UserProfile[] = users.map(user => ({
      id: user.id,
      studio_id: user.studio_id,
      role: user.role,
      full_name: user.full_name,
      phone: user.phone,
      address: user.address,
      avatar_url: user.avatar_url,
      is_active: user.is_active || false,
      last_login: user.last_login,
      created_at: user.createdAt,
      updated_at: user.updatedAt,
      email: user.email,
      emailVerified: user.emailVerified,
      name: user.name,
      image: user.image,
      birth_date: user.birth_date,
      preferences: user.preferences
    }))

    return { success: true, data: userProfiles }
  } catch (error: unknown) {
    console.error('Error in getUsersAction:', error)
    const errorMessage = error instanceof Error ? error.message : 'An error occurred'
    return { success: false, error: errorMessage }
  }
}

// Get paginated users
export async function getPaginatedUsers(
  params: PaginationParams & {
    role?: UserRole | 'all'
    status?: 'active' | 'inactive' | 'all'
    studioId?: string
  } = {}
): Promise<PaginatedResult<UserProfile>> {
  const { page = 1, pageSize = 10, search = '', role = 'all', status = 'all', studioId } = params
  const { offset, pageSize: validPageSize } = calculatePagination(page, pageSize, 0)

  // Build the where clause
  const where: any = {}

  if (role !== 'all') {
    where.role = role
  }

  if (status !== 'all') {
    where.is_active = status === 'active'
  }

  if (studioId && studioId !== 'all') {
    where.studio_id = studioId
  }

  // Apply search
  if (search.trim()) {
    where.OR = [
      { full_name: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } }
    ]
  }

  try {
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: validPageSize,
        include: {
          studio: {
            select: { id: true, name: true }
          }
        }
      }),
      prisma.user.count({ where })
    ])

    const userProfiles: UserProfile[] = users.map(user => ({
      id: user.id,
      studio_id: user.studio_id,
      role: user.role,
      full_name: user.full_name,
      phone: user.phone,
      address: user.address,
      avatar_url: user.avatar_url,
      is_active: user.is_active || false,
      last_login: user.last_login,
      created_at: user.createdAt,
      updated_at: user.updatedAt,
      email: user.email,
      emailVerified: user.emailVerified,
      name: user.name,
      image: user.image,
      birth_date: user.birth_date,
      preferences: user.preferences
    }))

    const pagination = calculatePagination(page, validPageSize, total)

    return {
      data: userProfiles,
      pagination
    }
  } catch (error) {
    console.error('Error fetching paginated users:', error)
    throw new Error(`Failed to fetch users: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function createUserAction(userData: CreateUserData): Promise<ActionResult> {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current user profile
    const currentProfile = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, studio_id: true }
    })

    if (!currentProfile || currentProfile.role !== 'admin') {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    })

    if (existingUser) {
      return { success: false, error: 'Email already exists' }
    }

    // Hash the password using Better Auth's crypto
    const hashedPassword = await hashPassword(userData.password)
    
    // Create new user
    const userId = crypto.randomUUID()
    await prisma.user.create({
      data: {
        id: userId,
        email: userData.email,
        emailVerified: true,
        full_name: userData.full_name,
        phone: userData.phone,
        role: userData.role,
        is_active: userData.is_active,
        studio_id: userData.role === 'admin' ? null : currentProfile.studio_id,
        accounts: {
          create: {
            id: crypto.randomUUID(),
            accountId: userData.email,
            providerId: 'credential',
            password: hashedPassword
          }
        }
      }
    })

    revalidatePath('/admin/users')
    return { success: true }
  } catch (error: unknown) {
    console.error('Error in createUserAction:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to create user'
    return { success: false, error: errorMessage }
  }
}

export async function updateUserAction(userId: string, userData: UpdateUserData): Promise<ActionResult> {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current user profile
    const currentProfile = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, studio_id: true }
    })

    if (!currentProfile || currentProfile.role !== 'admin') {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Update user profile
    await prisma.user.update({
      where: { id: userId },
      data: {
        full_name: userData.full_name,
        phone: userData.phone,
        role: userData.role,
        is_active: userData.is_active
      }
    })

    // Update password if provided
    if (userData.password && userData.password.length > 0) {
      const hashedPassword = await hashPassword(userData.password)
      await prisma.account.updateMany({
        where: { userId, providerId: 'credential' },
        data: { password: hashedPassword }
      })
    }

    revalidatePath('/admin/users')
    return { success: true }
  } catch (error: unknown) {
    console.error('Error in updateUserAction:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to update user'
    return { success: false, error: errorMessage }
  }
}

export async function deactivateUserAction(userId: string): Promise<ActionResult> {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current user profile
    const currentProfile = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, studio_id: true }
    })

    if (!currentProfile || currentProfile.role !== 'admin') {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Prevent self-deactivation
    if (userId === session.user.id) {
      return { success: false, error: 'Cannot deactivate your own account' }
    }

    // Deactivate user
    await prisma.user.update({
      where: { id: userId },
      data: { is_active: false }
    })

    revalidatePath('/admin/users')
    return { success: true }
  } catch (error: unknown) {
    console.error('Error in deactivateUserAction:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to deactivate user'
    return { success: false, error: errorMessage }
  }
}

export async function activateUserAction(userId: string): Promise<ActionResult> {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current user profile
    const currentProfile = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, studio_id: true }
    })

    if (!currentProfile || currentProfile.role !== 'admin') {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Activate user
    await prisma.user.update({
      where: { id: userId },
      data: { is_active: true }
    })

    revalidatePath('/admin/users')
    return { success: true }
  } catch (error: unknown) {
    console.error('Error in activateUserAction:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to activate user'
    return { success: false, error: errorMessage }
  }
}

export async function deleteUserPermanentlyAction(userId: string): Promise<ActionResult> {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current user profile
    const currentProfile = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, studio_id: true }
    })

    if (!currentProfile || currentProfile.role !== 'admin') {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Prevent self-deletion
    if (userId === session.user.id) {
      return { success: false, error: 'Cannot delete your own account' }
    }

    // Get user to be deleted
    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    if (!userToDelete) {
      return { success: false, error: 'User not found' }
    }

    // Check if user has related data that would prevent deletion
    const relatedReservations = await prisma.reservation.findFirst({
      where: { user_id: userId }
    })

    if (relatedReservations) {
      return {
        success: false,
        error: 'Cannot delete user with existing reservations. Deactivate instead.'
      }
    }

    // Delete user and related data in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete accounts first (though cascade should handle this)
      await tx.account.deleteMany({
        where: { userId }
      })
      
      // Delete sessions (though cascade should handle this)
      await tx.session.deleteMany({
        where: { userId }
      })
      
      // Finally delete the user
      await tx.user.delete({
        where: { id: userId }
      })
    })

    revalidatePath('/admin/users')
    return { success: true }
  } catch (error: unknown) {
    console.error('Error in deleteUserPermanentlyAction:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete user permanently'
    return { success: false, error: errorMessage }
  }
}