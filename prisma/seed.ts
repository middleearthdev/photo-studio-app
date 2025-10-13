import { PrismaClient } from '@prisma/client'
import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"

const prisma = new PrismaClient()

// Initialize Better Auth for user creation
const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  advanced: {
    generateId: false,
  },
  user: {
    additionalFields: {
      studio_id: {
        type: "string",
        required: false,
        input: false,
      },
      role: {
        type: "string",
        required: false,
        defaultValue: "customer",
        input: false,
      },
      phone: {
        type: "string", 
        required: false,
        input: true,
      },
      full_name: {
        type: "string",
        required: false,
        input: true,
      },
      address: {
        type: "string",
        required: false,
        input: false,
      },
      birth_date: {
        type: "date",
        required: false,
        input: false,
      },
      preferences: {
        type: "string",
        required: false,
        defaultValue: "{}",
        input: false,
      },
      avatar_url: {
        type: "string",
        required: false,
        input: false,
      },
      is_active: {
        type: "boolean",
        required: false,
        defaultValue: true,
        input: false,
      },
      last_login: {
        type: "date",
        required: false,
        input: false,
      }
    },
  },
})

async function main() {
  console.log('🌱 Starting seed...')

  // Create default studio if it doesn't exist
  let studio = await prisma.studio.findFirst()
  
  if (!studio) {
    studio = await prisma.studio.create({
      data: {
        name: 'Kalarasa Studio',
        description: 'Studio foto profesional di Karawang',
        address: 'Jl. Studio Foto No. 1, Karawang',
        phone: '0267-123456',
        email: 'info@kalarasastudio.com',
        operating_hours: {
          monday: { open: '09:00', close: '17:00' },
          tuesday: { open: '09:00', close: '17:00' },
          wednesday: { open: '09:00', close: '17:00' },
          thursday: { open: '09:00', close: '17:00' },
          friday: { open: '09:00', close: '17:00' },
          saturday: { open: '09:00', close: '15:00' },
          sunday: { closed: true }
        },
        is_active: true,
        settings: {}
      }
    })
    console.log('✅ Created default studio:', studio.name)
  }

  // Seed data for users
  const users = [
    {
      email: 'admin@kalarasastudio.com',
      password: 'Admin123!',
      name: 'Admin Kalarasa',
      role: 'admin' as const,
      full_name: 'Administrator Kalarasa Studio',
      phone: '0267-111111'
    },
    {
      email: 'cs@kalarasastudio.com', 
      password: 'CS123456!',
      name: 'Customer Service',
      role: 'cs' as const,
      full_name: 'Customer Service Kalarasa',
      phone: '0267-222222'
    }
  ]

  for (const userData of users) {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      })

      if (existingUser) {
        console.log(`⚠️  User ${userData.email} already exists, skipping...`)
        continue
      }

      // Create user with Better Auth
      const result = await auth.api.signUpEmail({
        body: {
          email: userData.email,
          password: userData.password,
          name: userData.name,
        },
      })

      if ('error' in result && result.error) {
        console.error(`❌ Failed to create user ${userData.email}:`, result.error)
        continue
      }

      if (!('user' in result) || !result.user) {
        console.error(`❌ No user data returned for ${userData.email}`)
        continue
      }

      // Update user with additional fields
      await prisma.user.update({
        where: { id: result.user.id },
        data: {
          studio_id: studio.id,
          role: userData.role,
          full_name: userData.full_name,
          phone: userData.phone,
          is_active: true,
          emailVerified: true, // Auto-verify for seed data
        }
      })

      console.log(`✅ Created ${userData.role} user: ${userData.email}`)

    } catch (error) {
      console.error(`❌ Error creating user ${userData.email}:`, error)
    }
  }

  console.log('🌱 Seed completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })