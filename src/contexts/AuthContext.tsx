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

export interface Freelancer {
  id: string
  profile_id: string
  cpf: string | null
  habilidades: string[] | null
  stripe_account_id: string | null
}

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  company: Company | null
  freelancer: Freelancer | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  refreshCompany: () => Promise<void>
  refreshFreelancer: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [freelancer, setFreelancer] = useState<Freelancer | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId: string) => {
    console.log('[AuthContext] fetchProfile: iniciando busca...', userId)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      console.log('[AuthContext] fetchProfile: perfil carregado com sucesso.', data)
      setProfile(data)
      return data
    } catch (error: any) {
      console.error('[AuthContext] fetchProfile: erro ao buscar perfil:', {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
        raw: error
      })
      setProfile(null)
      return null
    }
  }

  const fetchCompany = useCallback(async (userId: string) => {
    console.log('[AuthContext] fetchCompany: iniciando busca...', userId)
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('profile_id', userId)
        .maybeSingle()

      if (error) throw error
      console.log('[AuthContext] fetchCompany: empresa carregada com sucesso.', data)
      setCompany(data)
      return data
    } catch (error: any) {
      console.error('[AuthContext] fetchCompany: erro ao buscar empresa:', {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
        raw: error
      })
      setCompany(null)
      return null
    }
  }, [])

  const fetchFreelancer = useCallback(async (userId: string) => {
    console.log('[AuthContext] fetchFreelancer: iniciando busca...', userId)
    try {
      const { data, error } = await supabase
        .from('freelancers')
        .select('*')
        .eq('profile_id', userId)
        .maybeSingle()

      if (error) throw error
      console.log('[AuthContext] fetchFreelancer: freelancer carregado com sucesso.', data)
      setFreelancer(data)
      return data
    } catch (error: any) {
      console.error('[AuthContext] fetchFreelancer: erro ao buscar freelancer:', {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
        raw: error
      })
      setFreelancer(null)
      return null
    }
  }, [])

  const loadUserData = async (userId: string) => {
    console.log('[AuthContext] loadUserData: iniciando carregamento de dados...', userId)
    const profileData = await fetchProfile(userId)
    console.log('[AuthContext] loadUserData: resultado de fetchProfile:', profileData?.tipo)
    if (profileData?.tipo === 'empresa') {
      await fetchCompany(userId)
      setFreelancer(null)
    } else if (profileData?.tipo === 'freelancer') {
      await fetchFreelancer(userId)
      setCompany(null)
    } else {
      console.log('[AuthContext] loadUserData: tipo de perfil desconhecido ou nulo, limpando estados.')
      setCompany(null)
      setFreelancer(null)
    }
    console.log('[AuthContext] loadUserData: finalizado.')
  }

  useEffect(() => {
    console.log('[AuthContext] useEffect de inicialização disparado')
    
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        console.log('[AuthContext] getSession resolvido. Session ativa:', !!session)
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          console.log('[AuthContext] getSession: usuário logado encontrado. Iniciando carregamento de perfil...')
          loadUserData(session.user.id)
            .then(() => console.log('[AuthContext] getSession: dados do usuário carregados.'))
            .catch((err) => console.error('[AuthContext] getSession: erro ao carregar dados:', err))
            .finally(() => {
              console.log('[AuthContext] getSession: carregamento finalizado. setLoading(false)')
              setLoading(false)
            })
        } else {
          console.log('[AuthContext] getSession: nenhuma sessão ativa encontrada. setLoading(false)')
          setLoading(false)
        }
      })
      .catch((err) => {
        console.error('[AuthContext] getSession rejeitado com erro:', {
          message: err?.message || String(err),
          details: err?.details,
          raw: err
        })
        setLoading(false)
      })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[AuthContext] onAuthStateChange disparado. Evento: ${event}, Session ativa: ${!!session}`)
      try {
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          console.log('[AuthContext] onAuthStateChange: usuário logado. setLoading(true) e carregando dados...')
          setLoading(true)
          await loadUserData(session.user.id)
          console.log('[AuthContext] onAuthStateChange: dados do usuário carregados. setLoading(false)')
          setLoading(false)
        } else {
          console.log('[AuthContext] onAuthStateChange: deslogado. Limpando estados e setLoading(false)')
          setProfile(null)
          setCompany(null)
          setFreelancer(null)
          setLoading(false)
        }
      } catch (err: any) {
        console.error('[AuthContext] erro no callback de onAuthStateChange:', {
          message: err?.message || String(err),
          details: err?.details,
          raw: err
        })
        setLoading(false)
      }
    })

    return () => {
      console.log('[AuthContext] Limpando inscrição de auth')
      subscription.unsubscribe()
    }
  }, [fetchCompany, fetchFreelancer])

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
    setCompany(null)
    setFreelancer(null)
  }

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id)
  }

  const refreshCompany = async () => {
    if (user) await fetchCompany(user.id)
  }

  const refreshFreelancer = async () => {
    if (user) await fetchFreelancer(user.id)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        company,
        freelancer,
        loading,
        signOut,
        refreshProfile,
        refreshCompany,
        refreshFreelancer,
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
