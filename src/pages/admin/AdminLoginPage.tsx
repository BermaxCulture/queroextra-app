import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button, Input, useToast } from '@/components/ui'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
})

type FormData = z.infer<typeof schema>

export default function AdminLoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { showToast } = useToast()

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) throw error
      if (!authData.user) throw new Error('Usuário não encontrado')

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('tipo')
        .eq('id', authData.user.id)
        .single()

      if (profileError || profile?.tipo !== 'admin') {
        await supabase.auth.signOut()
        showToast('Acesso negado. Esta área é restrita a administradores.', 'error')
        return
      }

      navigate('/admin')
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : ''
      if (msg === 'Invalid login credentials') {
        showToast('E-mail ou senha incorretos.', 'error')
      } else {
        showToast('Ocorreu um erro ao entrar.', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-qe-gray-900 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-[380px]">
        <div className="mb-10 text-center">
          <p className="text-[12px] font-semibold tracking-widest text-qe-gray-500 uppercase mb-2">
            Área restrita
          </p>
          <h1 className="text-[32px] font-bold text-white">
            Quero<span className="text-qe-yellow">Extra</span>
          </h1>
          <p className="text-qe-gray-500 mt-1 text-[14px]">Painel de administração</p>
        </div>

        <div className="bg-[#1a1a1a] rounded-[20px] p-7 border border-white/5">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="E-mail"
              placeholder="admin@exemplo.com"
              icon={<Mail size={20} />}
              {...register('email')}
              errorMessage={errors.email?.message}
            />

            <div className="relative">
              <Input
                label="Senha"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                icon={<Lock size={20} />}
                {...register('password')}
                errorMessage={errors.password?.message}
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                className="absolute right-4 top-[42px] text-qe-gray-400 hover:text-qe-gray-300 transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <Button
              type="submit"
              size="lg"
              loading={loading}
              trailingIcon={<ArrowRight size={20} />}
            >
              Entrar
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
