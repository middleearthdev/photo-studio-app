"use server"

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'

export interface Package {
  id: string
  studio_id: string | null
  category_id: string | null
  name: string
  description: string | null
  duration_minutes: number | null
  price: number
  dp_percentage: number | null
  includes: string[] | null
  is_popular: boolean | null
  is_active: boolean | null
  created_at: string
  updated_at: string
  // Relations
  category?: {
    id: string
    name: string
  } | null
  addons_count?: number
}

export interface PackageCategory {
  id: string
  studio_id: string | null
  name: string
  description: string | null
  display_order: number | null
  is_active: boolean | null
  created_at: string
  updated_at: string
}

export interface CreatePackageData {
  studio_id: string
  category_id?: string
  name: string
  description?: string
  duration_minutes: number
  price: number
  dp_percentage: number
  includes?: string[]
  is_popular?: boolean
  facility_ids?: string[]
}

export interface UpdatePackageData extends Partial<CreatePackageData> {
  is_active?: boolean
}

export interface CreatePackageCategoryData {
  studio_id: string
  name: string
  description?: string
  display_order?: number
}

export interface UpdatePackageCategoryData extends Partial<CreatePackageCategoryData> {
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

// Package Categories Actions
export async function getPackageCategoriesAction(studioId?: string): Promise<ActionResult<PackageCategory[]>> {
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

    // Build where clause
    const where: any = {}
    
    // Filter by studio if specified, otherwise use user's studio
    const targetStudioId = studioId || currentProfile.studio_id
    if (targetStudioId) {
      where.studio_id = targetStudioId
    }

    const categories = await prisma.packageCategory.findMany({
      where,
      orderBy: { display_order: 'asc' }
    })

    const formattedCategories = categories.map(category => ({
      ...category,
      created_at: category.created_at?.toISOString() || '',
      updated_at: category.created_at?.toISOString() || '' // Use created_at as updated_at since schema doesn't have updated_at
    }))

    return { success: true, data: formattedCategories }
  } catch (error: any) {
    console.error('Error in getPackageCategoriesAction:', error)
    return { success: false, error: error.message || 'An error occurred' }
  }
}

export async function createPackageCategoryAction(categoryData: CreatePackageCategoryData): Promise<ActionResult> {
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

    // Use user's studio_id if not provided
    const targetStudioId = categoryData.studio_id || currentProfile.studio_id

    if (!targetStudioId) {
      return { success: false, error: 'Studio ID is required' }
    }

    // Create category
    await prisma.packageCategory.create({
      data: {
        studio_id: targetStudioId,
        name: categoryData.name,
        description: categoryData.description,
        display_order: categoryData.display_order || 0,
      }
    })

    revalidatePath('/admin/packages')
    return { success: true }
  } catch (error: any) {
    console.error('Error in createPackageCategoryAction:', error)
    return { success: false, error: error.message || 'Failed to create package category' }
  }
}

export async function updatePackageCategoryAction(categoryId: string, categoryData: UpdatePackageCategoryData): Promise<ActionResult> {
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

    // Update category
    await prisma.packageCategory.update({
      where: { id: categoryId },
      data: categoryData
    })

    revalidatePath('/admin/packages')
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

    // Check for packages in this category
    const packagesCount = await prisma.package.count({
      where: { category_id: categoryId }
    })

    if (packagesCount > 0) {
      return { success: false, error: 'Cannot delete category with existing packages. Please move or delete all packages first.' }
    }

    // Delete category
    await prisma.packageCategory.delete({
      where: { id: categoryId }
    })

    revalidatePath('/admin/packages')
    return { success: true }
  } catch (error: any) {
    console.error('Error in deletePackageCategoryAction:', error)
    return { success: false, error: error.message || 'Failed to delete package category' }
  }
}

// Packages Actions
export async function getPackagesAction(studioId?: string): Promise<ActionResult<Package[]>> {
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

    // Build where clause
    const where: any = {}
    
    // Filter by studio if specified, otherwise use user's studio
    const targetStudioId = studioId || currentProfile.studio_id
    if (targetStudioId) {
      where.studio_id = targetStudioId
    }

    const packages = await prisma.package.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        },
        package_addons: {
          select: {
            id: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    // Transform packages to include addons_count as a number
    const transformedPackages = packages.map((pkg) => ({
      ...pkg,
      price: Number(pkg.price),
      dp_percentage: pkg.dp_percentage ? Number(pkg.dp_percentage) : null,
      created_at: pkg.created_at?.toISOString() || '',
      updated_at: pkg.updated_at?.toISOString() || '',
      includes: Array.isArray(pkg.includes) ? pkg.includes as string[] : null,
      addons_count: pkg.package_addons?.length || 0,
      package_addons: undefined // Remove the raw package_addons data
    }))

    return { success: true, data: transformedPackages }
  } catch (error: any) {
    console.error('Error in getPackagesAction:', error)
    return { success: false, error: error.message || 'An error occurred' }
  }
}

export async function getPackageAction(packageId: string): Promise<ActionResult<Package & { facility_ids?: string[] }>> {
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

    // Get package
    const packageData = await prisma.package.findUnique({
      where: { id: packageId },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!packageData) {
      return { success: false, error: 'Package not found' }
    }

    // Get package facilities (only included ones)
    const packageFacilities = await prisma.packageFacility.findMany({
      where: {
        package_id: packageId,
        is_included: true
      },
      select: { facility_id: true }
    })

    const facility_ids = packageFacilities.map(pf => pf.facility_id).filter((id): id is string => id !== null)

    const formattedPackage = {
      ...packageData,
      price: Number(packageData.price),
      dp_percentage: packageData.dp_percentage ? Number(packageData.dp_percentage) : null,
      created_at: packageData.created_at?.toISOString() || '',
      updated_at: packageData.updated_at?.toISOString() || '',
      includes: Array.isArray(packageData.includes) ? packageData.includes as string[] : null,
      facility_ids
    }

    return { success: true, data: formattedPackage }
  } catch (error: any) {
    console.error('Error in getPackageAction:', error)
    return { success: false, error: error.message || 'An error occurred' }
  }
}

export async function createPackageAction(packageData: CreatePackageData): Promise<ActionResult> {
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

    // Use user's studio_id if not provided
    const targetStudioId = packageData.studio_id || currentProfile.studio_id

    if (!targetStudioId) {
      return { success: false, error: 'Studio ID is required' }
    }

    // Start transaction
    const createdPackage = await prisma.package.create({
      data: {
        studio_id: targetStudioId,
        category_id: packageData.category_id,
        name: packageData.name,
        description: packageData.description,
        duration_minutes: packageData.duration_minutes,
        price: packageData.price,
        dp_percentage: packageData.dp_percentage,
        includes: packageData.includes,
        is_popular: packageData.is_popular || false,
      }
    })

    // Create package facility relationships if specified
    if (packageData.facility_ids && packageData.facility_ids.length > 0) {
      const facilityInserts = packageData.facility_ids.map(facilityId => ({
        package_id: createdPackage.id,
        facility_id: facilityId,
        is_included: true,
        additional_cost: 0
      }))

      try {
        await prisma.packageFacility.createMany({
          data: facilityInserts
        })
      } catch (facilityError) {
        console.error('Error creating package facilities:', facilityError)
        // Don't fail the entire operation, just log the error
      }
    }

    revalidatePath('/admin/packages')
    return { success: true }
  } catch (error: any) {
    console.error('Error in createPackageAction:', error)
    return { success: false, error: error.message || 'Failed to create package' }
  }
}

export async function updatePackageAction(packageId: string, packageData: UpdatePackageData): Promise<ActionResult> {
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

    // Extract facility_ids from update data
    const { facility_ids, ...updateData } = packageData

    // Update package
    await prisma.package.update({
      where: { id: packageId },
      data: updateData
    })

    // Update package facility relationships if specified
    if (facility_ids !== undefined) {
      // Delete existing relationships
      await prisma.packageFacility.deleteMany({
        where: { package_id: packageId }
      })

      // Create new relationships
      if (facility_ids.length > 0) {
        const facilityInserts = facility_ids.map(facilityId => ({
          package_id: packageId,
          facility_id: facilityId,
          is_included: true,
          additional_cost: 0
        }))

        try {
          await prisma.packageFacility.createMany({
            data: facilityInserts
          })
        } catch (facilityError) {
          console.error('Error updating package facilities:', facilityError)
          // Don't fail the entire operation, just log the error
        }
      }
    }

    revalidatePath('/admin/packages')
    return { success: true }
  } catch (error: any) {
    console.error('Error in updatePackageAction:', error)
    return { success: false, error: error.message || 'Failed to update package' }
  }
}

export async function deletePackageAction(packageId: string): Promise<ActionResult> {
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

    // Check for reservations using this package
    const reservationsCount = await prisma.reservation.count({
      where: { package_id: packageId }
    })

    if (reservationsCount > 0) {
      return { success: false, error: 'Cannot delete package with existing reservations.' }
    }

    // Delete package (CASCADE will handle package_facilities)
    await prisma.package.delete({
      where: { id: packageId }
    })

    revalidatePath('/admin/packages')
    return { success: true }
  } catch (error: any) {
    console.error('Error in deletePackageAction:', error)
    return { success: false, error: error.message || 'Failed to delete package' }
  }
}

export async function togglePackageStatusAction(packageId: string): Promise<ActionResult> {
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

    // Get current package status
    const packageData = await prisma.package.findUnique({
      where: { id: packageId },
      select: { is_active: true }
    })

    if (!packageData) {
      return { success: false, error: 'Package not found' }
    }

    // Toggle status
    const newStatus = !packageData.is_active
    await prisma.package.update({
      where: { id: packageId },
      data: {
        is_active: newStatus
      }
    })

    revalidatePath('/admin/packages')
    return { success: true }
  } catch (error: any) {
    console.error('Error in togglePackageStatusAction:', error)
    return { success: false, error: error.message || 'Failed to update package status' }
  }
}