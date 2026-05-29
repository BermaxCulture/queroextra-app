import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useForm, type FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  Phone,
  Check,
  X,
  CreditCard,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button, Input, useToast, Chip } from '@/components/ui'
import { FREELANCER_HABILIDADES } from '@/constants/freelancerSkills'
import { formatCpf, isValidCpf, stripCpf } from '@/lib/validators/cpf'
import { formatPhone, isValidWhatsAppPhone, stripPhone } from '@/lib/validators/phone'
import { checkEmailAvailable } from '@/services/auth/checkEmailAvailable'

const passwordSchema = z
  .string()
  .min(8, 'A senha deve ter pelo menos 8 caracteres')
  .regex(/[A-Z]/, 'Deve conter pelo menos uma letra maiúscula')
  .regex(/[a-z]/, 'Deve conter pelo menos uma letra minúscula')
  .regex(/[0-9]/, 'Deve conter pelo menos um número')
  .regex(/[^A-Za-z0-9]/, 'Deve conter pelo menos um caractere especial')

const celularSchema = z
  .string()
  .min(14, 'Celular inválido')
  .max(15, 'Celular inválido')
  .refine(isValidWhatsAppPhone, 'Informe um celular WhatsApp válido: (00) 90000-0000')

const freelancerCadastroSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  cpf: z
    .string()
    .min(14, 'CPF inválido')
    .refine(isValidCpf, 'CPF inválido'),
  email: z.string().email('E-mail inválido'),
  celular: celularSchema,
  password: passwordSchema,
  habilidades: z
    .array(z.enum(FREELANCER_HABILIDADES))
    .min(1, 'Selecione ao menos uma habilidade'),
  aceite_termos: z.literal(true, {
    error: 'Você precisa aceitar os Termos de Uso',
  }),
})

type FreelancerCadastroData = z.infer<typeof freelancerCadastroSchema>

const passwordRules = [
  { label: 'Mínimo 8 caracteres', test: (pw: string) => pw.length >= 8 },
  { label: 'Uma letra maiúscula', test: (pw: string) => /[A-Z]/.test(pw) },
  { label: 'Uma letra minúscula', test: (pw: string) => /[a-z]/.test(pw) },
  { label: 'Um número', test: (pw: string) => /[0-9]/.test(pw) },
  { label: 'Um símbolo (#, *, etc)', test: (pw: string) => /[^A-Za-z0-9]/.test(pw) },
]


export default function CadastroPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { showToast } = useToast()

  useEffect(() => {
    if (searchParams.get('tipo') === 'empresa') {
      navigate('/cadastro/empresa', { replace: true })
    }
  }, [searchParams, navigate])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FreelancerCadastroData>({
    resolver: zodResolver(freelancerCadastroSchema),
    defaultValues: {
      celular: '',
      cpf: '',
      habilidades: [],
      aceite_termos: undefined,
    },
  })

  const passwordValue = watch('password', '')
  const habilidades = watch('habilidades', []) ?? []
  const freelancerErrors = errors as FieldErrors<FreelancerCadastroData>

  const handleCelularChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue('celular', formatPhone(e.target.value), { shouldValidate: true })
  }

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue('cpf', formatCpf(e.target.value), { shouldValidate: true })
  }

  const toggleHabilidade = (skill: (typeof FREELANCER_HABILIDADES)[number]) => {
    const current = habilidades as (typeof FREELANCER_HABILIDADES)[number][]
    const next = current.includes(skill)
      ? current.filter((h) => h !== skill)
      : [...current, skill]
    setValue('habilidades', next, { shouldValidate: true })
  }

  const onSubmit = async (data: FreelancerCadastroData) => {
    setLoading(true)
    try {
      // Verifica se o e-mail já está em uso antes de criar a conta
      const emailDisponivel = await checkEmailAvailable(data.email)
      if (!emailDisponivel) {
        showToast('Este e-mail já está cadastrado. Tente fazer login ou use outro e-mail.', 'error')
        return
      }

      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            nome: data.nome,
            tipo: 'freelancer',
            celular: stripPhone(data.celular),
            cpf: stripCpf(data.cpf),
            habilidades: data.habilidades,
          },
        },
      })

      if (error) throw error

      navigate(`/verificar-email?email=${encodeURIComponent(data.email)}&tipo=freelancer`)
    } catch (error: any) {
      console.error('Erro detalhado no cadastro de freelancer:', error)
      let message = 'Erro ao realizar cadastro.'
      if (error?.message) {
        if (error.message === 'User already registered') {
          message = 'Este e-mail já está cadastrado.'
        } else {
          message = `Erro ao realizar cadastro: ${error.message}`
        }
      }
      showToast(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-[400px] flex flex-col items-center">
        <div className="mb-10 text-center">
          <h1 className="text-[40px] font-bold tracking-tight text-qe-black">
            Quero<span className="text-qe-yellow">Extra</span>
          </h1>
          <p className="text-qe-gray-500 mt-2 font-medium">Cadastre-se como freelancer</p>
        </div>

        <div className="w-full bg-white rounded-[24px] p-8 shadow-qe-lg border border-qe-gray-100">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <p className="text-[13px] font-semibold text-qe-gray-700">Eu sou:</p>
              <div className="flex gap-2">
                <Chip label="Freelancer" variant="filter" selected />
                <Chip
                  label="Empresa"
                  variant="filter"
                  selected={false}
                  onClick={() => navigate('/cadastro/empresa')}
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
              label="CPF"
              placeholder="000.000.000-00"
              icon={<CreditCard size={20} />}
              inputMode="numeric"
              {...register('cpf')}
              onChange={handleCpfChange}
              errorMessage={freelancerErrors.cpf?.message}
            />

            <Input
              label="E-mail"
              placeholder="seu@email.com"
              icon={<Mail size={20} />}
              type="email"
              autoComplete="email"
              {...register('email')}
              errorMessage={errors.email?.message}
            />

            <Input
              label="Celular (WhatsApp)"
              placeholder="(00) 00000-0000"
              icon={<Phone size={20} />}
              inputMode="tel"
              autoComplete="tel"
              {...register('celular')}
              onChange={handleCelularChange}
              errorMessage={errors.celular?.message}
            />

            <div className="space-y-2">
              <p className="text-[13px] font-semibold text-qe-gray-700">Suas habilidades</p>
              <div className="flex flex-wrap gap-2">
                {FREELANCER_HABILIDADES.map((skill) => (
                  <Chip
                    key={skill}
                    label={skill}
                    variant="skill"
                    selected={habilidades.includes(skill)}
                    onClick={() => toggleHabilidade(skill)}
                  />
                ))}
              </div>
              {freelancerErrors.habilidades?.message && (
                <p className="text-[12px] text-qe-error" role="alert">
                  {freelancerErrors.habilidades.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Input
                  label="Senha"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  icon={<Lock size={20} />}
                  autoComplete="new-password"
                  {...register('password')}
                  errorMessage={errors.password?.message}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-[42px] text-qe-gray-400 hover:text-qe-gray-600 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <div className="bg-qe-gray-50 rounded-qe-sm p-3 space-y-2 border border-qe-gray-100">
                <p className="text-[11px] font-bold text-qe-gray-500 uppercase tracking-wider">
                  Segurança da senha
                </p>
                <div className="grid grid-cols-1 gap-1.5">
                  {passwordRules.map((rule, index) => {
                    const isMet = rule.test(passwordValue)
                    return (
                      <div key={index} className="flex items-center gap-2">
                        {isMet ? (
                          <Check size={14} className="text-qe-success" />
                        ) : (
                          <X size={14} className="text-qe-gray-300" />
                        )}
                        <span
                          className={`text-[12px] ${isMet ? 'text-qe-success font-medium' : 'text-qe-gray-500'}`}
                        >
                          {rule.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-qe-gray-300 text-qe-yellow focus:ring-qe-yellow accent-qe-yellow"
                {...register('aceite_termos')}
              />
              <span className="text-[13px] text-qe-gray-600 leading-snug">
                Li e aceito os{' '}
                <Link
                  to="/termos"
                  target="_blank"
                  className="font-semibold text-qe-black underline underline-offset-2 hover:text-qe-yellow transition-colors"
                >
                  Termos de Uso
                </Link>
              </span>
            </label>
            {freelancerErrors.aceite_termos?.message && (
              <p className="text-[12px] text-qe-error -mt-3" role="alert">
                {freelancerErrors.aceite_termos.message}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              loading={loading}
              trailingIcon={<ArrowRight size={20} />}
              className="mt-2"
            >
              Concluir Cadastro
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
