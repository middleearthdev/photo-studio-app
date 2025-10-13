import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    // Get session from Better Auth
    const session = await auth.api.getSession({
      headers: req.headers,
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user data with role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
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

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Transform the data to match the expected UserProfile interface
    const profile = {
      id: user.id,
      studio_id: user.studio_id,
      role: user.role,
      full_name: user.full_name || user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      birth_date: user.birth_date?.toISOString(),
      preferences: user.preferences as Record<string, any> || {},
      avatar_url: user.avatar_url,
      is_active: user.is_active || true,
      last_login: user.last_login?.toISOString(),
      created_at: user.createdAt.toISOString(),
      updated_at: user.updatedAt.toISOString()
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}