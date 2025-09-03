"use server"

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface Package {
  id: string
  studio_id: string
  category_id: string | null
  name: string
  description: string | null
  duration_minutes: number
  price: number
  dp_percentage: number
  max_photos: number | null
  max_edited_photos: number | null
  includes: string[] | null
  is_popular: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  // Relations
  category?: {
    id: string
    name: string
  }
}

export interface PackageCategory {
  id: string
  studio_id: string
  name: string
  description: string | null
  display_order: number
  is_active: boolean
  created_at: string
}

export interface CreatePackageData {
  studio_id: string
  category_id?: string
  name: string
  description?: string
  duration_minutes: number
  price: number
  dp_percentage: number
  max_photos?: number
  max_edited_photos?: number
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

// Package Categories Actions
export async function getPackageCategoriesAction(studioId?: string): Promise<ActionResult<PackageCategory[]>> {
  try {
    const supabase = await createClient()

    // Get current user to check permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current user profile
    const { data: currentProfile } = await supabase
      .from('user_profiles')
      .select('role, studio_id')
      .eq('id', user.id)
      .single()

    if (!currentProfile || currentProfile.role !== 'admin') {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Build query
    let query = supabase
      .from('package_categories')
      .select('*')
      .order('display_order', { ascending: true })

    // Filter by studio if specified, otherwise use user's studio
    const targetStudioId = studioId || currentProfile.studio_id
    if (targetStudioId) {
      query = query.eq('studio_id', targetStudioId)
    }

    const { data: categories, error } = await query

    if (error) {
      console.error('Error fetching package categories:', error)
      return { success: false, error: 'Failed to fetch package categories' }
    }

    return { success: true, data: categories || [] }
  } catch (error: any) {
    console.error('Error in getPackageCategoriesAction:', error)
    return { success: false, error: error.message || 'An error occurred' }
  }
}

export async function createPackageCategoryAction(categoryData: CreatePackageCategoryData): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    // Get current user to check permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current user profile
    const { data: currentProfile } = await supabase
      .from('user_profiles')
      .select('role, studio_id')
      .eq('id', user.id)
      .single()

    if (!currentProfile || currentProfile.role !== 'admin') {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Use user's studio_id if not provided
    const targetStudioId = categoryData.studio_id || currentProfile.studio_id

    // Create category
    const { error } = await supabase
      .from('package_categories')
      .insert({
        studio_id: targetStudioId,
        name: categoryData.name,
        description: categoryData.description,
        display_order: categoryData.display_order || 0,
      })

    if (error) {
      console.error('Error creating package category:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/packages')
    return { success: true }
  } catch (error: any) {
    console.error('Error in createPackageCategoryAction:', error)
    return { success: false, error: error.message || 'Failed to create package category' }
  }
}

export async function updatePackageCategoryAction(categoryId: string, categoryData: UpdatePackageCategoryData): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    // Get current user to check permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current user profile
    const { data: currentProfile } = await supabase
      .from('user_profiles')
      .select('role, studio_id')
      .eq('id', user.id)
      .single()

    if (!currentProfile || currentProfile.role !== 'admin') {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Update category
    const { error } = await supabase
      .from('package_categories')
      .update(categoryData)
      .eq('id', categoryId)

    if (error) {
      console.error('Error updating package category:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/packages')
    return { success: true }
  } catch (error: any) {
    console.error('Error in updatePackageCategoryAction:', error)
    return { success: false, error: error.message || 'Failed to update package category' }
  }
}

export async function deletePackageCategoryAction(categoryId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    // Get current user to check permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current user profile
    const { data: currentProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!currentProfile || currentProfile.role !== 'admin') {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Check for packages in this category
    const { data: packages, error: packagesError } = await supabase
      .from('packages')
      .select('id')
      .eq('category_id', categoryId)
      .limit(1)

    if (packagesError) {
      console.error('Error checking packages:', packagesError)
      return { success: false, error: 'Error checking related data' }
    }

    if (packages && packages.length > 0) {
      return { success: false, error: 'Cannot delete category with existing packages. Please move or delete all packages first.' }
    }

    // Delete category
    const { error } = await supabase
      .from('package_categories')
      .delete()
      .eq('id', categoryId)

    if (error) {
      console.error('Error deleting package category:', error)
      return { success: false, error: error.message }
    }

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
    const supabase = await createClient()

    // Get current user to check permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current user profile
    const { data: currentProfile } = await supabase
      .from('user_profiles')
      .select('role, studio_id')
      .eq('id', user.id)
      .single()

    if (!currentProfile || currentProfile.role !== 'admin') {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Build query
    let query = supabase
      .from('packages')
      .select(`
        *,
        category:package_categories(id, name)
      `)
      .order('created_at', { ascending: false })

    // Filter by studio if specified, otherwise use user's studio
    const targetStudioId = studioId || currentProfile.studio_id
    if (targetStudioId) {
      query = query.eq('studio_id', targetStudioId)
    }

    const { data: packages, error } = await query

    if (error) {
      console.error('Error fetching packages:', error)
      return { success: false, error: 'Failed to fetch packages' }
    }

    return { success: true, data: packages || [] }
  } catch (error: any) {
    console.error('Error in getPackagesAction:', error)
    return { success: false, error: error.message || 'An error occurred' }
  }
}

export async function getPackageAction(packageId: string): Promise<ActionResult<Package & { facility_ids?: string[] }>> {
  try {
    const supabase = await createClient()

    // Get current user to check permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current user profile
    const { data: currentProfile } = await supabase
      .from('user_profiles')
      .select('role, studio_id')
      .eq('id', user.id)
      .single()

    if (!currentProfile || currentProfile.role !== 'admin') {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Get package
    const { data: packageData, error } = await supabase
      .from('packages')
      .select(`
        *,
        category:package_categories(id, name)
      `)
      .eq('id', packageId)
      .single()

    if (error) {
      console.error('Error fetching package:', error)
      return { success: false, error: 'Package not found' }
    }

    // Get package facilities (only included ones)
    const { data: packageFacilities, error: facilityError } = await supabase
      .from('package_facilities')
      .select('facility_id')
      .eq('package_id', packageId)
      .eq('is_included', true)

    if (facilityError) {
      console.error('Error fetching package facilities:', facilityError)
    }

    const facility_ids = packageFacilities?.map(pf => pf.facility_id) || []

    return { success: true, data: { ...packageData, facility_ids } }
  } catch (error: any) {
    console.error('Error in getPackageAction:', error)
    return { success: false, error: error.message || 'An error occurred' }
  }
}

export async function createPackageAction(packageData: CreatePackageData): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    // Get current user to check permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current user profile
    const { data: currentProfile } = await supabase
      .from('user_profiles')
      .select('role, studio_id')
      .eq('id', user.id)
      .single()

    if (!currentProfile || currentProfile.role !== 'admin') {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Use user's studio_id if not provided
    const targetStudioId = packageData.studio_id || currentProfile.studio_id

    // Start transaction
    const { data: createdPackage, error: packageError } = await supabase
      .from('packages')
      .insert({
        studio_id: targetStudioId,
        category_id: packageData.category_id,
        name: packageData.name,
        description: packageData.description,
        duration_minutes: packageData.duration_minutes,
        price: packageData.price,
        dp_percentage: packageData.dp_percentage,
        max_photos: packageData.max_photos,
        max_edited_photos: packageData.max_edited_photos,
        includes: packageData.includes,
        is_popular: packageData.is_popular || false,
      })
      .select()
      .single()

    if (packageError) {
      console.error('Error creating package:', packageError)
      return { success: false, error: packageError.message }
    }

    // Create package facility relationships if specified
    if (packageData.facility_ids && packageData.facility_ids.length > 0) {
      const facilityInserts = packageData.facility_ids.map(facilityId => ({
        package_id: createdPackage.id,
        facility_id: facilityId,
        is_included: true,
        additional_cost: 0
      }))

      const { error: facilityError } = await supabase
        .from('package_facilities')
        .insert(facilityInserts)

      if (facilityError) {
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
    const supabase = await createClient()

    // Get current user to check permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current user profile
    const { data: currentProfile } = await supabase
      .from('user_profiles')
      .select('role, studio_id')
      .eq('id', user.id)
      .single()

    if (!currentProfile || currentProfile.role !== 'admin') {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Extract facility_ids from update data
    const { facility_ids, ...updateData } = packageData

    // Update package
    const { error: updateError } = await supabase
      .from('packages')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', packageId)

    if (updateError) {
      console.error('Error updating package:', updateError)
      return { success: false, error: updateError.message }
    }

    // Update package facility relationships if specified
    if (facility_ids !== undefined) {
      // Delete existing relationships
      await supabase
        .from('package_facilities')
        .delete()
        .eq('package_id', packageId)

      // Create new relationships
      if (facility_ids.length > 0) {
        const facilityInserts = facility_ids.map(facilityId => ({
          package_id: packageId,
          facility_id: facilityId,
          is_included: true,
          additional_cost: 0
        }))

        const { error: facilityError } = await supabase
          .from('package_facilities')
          .insert(facilityInserts)

        if (facilityError) {
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
    const supabase = await createClient()

    // Get current user to check permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current user profile
    const { data: currentProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!currentProfile || currentProfile.role !== 'admin') {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Check for reservations using this package
    const { data: reservations, error: reservationsError } = await supabase
      .from('reservations')
      .select('id')
      .eq('package_id', packageId)
      .limit(1)

    if (reservationsError) {
      console.error('Error checking reservations:', reservationsError)
      return { success: false, error: 'Error checking related data' }
    }

    if (reservations && reservations.length > 0) {
      return { success: false, error: 'Cannot delete package with existing reservations.' }
    }

    // Delete package (CASCADE will handle package_facilities)
    const { error } = await supabase
      .from('packages')
      .delete()
      .eq('id', packageId)

    if (error) {
      console.error('Error deleting package:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/packages')
    return { success: true }
  } catch (error: any) {
    console.error('Error in deletePackageAction:', error)
    return { success: false, error: error.message || 'Failed to delete package' }
  }
}

export async function togglePackageStatusAction(packageId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    // Get current user to check permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current user profile
    const { data: currentProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!currentProfile || currentProfile.role !== 'admin') {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Get current package status
    const { data: packageData, error: fetchError } = await supabase
      .from('packages')
      .select('is_active')
      .eq('id', packageId)
      .single()

    if (fetchError) {
      console.error('Error fetching package:', fetchError)
      return { success: false, error: 'Package not found' }
    }

    // Toggle status
    const newStatus = !packageData.is_active
    const { error } = await supabase
      .from('packages')
      .update({
        is_active: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', packageId)

    if (error) {
      console.error('Error updating package status:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/packages')
    return { success: true }
  } catch (error: any) {
    console.error('Error in togglePackageStatusAction:', error)
    return { success: false, error: error.message || 'Failed to update package status' }
  }
}