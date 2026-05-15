import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button, Input, useToast } from '@/components/ui'

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  remember: z.boolean().optional(),
})

type LoginData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { showToast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginData) => {
    setLoading(true)
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) throw error

      if (!authData.user) throw new Error('Usuário não encontrado')

      // Buscar o perfil do usuário para saber o tipo
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('tipo')
        .eq('id', authData.user.id)
        .single()

      if (profileError) {
        console.error('Erro ao buscar perfil:', profileError)
        // Se o perfil não existir, redireciona para a landing ou cadastro
        navigate('/')
        return
      }

      // Redirecionamento por perfil
      switch (profile.tipo) {
        case 'freelancer':
          navigate('/extras')
          break
        case 'empresa':
          navigate('/contratante')
          break
        case 'admin':
          navigate('/admin')
          break
        default:
          navigate('/')
      }
      
      showToast('Login realizado com sucesso.', 'success')
    } catch (error: any) {
      let message = 'Ocorreu um erro ao entrar.'
      if (error.message === 'Invalid login credentials') {
        message = 'E-mail ou senha incorretos.'
      } else if (error.message === 'Email not confirmed') {
        message = 'Por favor, confirme seu e-mail antes de entrar.'
      }
      
      showToast(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    // Pegar o email do campo de forma manual ou via getValues
    const emailInput = document.querySelector('input[name="email"]') as HTMLInputElement
    const email = emailInput?.value

    if (!email || !z.string().email().safeParse(email).success) {
      showToast('Digite um e-mail válido para recuperar a senha.', 'info')
      return
    }
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
      showToast('Verifique sua caixa de entrada para redefinir a senha.', 'success')
    } catch (error) {
      showToast('Não foi possível enviar o e-mail de recuperação.', 'error')
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-[400px] flex flex-col items-center">
        {/* Logo */}
        <div className="mb-10 text-center">
          <h1 className="text-display font-bold text-qe-black">
            Quero<span className="text-qe-yellow">Extra</span>
          </h1>
        </div>

        <div className="w-full bg-white rounded-qe-lg p-8 shadow-qe-sm border border-qe-gray-200">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input
              label="E-mail"
              placeholder="seu@email.com"
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
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-[42px] text-qe-gray-400 hover:text-qe-gray-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  {...register('remember')}
                  className="w-4 h-4 rounded border-qe-gray-200 text-qe-yellow focus:ring-qe-yellow cursor-pointer"
                />
                <span className="text-caption text-qe-gray-700 group-hover:text-qe-black transition-colors">
                  Lembrar de mim
                </span>
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-caption font-semibold text-qe-yellow hover:text-qe-yellow-hover transition-colors"
              >
                Esqueceu a senha?
              </button>
            </div>

            <Button
              type="submit"
              size="lg"
              loading={loading}
              trailingIcon={<ArrowRight size={20} />}
              className="mt-2"
            >
              Entrar
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-qe-gray-100 text-center">
            <p className="text-caption text-qe-gray-500">
              Não tem uma conta?{' '}
              <Link
                to="/cadastro"
                className="font-semibold text-qe-black hover:text-qe-yellow transition-colors"
              >
                Criar conta
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
