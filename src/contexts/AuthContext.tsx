import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface Profile {
  id: string
  nome: string
  email: string
  tipo: 'freelancer' | 'empresa' | 'admin'
  status: string
  avatar_url?: string | null
}

export interface Company {
  id: string
  profile_id: string
  cnpj_cpf: string | null
  area: string | null
  documento_url: string[] | null
  status: 'pendente' | 'aprovado' | 'rejeitado' | 'bloqueado'
}

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  company: Company | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  refreshCompany: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      setProfile(data)
      return data
    } catch (error) {
      console.error('Erro ao buscar perfil:', error)
      setProfile(null)
      return null
    }
  }

  const fetchCompany = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('profile_id', userId)
        .maybeSingle()

      if (error) throw error
      setCompany(data)
      return data
    } catch (error) {
      console.error('Erro ao buscar empresa:', error)
      setCompany(null)
      return null
    }
  }, [])

  const loadUserData = async (userId: string) => {
    const profileData = await fetchProfile(userId)
    if (profileData?.tipo === 'empresa') {
      await fetchCompany(userId)
    } else {
      setCompany(null)
    }
  }

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)

      // TOKEN_REFRESHED só atualiza a sessão — não recarrega perfil nem toca no loading
      if (event === 'TOKEN_REFRESHED') return

      if (session?.user) {
        setLoading(true)
        try {
          await loadUserData(session.user.id)
        } finally {
          setLoading(false)
        }
      } else {
        setProfile(null)
        setCompany(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchCompany])

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
    setCompany(null)
  }

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id)
  }

  const refreshCompany = async () => {
    if (user) await fetchCompany(user.id)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        company,
        loading,
        signOut,
        refreshProfile,
        refreshCompany,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}
