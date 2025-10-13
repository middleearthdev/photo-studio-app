"use server"

import { prisma } from '@/lib/prisma'

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
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
  // Relations
  category?: {
    id: string
    name: string
  }
}

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

// Get all public portfolios (only active ones)
export async function getPublicPortfolios(): Promise<Portfolio[]> {
  try {
    const portfolios = await prisma.portfolio.findMany({
      where: {
        is_active: true
      },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { is_featured: 'desc' },
        { display_order: 'asc' },
        { created_at: 'desc' }
      ]
    })

    // Transform to match expected interface
    const transformedPortfolios: Portfolio[] = portfolios.map(portfolio => ({
      id: portfolio.id,
      studio_id: portfolio.studio_id || '',
      category_id: portfolio.category_id,
      title: portfolio.title,
      description: portfolio.description,
      image_url: portfolio.image_url,
      alt_text: portfolio.alt_text,
      display_order: portfolio.display_order || 0,
      is_featured: portfolio.is_featured || false,
      is_active: portfolio.is_active || false,
      metadata: portfolio.metadata as Record<string, unknown> | null,
      created_at: portfolio.created_at?.toISOString() || '',
      updated_at: portfolio.updated_at?.toISOString() || '',
      category: portfolio.category ? {
        id: portfolio.category.id,
        name: portfolio.category.name
      } : undefined
    }))

    return transformedPortfolios
  } catch (error) {
    console.error('Error fetching public portfolios:', error)
    return []
  }
}

// Get all public portfolio categories with cover images
export async function getPublicPortfolioCategoriesWithCovers(): Promise<(PortfolioCategory & { cover_image?: string, portfolios_count?: number })[]> {
  try {
    // Get categories with counts
    const categories = await prisma.portfolioCategory.findMany({
      where: {
        is_active: true
      },
      include: {
        _count: {
          select: {
            portfolios: true
          }
        }
      },
      orderBy: [
        { display_order: 'asc' },
        { name: 'asc' }
      ]
    })

    // For each category, get the first portfolio image as cover
    const categoriesWithCovers = await Promise.all(
      categories.map(async (category) => {
        const portfolio = await prisma.portfolio.findFirst({
          where: {
            category_id: category.id,
            is_active: true
          },
          select: {
            image_url: true
          },
          orderBy: [
            { display_order: 'asc' },
            { created_at: 'desc' }
          ]
        })

        return {
          id: category.id,
          studio_id: category.studio_id || '',
          name: category.name,
          description: category.description,
          display_order: category.display_order || 0,
          is_active: category.is_active || false,
          created_at: category.created_at?.toISOString() || '',
          updated_at: undefined,
          portfolios_count: category._count.portfolios,
          cover_image: portfolio?.image_url
        }
      })
    )

    return categoriesWithCovers
  } catch (error) {
    console.error('Error fetching public portfolio categories:', error)
    return []
  }
}

// Get all public portfolio categories (only active ones) with portfolio counts
export async function getPublicPortfolioCategoriesWithCounts(): Promise<(PortfolioCategory & { portfolios_count?: number })[]> {
  try {
    const categories = await prisma.portfolioCategory.findMany({
      where: {
        is_active: true
      },
      include: {
        _count: {
          select: {
            portfolios: true
          }
        }
      },
      orderBy: [
        { display_order: 'asc' },
        { name: 'asc' }
      ]
    })

    // Transform to match expected interface
    return categories.map(category => ({
      id: category.id,
      studio_id: category.studio_id || '',
      name: category.name,
      description: category.description,
      display_order: category.display_order || 0,
      is_active: category.is_active || false,
      created_at: category.created_at?.toISOString() || '',
      updated_at: undefined,
      portfolios_count: category._count.portfolios
    }))
  } catch (error) {
    console.error('Error fetching public portfolio categories:', error)
    return []
  }
}

// Get featured portfolios
export async function getFeaturedPortfolios(): Promise<Portfolio[]> {
  try {
    const portfolios = await prisma.portfolio.findMany({
      where: {
        is_active: true,
        is_featured: true
      },
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

    // Transform to match expected interface
    const transformedPortfolios: Portfolio[] = portfolios.map(portfolio => ({
      id: portfolio.id,
      studio_id: portfolio.studio_id || '',
      category_id: portfolio.category_id,
      title: portfolio.title,
      description: portfolio.description,
      image_url: portfolio.image_url,
      alt_text: portfolio.alt_text,
      display_order: portfolio.display_order || 0,
      is_featured: portfolio.is_featured || false,
      is_active: portfolio.is_active || false,
      metadata: portfolio.metadata as Record<string, unknown> | null,
      created_at: portfolio.created_at?.toISOString() || '',
      updated_at: portfolio.updated_at?.toISOString() || '',
      category: portfolio.category ? {
        id: portfolio.category.id,
        name: portfolio.category.name
      } : undefined
    }))

    return transformedPortfolios
  } catch (error) {
    console.error('Error fetching featured portfolios:', error)
    return []
  }
}

// Get portfolio by ID (public)
export async function getPublicPortfolioById(id: string): Promise<Portfolio | null> {
  try {
    const portfolio = await prisma.portfolio.findFirst({
      where: {
        id: id,
        is_active: true
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

    if (!portfolio) {
      return null
    }

    // Transform to match expected interface
    const transformedPortfolio: Portfolio = {
      id: portfolio.id,
      studio_id: portfolio.studio_id || '',
      category_id: portfolio.category_id,
      title: portfolio.title,
      description: portfolio.description,
      image_url: portfolio.image_url,
      alt_text: portfolio.alt_text,
      display_order: portfolio.display_order || 0,
      is_featured: portfolio.is_featured || false,
      is_active: portfolio.is_active || false,
      metadata: portfolio.metadata as Record<string, unknown> | null,
      created_at: portfolio.created_at?.toISOString() || '',
      updated_at: portfolio.updated_at?.toISOString() || '',
      category: portfolio.category ? {
        id: portfolio.category.id,
        name: portfolio.category.name
      } : undefined
    }

    return transformedPortfolio
  } catch (error) {
    console.error('Error fetching public portfolio:', error)
    return null
  }
}

// Get all public portfolio categories (only active ones)
export async function getPublicPortfolioCategories(): Promise<PortfolioCategory[]> {
  try {
    const categories = await prisma.portfolioCategory.findMany({
      where: {
        is_active: true
      },
      orderBy: [
        { display_order: 'asc' },
        { name: 'asc' }
      ]
    })

    // Transform to match expected interface
    return categories.map(category => ({
      id: category.id,
      studio_id: category.studio_id || '',
      name: category.name,
      description: category.description,
      display_order: category.display_order || 0,
      is_active: category.is_active || false,
      created_at: category.created_at?.toISOString() || '',
      updated_at: undefined
    }))
  } catch (error) {
    console.error('Error fetching public portfolio categories:', error)
    return []
  }
}