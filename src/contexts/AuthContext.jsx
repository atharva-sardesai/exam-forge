/* eslint-disable react-refresh/only-export-components */
/* eslint-disable react/only-export-components */
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

const avatarColors = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6']

function mapAuthError(message = '') {
  const lower = message.toLowerCase()
  if (lower.includes('email not confirmed')) return 'Email not confirmed yet. Check your inbox for the confirmation link.'
  if (lower.includes('invalid login credentials')) return 'Incorrect email or password.'
  if (lower.includes('rate limit') || lower.includes('too many')) return 'Too many attempts. Please wait and try again.'
  if (lower.includes('already registered')) return 'An account with this email already exists.'
  return message || 'Something went wrong. Please try again.'
}

async function ensureProfile(sessionUser) {
  if (!supabase || !sessionUser) return null
  const { data, error } = await supabase.from('profiles').select('*').eq('id', sessionUser.id).maybeSingle()
  if (!error && data) return data
  if (error && !['PGRST116', '42P01'].includes(error.code)) throw error
  if (error?.code === '42P01') return null

  const fallbackName = sessionUser.user_metadata?.display_name || sessionUser.email?.split('@')[0] || 'ExamForge User'
  const profileRow = {
    id: sessionUser.id,
    display_name: fallbackName,
    email: sessionUser.email,
    avatar_color: sessionUser.user_metadata?.avatar_color || avatarColors[Math.floor(Math.random() * avatarColors.length)],
  }
  const { data: inserted, error: insertError } = await supabase.from('profiles').insert(profileRow).select('*').single()
  if (insertError) throw insertError
  return inserted
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const hydrate = useCallback(async (sessionUser) => {
    setUser(sessionUser || null)
    if (!sessionUser) {
      setProfile(null)
      return
    }
    try {
      setProfile(await ensureProfile(sessionUser))
    } catch {
      setProfile(null)
    }
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return undefined
    }

    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      hydrate(data.session?.user || null).finally(() => mounted && setLoading(false))
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      hydrate(session?.user || null)
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [hydrate])

  const signUp = useCallback(async ({ displayName, email, password }) => {
    if (!supabase) throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    })
    if (error) throw new Error(mapAuthError(error.message))
    if (data.user) {
      const profileRow = {
        id: data.user.id,
        display_name: displayName,
        email,
        avatar_color: avatarColors[Math.floor(Math.random() * avatarColors.length)],
      }
      if (data.session) {
        const { error: profileError } = await supabase.from('profiles').upsert(profileRow)
        if (profileError) throw new Error(mapAuthError(profileError.message))
        setProfile(profileRow)
      }
    }
    return data
  }, [])

  const signIn = useCallback(async ({ email, password }) => {
    if (!supabase) throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(mapAuthError(error.message))
    if (data.user) {
      await supabase.from('profiles').update({ last_login_at: new Date().toISOString() }).eq('id', data.user.id)
      await hydrate(data.user)
    }
    return data
  }, [hydrate])

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }, [])

  const resetPassword = useCallback(async (email) => {
    if (!supabase) throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/forgot-password`,
    })
    if (error) throw new Error(mapAuthError(error.message))
  }, [])

  const updatePassword = useCallback(async (password) => {
    if (!supabase) throw new Error('Supabase is not configured.')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw new Error(mapAuthError(error.message))
  }, [])

  const updateProfile = useCallback(async (patch) => {
    if (!supabase || !user) throw new Error('You must be signed in.')
    const { data, error } = await supabase.from('profiles').update(patch).eq('id', user.id).select('*').single()
    if (error) throw new Error(mapAuthError(error.message))
    setProfile(data)
    return data
  }, [user])

  const value = {
    user,
    profile,
    loading,
    configured: isSupabaseConfigured,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// oxlint-disable-next-line react(only-export-components)
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
