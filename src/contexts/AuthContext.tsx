import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
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
  validapay_onboarding_status: 'em_analise' | 'aprovado' | null
  validapay_form_id: string | null
  validapay_url_documentscopy: string | null
  validapay_account_number: string | null
  pix_key: string | null
  pix_key_type: 'cpf' | 'telefone' | 'email' | 'chave_aleatoria' | null
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
  const initializedRef = useRef(false)
  const loadedUserIdRef = useRef<string | null>(null)

  const fetchProfile = useCallback(async (userId: string) => {
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
  }, [])

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

  const loadUserData = useCallback(async (userId: string) => {
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
  }, [fetchProfile, fetchCompany, fetchFreelancer])

  useEffect(() => {
    // getSession() garante a inicialização mesmo no StrictMode do React (dupla montagem de efeitos).
    // A flag initializedRef impede que onAuthStateChange concorra com getSession() em andamento.
    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          try {
            await loadUserData(session.user.id)
            loadedUserIdRef.current = session.user.id
          } finally {
            initializedRef.current = true
            setLoading(false)
          }
        } else {
          initializedRef.current = true
          setLoading(false)
        }
      })
      .catch(() => {
        initializedRef.current = true
        setLoading(false)
      })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[AuthContext] onAuthStateChange — evento: ${event}, session: ${!!session}`)

      // Aguarda getSession() terminar antes de processar qualquer evento
      if (!initializedRef.current) return
      // INITIAL_SESSION já foi tratado pelo getSession() acima.
      // TOKEN_REFRESHED não requer re-fetch do perfil.
      if (event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') return

      if (session?.user) {
        setSession(session)
        setUser(session.user)
        if (event === 'SIGNED_IN' && loadedUserIdRef.current !== session.user.id) {
          loadedUserIdRef.current = session.user.id
          loadUserData(session.user.id)
        }
      } else {
        loadedUserIdRef.current = null
        setSession(null)
        setUser(null)
        setProfile(null)
        setCompany(null)
        setFreelancer(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

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
