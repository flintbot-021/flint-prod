import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export type AuthResult = {
  success: boolean
  error?: string
  message?: string
}

/**
 * Sign up a new user with email and password using PKCE flow
 */
export async function signUp(email: string, password: string): Promise<AuthResult> {
  const supabase = createClient()
  
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (error) {
    return {
      success: false,
      error: error.message,
    }
  }

  return {
    success: true,
    message: 'Check your email for a confirmation link to complete your signup.',
  }
}

/**
 * Sign in a user with email and password using PKCE flow
 */
export async function signIn(email: string, password: string): Promise<AuthResult> {
  const supabase = createClient()
  
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return {
      success: false,
      error: error.message,
    }
  }

  return {
    success: true,
    message: 'Successfully signed in!',
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<AuthResult> {
  const supabase = createClient()
  
  const { error } = await supabase.auth.signOut()

  if (error) {
    return {
      success: false,
      error: error.message,
    }
  }

  return {
    success: true,
    message: 'Successfully signed out!',
  }
}

/**
 * Reset password for a user
 */
export async function resetPassword(email: string): Promise<AuthResult> {
  const supabase = createClient()
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
  })

  if (error) {
    return {
      success: false,
      error: error.message,
    }
  }

  return {
    success: true,
    message: 'Check your email for a password reset link.',
  }
}

/**
 * Update password for authenticated user
 */
export async function updatePassword(password: string): Promise<AuthResult> {
  const supabase = createClient()
  
  const { error } = await supabase.auth.updateUser({
    password,
  })

  if (error) {
    return {
      success: false,
      error: error.message,
    }
  }

  return {
    success: true,
    message: 'Password updated successfully!',
  }
}

/**
 * Sign in with Google OAuth using PKCE flow
 */
export async function signInWithGoogle(): Promise<AuthResult> {
  const supabase = createClient()
  
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (error) {
    return {
      success: false,
      error: error.message,
    }
  }

  return {
    success: true,
    message: 'Redirecting to Google...',
  }
}

/**
 * Sign in with GitHub OAuth using PKCE flow
 */
export async function signInWithGitHub(): Promise<AuthResult> {
  const supabase = createClient()
  
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (error) {
    return {
      success: false,
      error: error.message,
    }
  }

  return {
    success: true,
    message: 'Redirecting to GitHub...',
  }
} 