// Test script to verify Better Auth + Prisma configuration
const { PrismaClient } = require('@prisma/client')

async function testConnection() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 Testing database connection...')
    
    // Test basic connection
    const userCount = await prisma.user.count()
    console.log(`✅ Database connected! Found ${userCount} users`)
    
    // Test finding our seeded users
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@kalarasastudio.com' },
      select: { id: true, email: true, role: true, full_name: true }
    })
    
    if (adminUser) {
      console.log('✅ Admin user found:', adminUser)
    } else {
      console.log('❌ Admin user not found')
    }
    
    const csUser = await prisma.user.findUnique({
      where: { email: 'cs@kalarasastudio.com' },
      select: { id: true, email: true, role: true, full_name: true }
    })
    
    if (csUser) {
      console.log('✅ CS user found:', csUser)
    } else {
      console.log('❌ CS user not found')
    }
    
    console.log('✅ Database test completed successfully!')
    
  } catch (error) {
    console.error('❌ Database test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()