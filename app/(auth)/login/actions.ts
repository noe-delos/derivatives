'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const authData = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { data: authUser, error: authError } = await supabase.auth.signUp(authData)

  if (authError) {
    return { error: authError.message }
  }

  if (authUser.user) {
    // Update user profile with additional information
    const { error: profileError } = await supabase
      .from('users')
      .update({
        first_name: formData.get('firstName') as string,
        last_name: formData.get('lastName') as string,
        phone_number: formData.get('phoneNumber') as string,
      })
      .eq('id', authUser.user.id)

    if (profileError) {
      console.error('Profile update error:', profileError)
    }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function forgotPassword(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/reset-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient()

  const password = formData.get('password') as string

  const { error } = await supabase.auth.updateUser({
    password: password,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}