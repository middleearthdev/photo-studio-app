"use server"

import { createClient } from '@/lib/supabase/server'
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

// Package Categories
export async function getPackageCategoriesAction(): Promise<ActionResult<PackageCategory[]>> {
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

    // Get package categories with package counts
    const { data: categories, error } = await supabase
      .from('package_categories')
      .select(`
        *,
        packages:packages(count)
      `)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching package categories:', error)
      return { success: false, error: 'Failed to fetch package categories' }
    }

    const transformedCategories: PackageCategory[] = (categories || []).map((category: any) => ({
      ...category,
      packages_count: category.packages?.[0]?.count || 0
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

    // Create package category
    const { error } = await supabase
      .from('package_categories')
      .insert({
        studio_id: studioId,
        name: categoryData.name,
        description: categoryData.description,
        display_order: categoryData.display_order || 0,
      })

    if (error) {
      console.error('Error creating package category:', error)
      return { success: false, error: error.message }
    }

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

    // Update package category
    const { error } = await supabase
      .from('package_categories')
      .update(categoryData)
      .eq('id', categoryId)

    if (error) {
      console.error('Error updating package category:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/packages/categories')
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

    // Check if category has packages
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
      return { success: false, error: 'Cannot delete category with existing packages' }
    }

    // Delete package category
    const { error } = await supabase
      .from('package_categories')
      .delete()
      .eq('id', categoryId)

    if (error) {
      console.error('Error deleting package category:', error)
      return { success: false, error: error.message }
    }

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

    // Get portfolio categories with portfolio counts
    const { data: categories, error } = await supabase
      .from('portfolio_categories')
      .select(`
        *,
        portfolios:portfolios(count)
      `)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching portfolio categories:', error)
      return { success: false, error: 'Failed to fetch portfolio categories' }
    }

    const transformedCategories: PortfolioCategory[] = (categories || []).map((category: any) => ({
      ...category,
      portfolios_count: category.portfolios?.[0]?.count || 0
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

    // Create portfolio category
    const { error } = await supabase
      .from('portfolio_categories')
      .insert({
        studio_id: studioId,
        name: categoryData.name,
        description: categoryData.description,
        display_order: categoryData.display_order || 0,
      })

    if (error) {
      console.error('Error creating portfolio category:', error)
      return { success: false, error: error.message }
    }

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

    // Update portfolio category
    const { error } = await supabase
      .from('portfolio_categories')
      .update(categoryData)
      .eq('id', categoryId)

    if (error) {
      console.error('Error updating portfolio category:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/portfolio/categories')
    return { success: true }
  } catch (error: any) {
    console.error('Error in updatePortfolioCategoryAction:', error)
    return { success: false, error: error.message || 'Failed to update portfolio category' }
  }
}

export async function deletePortfolioCategoryAction(categoryId: string): Promise<ActionResult> {
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

    // Check if category has portfolios
    const { data: portfolios, error: portfoliosError } = await supabase
      .from('portfolios')
      .select('id')
      .eq('category_id', categoryId)
      .limit(1)

    if (portfoliosError) {
      console.error('Error checking portfolios:', portfoliosError)
      return { success: false, error: 'Error checking related data' }
    }

    if (portfolios && portfolios.length > 0) {
      return { success: false, error: 'Cannot delete category with existing portfolios' }
    }

    // Delete portfolio category
    const { error } = await supabase
      .from('portfolio_categories')
      .delete()
      .eq('id', categoryId)

    if (error) {
      console.error('Error deleting portfolio category:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/portfolio/categories')
    return { success: true }
  } catch (error: any) {
    console.error('Error in deletePortfolioCategoryAction:', error)
    return { success: false, error: error.message || 'Failed to delete portfolio category' }
  }
}