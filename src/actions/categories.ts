"use server"

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

export interface PackageCategory {
  id: string
  studio_id: string
  name: string
  description: string | null
  display_order: number
  is_active: boolean
  created_at: string
  // Counts
  packages_count?: number
}

export interface PortfolioCategory {
  id: string
  studio_id: string
  name: string
  description: string | null
  display_order: number
  is_active: boolean
  created_at: string
  // Counts
  portfolios_count?: number
}

export interface CreateCategoryData {
  name: string
  description?: string
  display_order?: number
}

export interface UpdateCategoryData extends Partial<CreateCategoryData> {
  is_active?: boolean
}

export interface ActionResult<T = any> {
  success: boolean
  data?: T
  error?: string
}

// Helper function to get current user session
async function getCurrentUser() {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  return session?.user || null
}

// Package Categories
export async function getPackageCategoriesAction(): Promise<ActionResult<PackageCategory[]>> {
  try {
    // Get current user to check permissions
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current user profile
    const currentProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true, studio_id: true }
    })

    if (!currentProfile || currentProfile.role !== 'admin') {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Get package categories with package counts
    const categories = await prisma.packageCategory.findMany({
      include: {
        _count: {
          select: {
            packages: true
          }
        }
      },
      orderBy: {
        display_order: 'asc'
      }
    })

    const transformedCategories: PackageCategory[] = categories.map((category) => ({
      id: category.id,
      studio_id: category.studio_id || '',
      name: category.name,
      description: category.description,
      display_order: category.display_order || 0,
      is_active: category.is_active || false,
      created_at: category.created_at?.toISOString() || '',
      packages_count: category._count.packages
    }))

    return { success: true, data: transformedCategories }
  } catch (error: any) {
    console.error('Error in getPackageCategoriesAction:', error)
    return { success: false, error: error.message || 'An error occurred' }
  }
}

export async function createPackageCategoryAction(
  studioId: string,
  categoryData: CreateCategoryData
): Promise<ActionResult> {
  try {
    // Get current user to check permissions
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current user profile
    const currentProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    })

    if (!currentProfile || currentProfile.role !== 'admin') {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Create package category
    await prisma.packageCategory.create({
      data: {
        studio_id: studioId,
        name: categoryData.name,
        description: categoryData.description,
        display_order: categoryData.display_order || 0,
      }
    })

    revalidatePath('/admin/packages/categories')
    return { success: true }
  } catch (error: any) {
    console.error('Error in createPackageCategoryAction:', error)
    return { success: false, error: error.message || 'Failed to create package category' }
  }
}

export async function updatePackageCategoryAction(
  categoryId: string,
  categoryData: UpdateCategoryData
): Promise<ActionResult> {
  try {
    // Get current user to check permissions
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current user profile
    const currentProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    })

    if (!currentProfile || currentProfile.role !== 'admin') {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Update package category
    await prisma.packageCategory.update({
      where: { id: categoryId },
      data: categoryData
    })

    revalidatePath('/admin/packages/categories')
    return { success: true }
  } catch (error: any) {
    console.error('Error in updatePackageCategoryAction:', error)
    return { success: false, error: error.message || 'Failed to update package category' }
  }
}

export async function deletePackageCategoryAction(categoryId: string): Promise<ActionResult> {
  try {
    // Get current user to check permissions
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current user profile
    const currentProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    })

    if (!currentProfile || currentProfile.role !== 'admin') {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Check if category has packages
    const packagesCount = await prisma.package.count({
      where: { category_id: categoryId }
    })

    if (packagesCount > 0) {
      return { success: false, error: 'Cannot delete category with existing packages' }
    }

    // Delete package category
    await prisma.packageCategory.delete({
      where: { id: categoryId }
    })

    revalidatePath('/admin/packages/categories')
    return { success: true }
  } catch (error: any) {
    console.error('Error in deletePackageCategoryAction:', error)
    return { success: false, error: error.message || 'Failed to delete package category' }
  }
}

// Portfolio Categories
export async function getPortfolioCategoriesAction(): Promise<ActionResult<PortfolioCategory[]>> {
  try {
    // Get current user to check permissions
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current user profile
    const currentProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true, studio_id: true }
    })

    if (!currentProfile || currentProfile.role !== 'admin') {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Get portfolio categories with portfolio counts
    const categories = await prisma.portfolioCategory.findMany({
      include: {
        _count: {
          select: {
            portfolios: true
          }
        }
      },
      orderBy: {
        display_order: 'asc'
      }
    })

    const transformedCategories: PortfolioCategory[] = categories.map((category) => ({
      id: category.id,
      studio_id: category.studio_id || '',
      name: category.name,
      description: category.description,
      display_order: category.display_order || 0,
      is_active: category.is_active || false,
      created_at: category.created_at?.toISOString() || '',
      portfolios_count: category._count.portfolios
    }))

    return { success: true, data: transformedCategories }
  } catch (error: any) {
    console.error('Error in getPortfolioCategoriesAction:', error)
    return { success: false, error: error.message || 'An error occurred' }
  }
}

export async function createPortfolioCategoryAction(
  studioId: string,
  categoryData: CreateCategoryData
): Promise<ActionResult> {
  try {
    // Get current user to check permissions
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current user profile
    const currentProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    })

    if (!currentProfile || currentProfile.role !== 'admin') {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Create portfolio category
    await prisma.portfolioCategory.create({
      data: {
        studio_id: studioId,
        name: categoryData.name,
        description: categoryData.description,
        display_order: categoryData.display_order || 0,
      }
    })

    revalidatePath('/admin/portfolio/categories')
    return { success: true }
  } catch (error: any) {
    console.error('Error in createPortfolioCategoryAction:', error)
    return { success: false, error: error.message || 'Failed to create portfolio category' }
  }
}

export async function updatePortfolioCategoryAction(
  categoryId: string,
  categoryData: UpdateCategoryData
): Promise<ActionResult> {
  try {
    // Get current user to check permissions
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current user profile
    const currentProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    })

    if (!currentProfile || currentProfile.role !== 'admin') {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Update portfolio category
    await prisma.portfolioCategory.update({
      where: { id: categoryId },
      data: categoryData
    })

    revalidatePath('/admin/portfolio/categories')
    return { success: true }
  } catch (error: any) {
    console.error('Error in updatePortfolioCategoryAction:', error)
    return { success: false, error: error.message || 'Failed to update portfolio category' }
  }
}

export async function deletePortfolioCategoryAction(categoryId: string): Promise<ActionResult> {
  try {
    // Get current user to check permissions
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current user profile
    const currentProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    })

    if (!currentProfile || currentProfile.role !== 'admin') {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Check if category has portfolios
    const portfoliosCount = await prisma.portfolio.count({
      where: { category_id: categoryId }
    })

    if (portfoliosCount > 0) {
      return { success: false, error: 'Cannot delete category with existing portfolios' }
    }

    // Delete portfolio category
    await prisma.portfolioCategory.delete({
      where: { id: categoryId }
    })

    revalidatePath('/admin/portfolio/categories')
    return { success: true }
  } catch (error: any) {
    console.error('Error in deletePortfolioCategoryAction:', error)
    return { success: false, error: error.message || 'Failed to delete portfolio category' }
  }
}