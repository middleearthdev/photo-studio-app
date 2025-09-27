"use server"

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { PaginationParams, PaginatedResult, calculatePagination } from '@/lib/constants/pagination'

export interface PortfolioCategory {
  id: string
  studio_id: string
  name: string
  description: string | null
  display_order: number
  is_active: boolean
  created_at: string
  updated_at?: string
}

export interface Portfolio {
  id: string
  studio_id: string
  category_id: string | null
  title: string
  description: string | null
  image_url: string
  alt_text: string | null
  display_order: number
  is_featured: boolean
  is_active: boolean
  metadata: any
  created_at: string
  updated_at: string
  // Relations
  category?: {
    id: string
    name: string
  }
}

export interface CreatePortfolioData {
  studio_id: string
  category_id?: string
  title: string
  description?: string
  image_url: string
  alt_text?: string
  display_order?: number
  is_featured?: boolean
  is_active?: boolean
  metadata?: any
}

export interface UpdatePortfolioData {
  category_id?: string | null
  title?: string
  description?: string
  image_url?: string
  alt_text?: string
  display_order?: number
  is_featured?: boolean
  is_active?: boolean
  metadata?: any
}

export interface CreateCategoryData {
  studio_id: string
  name: string
  description?: string
  display_order?: number
  is_active?: boolean
}

export interface UpdateCategoryData {
  name?: string
  description?: string
  display_order?: number
  is_active?: boolean
}

// Get all portfolios for a studio (legacy - without pagination)
export async function getPortfolios(studioId: string): Promise<Portfolio[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('portfolios')
    .select(`
      *,
      category:portfolio_categories(id, name)
    `)
    .eq('studio_id', studioId)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching portfolios:', error)
    throw new Error(`Failed to fetch portfolios: ${error.message}`)
  }
  
  return data || []
}

// Get paginated portfolios for a studio
export async function getPaginatedPortfolios(
  studioId: string,
  params: PaginationParams & {
    status?: 'active' | 'inactive' | 'all'
    category?: string
    featured?: 'featured' | 'not_featured' | 'all'
  } = {}
): Promise<PaginatedResult<Portfolio>> {
  const supabase = await createClient()
  
  const { page = 1, pageSize = 10, search = '', status = 'all', category, featured = 'all' } = params
  const { offset, pageSize: validPageSize } = calculatePagination(page, pageSize, 0)

  // Build the query
  let query = supabase
    .from('portfolios')
    .select(`
      *,
      category:portfolio_categories(id, name)
    `, { count: 'exact' })
    .eq('studio_id', studioId)

  // Apply filters
  if (status !== 'all') {
    query = query.eq('is_active', status === 'active')
  }

  if (category && category !== 'all') {
    if (category === 'uncategorized') {
      query = query.is('category_id', null)
    } else {
      query = query.eq('category_id', category)
    }
  }

  if (featured !== 'all') {
    query = query.eq('is_featured', featured === 'featured')
  }

  // Apply search
  if (search.trim()) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,alt_text.ilike.%${search}%`)
  }

  // Apply pagination and ordering
  const { data, error, count } = await query
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })
    .range(offset, offset + validPageSize - 1)

  if (error) {
    console.error('Error fetching paginated portfolios:', error)
    throw new Error(`Failed to fetch portfolios: ${error.message}`)
  }

  const total = count || 0
  const pagination = calculatePagination(page, validPageSize, total)

  return {
    data: data || [],
    pagination
  }
}

// Get portfolio by ID
export async function getPortfolioById(id: string): Promise<Portfolio | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('portfolios')
    .select(`
      *,
      category:portfolio_categories(id, name)
    `)
    .eq('id', id)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('Error fetching portfolio:', error)
    throw new Error(`Failed to fetch portfolio: ${error.message}`)
  }
  
  return data
}

// Create new portfolio
export async function createPortfolio(data: CreatePortfolioData): Promise<Portfolio> {
  const supabase = await createClient()
  
  const portfolioData = {
    studio_id: data.studio_id,
    category_id: data.category_id || null,
    title: data.title,
    description: data.description || null,
    image_url: data.image_url,
    alt_text: data.alt_text || null,
    display_order: data.display_order || 0,
    is_featured: data.is_featured || false,
    is_active: data.is_active ?? true,
    metadata: data.metadata || {},
  }
  
  const { data: portfolio, error } = await supabase
    .from('portfolios')
    .insert(portfolioData)
    .select(`
      *,
      category:portfolio_categories(id, name)
    `)
    .single()
  
  if (error) {
    console.error('Error creating portfolio:', error)
    throw new Error(`Failed to create portfolio: ${error.message}`)
  }
  
  revalidatePath('/admin/portfolio')
  return portfolio
}

// Update portfolio
export async function updatePortfolio(id: string, data: UpdatePortfolioData): Promise<Portfolio> {
  const supabase = await createClient()
  
  const updateData = {
    ...data,
    category_id: data.category_id === '' ? null : data.category_id,
    updated_at: new Date().toISOString(),
  }
  
  const { data: portfolio, error } = await supabase
    .from('portfolios')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      category:portfolio_categories(id, name)
    `)
    .single()
  
  if (error) {
    console.error('Error updating portfolio:', error)
    throw new Error(`Failed to update portfolio: ${error.message}`)
  }
  
  revalidatePath('/admin/portfolio')
  return portfolio
}

// Delete portfolio
export async function deletePortfolio(id: string): Promise<void> {
  const supabase = await createClient()
  
  // Get portfolio data to clean up image
  const { data: portfolio, error: fetchError } = await supabase
    .from('portfolios')
    .select('image_url')
    .eq('id', id)
    .single()
  
  if (fetchError) {
    console.error('Error fetching portfolio for deletion:', fetchError)
    throw new Error(`Failed to fetch portfolio: ${fetchError.message}`)
  }
  
  // Delete the portfolio record
  const { error } = await supabase
    .from('portfolios')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting portfolio:', error)
    throw new Error(`Failed to delete portfolio: ${error.message}`)
  }
  
  // Clean up the image from storage (async, don't wait for it)
  if (portfolio?.image_url) {
    cleanupPortfolioImage(portfolio.image_url).catch(err => 
      console.warn('Failed to cleanup image after portfolio deletion:', err)
    )
  }
  
  revalidatePath('/admin/portfolio')
}

// Toggle portfolio status
export async function togglePortfolioStatus(id: string): Promise<Portfolio> {
  const supabase = await createClient()
  
  // Get current status
  const { data: currentPortfolio, error: fetchError } = await supabase
    .from('portfolios')
    .select('is_active')
    .eq('id', id)
    .single()
  
  if (fetchError) {
    console.error('Error fetching portfolio:', fetchError)
    throw new Error(`Failed to fetch portfolio: ${fetchError.message}`)
  }
  
  // Toggle status
  const { data: portfolio, error } = await supabase
    .from('portfolios')
    .update({ 
      is_active: !currentPortfolio.is_active,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select(`
      *,
      category:portfolio_categories(id, name)
    `)
    .single()
  
  if (error) {
    console.error('Error toggling portfolio status:', error)
    throw new Error(`Failed to toggle portfolio status: ${error.message}`)
  }
  
  revalidatePath('/admin/portfolio')
  return portfolio
}

// Toggle portfolio featured status
export async function togglePortfolioFeatured(id: string): Promise<Portfolio> {
  const supabase = await createClient()
  
  // Get current featured status
  const { data: currentPortfolio, error: fetchError } = await supabase
    .from('portfolios')
    .select('is_featured')
    .eq('id', id)
    .single()
  
  if (fetchError) {
    console.error('Error fetching portfolio:', fetchError)
    throw new Error(`Failed to fetch portfolio: ${fetchError.message}`)
  }
  
  // Toggle featured status
  const { data: portfolio, error } = await supabase
    .from('portfolios')
    .update({ 
      is_featured: !currentPortfolio.is_featured,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select(`
      *,
      category:portfolio_categories(id, name)
    `)
    .single()
  
  if (error) {
    console.error('Error toggling portfolio featured status:', error)
    throw new Error(`Failed to toggle portfolio featured status: ${error.message}`)
  }
  
  revalidatePath('/admin/portfolio')
  return portfolio
}

// ===== PORTFOLIO CATEGORIES =====

// Get all categories for a studio
export async function getPortfolioCategories(studioId: string): Promise<PortfolioCategory[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('portfolio_categories')
    .select('*')
    .eq('studio_id', studioId)
    .order('display_order', { ascending: true })
    .order('name', { ascending: true })
  
  if (error) {
    console.error('Error fetching portfolio categories:', error)
    throw new Error(`Failed to fetch portfolio categories: ${error.message}`)
  }
  
  return data || []
}

// Create new category
export async function createPortfolioCategory(data: CreateCategoryData): Promise<PortfolioCategory> {
  const supabase = await createClient()
  
  const categoryData = {
    studio_id: data.studio_id,
    name: data.name,
    description: data.description || null,
    display_order: data.display_order || 0,
    is_active: data.is_active ?? true,
  }
  
  const { data: category, error } = await supabase
    .from('portfolio_categories')
    .insert(categoryData)
    .select()
    .single()
  
  if (error) {
    console.error('Error creating portfolio category:', error)
    throw new Error(`Failed to create portfolio category: ${error.message}`)
  }
  
  revalidatePath('/admin/portfolio')
  return category
}

// Update category
export async function updatePortfolioCategory(id: string, data: UpdateCategoryData): Promise<PortfolioCategory> {
  const supabase = await createClient()
  
  const updateData = {
    ...data,
    updated_at: new Date().toISOString(),
  }
  
  const { data: category, error } = await supabase
    .from('portfolio_categories')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating portfolio category:', error)
    throw new Error(`Failed to update portfolio category: ${error.message}`)
  }
  
  revalidatePath('/admin/portfolio')
  return category
}

// Delete category
export async function deletePortfolioCategory(id: string): Promise<void> {
  const supabase = await createClient()
  
  // Check if category is being used by any portfolios
  const { data: portfolios } = await supabase
    .from('portfolios')
    .select('id')
    .eq('category_id', id)
    .limit(1)
  
  if (portfolios && portfolios.length > 0) {
    throw new Error('Cannot delete category that is being used by portfolios')
  }
  
  const { error } = await supabase
    .from('portfolio_categories')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting portfolio category:', error)
    throw new Error(`Failed to delete portfolio category: ${error.message}`)
  }
  
  revalidatePath('/admin/portfolio')
}

// ===== IMAGE MANAGEMENT HELPERS =====

/**
 * Extract storage path from Supabase URL for cleanup
 */
function extractStoragePathFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/')
    const storageIndex = pathParts.findIndex(part => part === 'storage')
    
    if (storageIndex !== -1 && pathParts[storageIndex + 2]) {
      // Remove /storage/v1/object/public/bucket-name/ and get the file path
      return pathParts.slice(storageIndex + 4).join('/')
    }
    
    return null
  } catch {
    return null
  }
}

/**
 * Clean up portfolio image from storage when portfolio is deleted
 */
export async function cleanupPortfolioImage(imageUrl: string): Promise<void> {
  try {
    const supabase = await createClient()
    const path = extractStoragePathFromUrl(imageUrl)
    
    if (path && imageUrl.includes('portfolio-images')) {
      const { error } = await supabase.storage
        .from('portfolio-images')
        .remove([path])
      
      if (error) {
        console.warn('Failed to cleanup portfolio image:', error.message)
      }
    }
  } catch (error) {
    console.warn('Error during image cleanup:', error)
  }
}

/**
 * Validate if user has permission to upload to this studio
 */
export async function validateStudioUploadPermission(studioId: string): Promise<boolean> {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return false
    }

    // Check if user has access to this studio
    const { data, error } = await supabase
      .from('user_studios')
      .select('studio_id')
      .eq('studio_id', studioId)
      .eq('user_id', user.id)
      .single()

    return !error && !!data
  } catch {
    return false
  }
}