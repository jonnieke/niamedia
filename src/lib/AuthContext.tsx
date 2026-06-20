import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from './supabase'

interface AuthUser {
  id: string
  email: string
  name: string
  role: 'user' | 'admin'
  avatar_url?: string
}

interface AuthContextType {
  user: AuthUser | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<{ needsConfirmation: boolean }>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

async function fetchProfile(userId: string, fallbackEmail?: string, fallbackName?: string): Promise<AuthUser | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, name, role, avatar_url')
    .eq('id', userId)
    .single()
  if (!error && data) {
    return { id: data.id, email: data.email, name: data.name, role: data.role as 'user' | 'admin', avatar_url: data.avatar_url ?? undefined }
  }
  // Table missing or RLS error — fall back to auth metadata so app stays usable
  if (fallbackEmail) {
    return { id: userId, email: fallbackEmail, name: fallbackName || fallbackEmail.split('@')[0], role: 'user' }
  }
  return null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Restore existing session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const u = session.user
        const profile = await fetchProfile(u.id, u.email, u.user_metadata?.name)
        setUser(profile)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const u = session.user
        const profile = await fetchProfile(u.id, u.email, u.user_metadata?.name)
        setUser(profile)
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
    if (data.user) {
      const u = data.user
      const profile = await fetchProfile(u.id, u.email, u.user_metadata?.name)
      setUser(profile)
    }
  }

  const register = async (name: string, email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })
    if (error) throw new Error(error.message)

    // If email confirmation is disabled, session is returned immediately
    if (data.session && data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        name,
        email,
        role: 'user',
      })
      setUser({ id: data.user.id, email, name, role: 'user' })
      return { needsConfirmation: false }
    }

    // Email confirmation required
    return { needsConfirmation: true }
  }

  const refreshProfile = async () => {
    if (!user) return
    const profile = await fetchProfile(user.id, user.email, user.name)
    if (profile) setUser(profile)
  }

  const logout = async () => {
    setUser(null)
    await supabase.auth.signOut()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a14' }}>
        <div className="w-8 h-8 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin" />
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, refreshProfile, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
