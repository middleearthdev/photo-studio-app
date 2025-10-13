// Minimal test of Better Auth functionality
const { auth } = require('./src/lib/auth.ts')

async function testBetterAuth() {
  try {
    console.log('🔍 Testing Better Auth configuration...')
    
    // Test basic auth configuration
    console.log('✅ Auth configuration loaded successfully')
    
    // Attempt to sign in with seeded admin user
    console.log('🔍 Testing email sign-in with admin user...')
    
    const response = await fetch('http://localhost:3000/api/auth/sign-in/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@kalarasastudio.com',
        password: 'Admin123!'
      })
    })
    
    console.log('Response status:', response.status)
    console.log('Response headers:', response.headers)
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Sign-in successful:', data)
    } else {
      const error = await response.text()
      console.log('❌ Sign-in failed:', error)
    }
    
  } catch (error) {
    console.error('❌ Better Auth test failed:', error)
  }
}

testBetterAuth()