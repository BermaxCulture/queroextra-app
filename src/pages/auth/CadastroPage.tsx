import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button, Input, useToast, Chip } from '@/components/ui'

const cadastroSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  tipo: z.enum(['freelancer', 'empresa'], {
    message: 'Selecione o tipo de conta',
  }),
})

type CadastroData = z.infer<typeof cadastroSchema>

export default function CadastroPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [tipo, setTipo] = useState<'freelancer' | 'empresa'>('freelancer')
  const navigate = useNavigate()
  const { showToast } = useToast()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CadastroData>({
    resolver: zodResolver(cadastroSchema),
    defaultValues: { tipo: 'freelancer' },
  })

  const onSubmit = async (data: CadastroData) => {
    setLoading(true)
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            nome: data.nome,
            tipo: data.tipo,
          },
        },
      })

      if (error) throw error

      if (authData.user) {
        showToast('Cadastro realizado! Verifique seu e-mail para confirmar a conta.', 'success')
        navigate('/login')
      }
    } catch (error: any) {
      showToast(error.message || 'Erro ao realizar cadastro.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-[400px] flex flex-col items-center">
        <div className="mb-10 text-center">
          <h1 className="text-display font-bold text-qe-black">
            Quero<span className="text-qe-yellow">Extra</span>
          </h1>
          <p className="text-body text-qe-gray-500 mt-2">Crie sua conta gratuitamente</p>
        </div>

        <div className="w-full bg-white rounded-qe-lg p-8 shadow-qe-sm border border-qe-gray-200">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <p className="text-[13px] font-semibold text-qe-gray-700">Eu sou:</p>
              <div className="flex gap-2">
                <Chip
                  label="Freelancer"
                  variant="filter"
                  selected={tipo === 'freelancer'}
                  onClick={() => {
                    setTipo('freelancer')
                    setValue('tipo', 'freelancer')
                  }}
                />
                <Chip
                  label="Empresa"
                  variant="filter"
                  selected={tipo === 'empresa'}
                  onClick={() => {
                    setTipo('empresa')
                    setValue('tipo', 'empresa')
                  }}
                />
              </div>
            </div>

            <Input
              label="Nome Completo"
              placeholder="Ex: João Silva"
              icon={<User size={20} />}
              {...register('nome')}
              errorMessage={errors.nome?.message}
            />

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

            <Button
              type="submit"
              size="lg"
              loading={loading}
              trailingIcon={<ArrowRight size={20} />}
              className="mt-2"
            >
              Criar conta
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-qe-gray-100 text-center">
            <p className="text-caption text-qe-gray-500">
              Já tem uma conta?{' '}
              <Link
                to="/login"
                className="font-semibold text-qe-black hover:text-qe-yellow transition-colors"
              >
                Entrar
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
