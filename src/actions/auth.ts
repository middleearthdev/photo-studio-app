"use server"

import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export async function signOutAction() {
  await auth.api.signOut({
    headers: await headers()
  })
  redirect('/staff/login')
}

export async function signUpAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const full_name = formData.get('full_name') as string
  const phone = formData.get('phone') as string

  if (!email || !password || !full_name) {
    throw new Error('Required fields are missing')
  }

  try {
    await auth.api.signUpEmail({
      body: {
        email,
        password,
        name: full_name,
        callbackURL: '/auth/verify-email'
      },
      headers: await headers()
    })

    redirect('/auth/verify-email?email=' + encodeURIComponent(email))
  } catch (error: any) {
    throw new Error(error.message || 'Failed to sign up')
  }
}