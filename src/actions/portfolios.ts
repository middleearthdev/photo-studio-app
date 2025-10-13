"use server"

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { PaginationParams, PaginatedResult, calculatePagination } from '@/lib/constants/pagination'

export interface PortfolioCategory {
  id: string
  studio_id: string | null
  name: string
  description: string | null
  display_order: number | null
  is_active: boolean | null
  created_at: string
  updated_at?: string
}

export interface Portfolio {
  id: string
  studio_id: string | null
  category_id: string | null
  title: string
  description: string | null
  image_url: string
  alt_text: string | null
  display_order: number | null
  is_featured: boolean | null
  is_active: boolean | null
  metadata: any
  created_at: string
  updated_at: string
  // Relations
  category?: {
    id: string
    name: string
  } | null
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

// Get all portfolios for a studio (legacy - without pagination)
export async function getPortfolios(studioId: string): Promise<Portfolio[]> {
  try {
    const portfolios = await prisma.portfolio.findMany({
      where: { studio_id: studioId },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { display_order: 'asc' },
        { created_at: 'desc' }
      ]
    })

    return portfolios.map(portfolio => ({
      ...portfolio,
      created_at: portfolio.created_at?.toISOString() || '',
      updated_at: portfolio.updated_at?.toISOString() || ''
    }))
  } catch (error: any) {
    console.error('Error fetching portfolios:', error)
    throw new Error(`Failed to fetch portfolios: ${error.message}`)
  }
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
  try {
    const { page = 1, pageSize = 10, search = '', status = 'all', category, featured = 'all' } = params
    const { offset, pageSize: validPageSize } = calculatePagination(page, pageSize, 0)

    // Build where clause
    const where: any = {
      studio_id: studioId
    }

    // Apply filters
    if (status !== 'all') {
      where.is_active = status === 'active'
    }

    if (category && category !== 'all') {
      if (category === 'uncategorized') {
        where.category_id = null
      } else {
        where.category_id = category
      }
    }

    if (featured !== 'all') {
      where.is_featured = featured === 'featured'
    }

    // Apply search
    if (search.trim()) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { alt_text: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get portfolios with count
    const [portfolios, total] = await Promise.all([
      prisma.portfolio.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: [
          { display_order: 'asc' },
          { created_at: 'desc' }
        ],
        skip: offset,
        take: validPageSize
      }),
      prisma.portfolio.count({ where })
    ])

    const formattedData = portfolios.map(portfolio => ({
      ...portfolio,
      created_at: portfolio.created_at?.toISOString() || '',
      updated_at: portfolio.updated_at?.toISOString() || ''
    }))

    const pagination = calculatePagination(page, validPageSize, total)

    return {
      data: formattedData,
      pagination
    }
  } catch (error: any) {
    console.error('Error fetching paginated portfolios:', error)
    throw new Error(`Failed to fetch portfolios: ${error.message}`)
  }
}

// Get portfolio by ID
export async function getPortfolioById(id: string): Promise<Portfolio | null> {
  try {
    const portfolio = await prisma.portfolio.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!portfolio) {
      return null
    }

    return {
      ...portfolio,
      created_at: portfolio.created_at?.toISOString() || '',
      updated_at: portfolio.updated_at?.toISOString() || ''
    }
  } catch (error: any) {
    console.error('Error fetching portfolio:', error)
    throw new Error(`Failed to fetch portfolio: ${error.message}`)
  }
}

// Create new portfolio
export async function createPortfolio(data: CreatePortfolioData): Promise<Portfolio> {
  try {
    const portfolio = await prisma.portfolio.create({
      data: {
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
      },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    revalidatePath('/admin/portfolio')
    return {
      ...portfolio,
      created_at: portfolio.created_at?.toISOString() || '',
      updated_at: portfolio.updated_at?.toISOString() || ''
    }
  } catch (error: any) {
    console.error('Error creating portfolio:', error)
    throw new Error(`Failed to create portfolio: ${error.message}`)
  }
}

// Update portfolio
export async function updatePortfolio(id: string, data: UpdatePortfolioData): Promise<Portfolio> {
  try {
    const updateData = {
      ...data,
      category_id: data.category_id === '' ? null : data.category_id,
    }

    const portfolio = await prisma.portfolio.update({
      where: { id },
      data: updateData,
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    revalidatePath('/admin/portfolio')
    return {
      ...portfolio,
      created_at: portfolio.created_at?.toISOString() || '',
      updated_at: portfolio.updated_at?.toISOString() || ''
    }
  } catch (error: any) {
    console.error('Error updating portfolio:', error)
    throw new Error(`Failed to update portfolio: ${error.message}`)
  }
}

// Delete portfolio
export async function deletePortfolio(id: string): Promise<void> {
  try {
    // Get portfolio data to clean up image
    const portfolio = await prisma.portfolio.findUnique({
      where: { id },
      select: { image_url: true }
    })

    if (!portfolio) {
      throw new Error('Portfolio not found')
    }

    // Delete the portfolio record
    await prisma.portfolio.delete({
      where: { id }
    })

    // Clean up the image from storage (async, don't wait for it)
    if (portfolio.image_url) {
      cleanupPortfolioImage(portfolio.image_url).catch(err => 
        console.warn('Failed to cleanup image after portfolio deletion:', err)
      )
    }

    revalidatePath('/admin/portfolio')
  } catch (error: any) {
    console.error('Error deleting portfolio:', error)
    throw new Error(`Failed to delete portfolio: ${error.message}`)
  }
}

// Toggle portfolio status
export async function togglePortfolioStatus(id: string): Promise<Portfolio> {
  try {
    // Get current status
    const currentPortfolio = await prisma.portfolio.findUnique({
      where: { id },
      select: { is_active: true }
    })

    if (!currentPortfolio) {
      throw new Error('Portfolio not found')
    }

    // Toggle status
    const portfolio = await prisma.portfolio.update({
      where: { id },
      data: { 
        is_active: !currentPortfolio.is_active
      },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    revalidatePath('/admin/portfolio')
    return {
      ...portfolio,
      created_at: portfolio.created_at?.toISOString() || '',
      updated_at: portfolio.updated_at?.toISOString() || ''
    }
  } catch (error: any) {
    console.error('Error toggling portfolio status:', error)
    throw new Error(`Failed to toggle portfolio status: ${error.message}`)
  }
}

// Toggle portfolio featured status
export async function togglePortfolioFeatured(id: string): Promise<Portfolio> {
  try {
    // Get current featured status
    const currentPortfolio = await prisma.portfolio.findUnique({
      where: { id },
      select: { is_featured: true }
    })

    if (!currentPortfolio) {
      throw new Error('Portfolio not found')
    }

    // Toggle featured status
    const portfolio = await prisma.portfolio.update({
      where: { id },
      data: { 
        is_featured: !currentPortfolio.is_featured
      },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    revalidatePath('/admin/portfolio')
    return {
      ...portfolio,
      created_at: portfolio.created_at?.toISOString() || '',
      updated_at: portfolio.updated_at?.toISOString() || ''
    }
  } catch (error: any) {
    console.error('Error toggling portfolio featured status:', error)
    throw new Error(`Failed to toggle portfolio featured status: ${error.message}`)
  }
}

// ===== PORTFOLIO CATEGORIES =====

// Get all categories for a studio
export async function getPortfolioCategories(studioId: string): Promise<PortfolioCategory[]> {
  try {
    const categories = await prisma.portfolioCategory.findMany({
      where: { studio_id: studioId },
      orderBy: [
        { display_order: 'asc' },
        { name: 'asc' }
      ]
    })

    return categories.map(category => ({
      ...category,
      created_at: category.created_at?.toISOString() || '',
      updated_at: category.created_at?.toISOString() || '' // Use created_at since schema doesn't have updated_at
    }))
  } catch (error: any) {
    console.error('Error fetching portfolio categories:', error)
    throw new Error(`Failed to fetch portfolio categories: ${error.message}`)
  }
}

// Create new category
export async function createPortfolioCategory(data: CreateCategoryData): Promise<PortfolioCategory> {
  try {
    const category = await prisma.portfolioCategory.create({
      data: {
        studio_id: data.studio_id,
        name: data.name,
        description: data.description || null,
        display_order: data.display_order || 0,
        is_active: data.is_active ?? true,
      }
    })

    revalidatePath('/admin/portfolio')
    return {
      ...category,
      created_at: category.created_at?.toISOString() || '',
      updated_at: category.created_at?.toISOString() || ''
    }
  } catch (error: any) {
    console.error('Error creating portfolio category:', error)
    throw new Error(`Failed to create portfolio category: ${error.message}`)
  }
}

// Update category
export async function updatePortfolioCategory(id: string, data: UpdateCategoryData): Promise<PortfolioCategory> {
  try {
    const category = await prisma.portfolioCategory.update({
      where: { id },
      data: data
    })

    revalidatePath('/admin/portfolio')
    return {
      ...category,
      created_at: category.created_at?.toISOString() || '',
      updated_at: category.created_at?.toISOString() || ''
    }
  } catch (error: any) {
    console.error('Error updating portfolio category:', error)
    throw new Error(`Failed to update portfolio category: ${error.message}`)
  }
}

// Delete category
export async function deletePortfolioCategory(id: string): Promise<void> {
  try {
    // Check if category is being used by any portfolios
    const portfolioCount = await prisma.portfolio.count({
      where: { category_id: id }
    })

    if (portfolioCount > 0) {
      throw new Error('Cannot delete category that is being used by portfolios')
    }

    await prisma.portfolioCategory.delete({
      where: { id }
    })

    revalidatePath('/admin/portfolio')
  } catch (error: any) {
    console.error('Error deleting portfolio category:', error)
    throw new Error(`Failed to delete portfolio category: ${error.message}`)
  }
}

// ===== IMAGE MANAGEMENT HELPERS =====

/**
 * Extract storage path from URL for cleanup
 */
function extractStoragePathFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/')
    const uploadsIndex = pathParts.findIndex(part => part === 'uploads')
    
    if (uploadsIndex !== -1 && pathParts[uploadsIndex + 2]) {
      return pathParts.slice(uploadsIndex + 2).join('/')
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
    const path = extractStoragePathFromUrl(imageUrl)
    
    if (path && imageUrl.includes('portfolio-images')) {
      // Use the deleteFile function from storage.ts
      const { deleteFile } = await import('@/lib/storage')
      const result = await deleteFile('portfolio-images', path)
      
      if (result.error) {
        console.warn('Failed to cleanup portfolio image:', result.error.message)
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
    const user = await getCurrentUser()
    if (!user) {
      return false
    }

    // Get current user profile to check studio access
    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { 
        role: true, 
        studio_id: true 
      }
    })

    if (!userProfile) {
      return false
    }

    // Admin users or users assigned to the specific studio can upload
    return userProfile.role === 'admin' || userProfile.studio_id === studioId
  } catch {
    return false
  }
}