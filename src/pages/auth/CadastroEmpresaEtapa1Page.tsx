import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, Building2, ArrowRight, Eye, EyeOff, CreditCard, Camera } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button, Input, Select, useToast, Avatar } from '@/components/ui'
import { AuthPageShell } from '@/components/auth/AuthPageShell'
import {
  cnpjCpfLabel,
  formatCnpjCpf,
  isValidCnpjCpf,
  stripCnpjCpf,
} from '@/lib/validators/cnpjCpf'
import { validateImageFile } from '@/lib/validators/file'
import { checkEmailAvailable } from '@/services/auth/checkEmailAvailable'

const passwordSchema = z
  .string()
  .min(8, 'A senha deve ter pelo menos 8 caracteres')
  .regex(/[A-Z]/, 'Deve conter pelo menos uma letra maiúscula')
  .regex(/[a-z]/, 'Deve conter pelo menos uma letra minúscula')
  .regex(/[0-9]/, 'Deve conter pelo menos um número')
  .regex(/[^A-Za-z0-9]/, 'Deve conter pelo menos um caractere especial')

const empresaEtapa1Schema = z.object({
  nome: z.string().min(2, 'Informe o nome da empresa ou seu nome completo'),
  cnpj_cpf: z
    .string()
    .min(14, 'Documento inválido')
    .refine(isValidCnpjCpf, 'CNPJ ou CPF inválido'),
  email: z.string().email('E-mail inválido'),
  area: z.string().min(1, 'Selecione a área de atuação'),
  password: passwordSchema,
})

type EmpresaEtapa1Form = z.infer<typeof empresaEtapa1Schema>

export default function CadastroEmpresaEtapa1Page() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoError, setLogoError] = useState<string | null>(null)
  const [segmentos, setSegmentos] = useState<{ label: string; value: string }[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const { showToast } = useToast()

  useEffect(() => {
    supabase
      .from('segmentos')
      .select('nome, ordem')
      .order('ordem')
      .then(({ data }) => {
        if (data) setSegmentos(data.map((s) => ({ label: s.nome, value: s.nome })))
      })
  }, [])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<EmpresaEtapa1Form>({
    resolver: zodResolver(empresaEtapa1Schema),
    defaultValues: { cnpj_cpf: '' },
  })

  const cnpjCpfValue = watch('cnpj_cpf', '')
  const docLabel = cnpjCpfValue.length > 0 ? cnpjCpfLabel(cnpjCpfValue) : 'CNPJ ou CPF'

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue('cnpj_cpf', formatCnpjCpf(e.target.value), { shouldValidate: true })
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validationError = validateImageFile(file)
    if (validationError) {
      setLogoError(validationError)
      return
    }

    setLogoError(null)
    setLogoPreview(URL.createObjectURL(file))
  }

  const onSubmit = async (data: EmpresaEtapa1Form) => {
    setLoading(true)
    try {
      // Verifica se o e-mail já está em uso antes de criar a conta
      const emailDisponivel = await checkEmailAvailable(data.email)
      if (!emailDisponivel) {
        showToast('Este e-mail já está cadastrado. Tente fazer login ou use outro e-mail.', 'error')
        return
      }

      const metadata = {
        nome: data.nome,
        nome_empresa: data.nome,
        tipo: 'empresa' as const,
        cnpj_cpf: stripCnpjCpf(data.cnpj_cpf),
        area: data.area,
      }

      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: metadata,
        },
      })

      if (error) throw error

      sessionStorage.setItem(
        'qe_pending_empresa',
        JSON.stringify({
          nome: data.nome,
          email: data.email,
          cnpj_cpf: data.cnpj_cpf,
          area: data.area,
          avatar_url: null,
        })
      )

      navigate(`/verificar-email?email=${encodeURIComponent(data.email)}&tipo=empresa`)
    } catch (error: any) {
      console.error('Erro detalhado no cadastro de empresa (Etapa 1):', error)
      let message = 'Erro ao cadastrar empresa.'
      if (error?.message) {
        if (error.message === 'User already registered') {
          message = 'Este e-mail já está cadastrado.'
        } else {
          message = `Erro ao cadastrar empresa: ${error.message}`
        }
      }
      showToast(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthPageShell
      title="Dados da empresa"
      subtitle="Cadastro de empresa — etapa 1 de 2"
      step={{ current: 1, total: 2 }}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative group"
            aria-label="Enviar logo da empresa"
          >
            <Avatar src={logoPreview ?? undefined} name={watch('nome') || 'Empresa'} size="xl" />
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={24} className="text-white" />
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/jpg"
            className="hidden"
            onChange={handleLogoChange}
          />
          <p className="text-[12px] text-qe-gray-500">Logo ou foto (opcional)</p>
          {logoError && (
            <p className="text-[12px] text-qe-error" role="alert">
              {logoError}
            </p>
          )}
        </div>

        <Input
          label="Nome da empresa ou nome completo"
          placeholder="Ex: Bar do Zé ou Maria Silva MEI"
          icon={<Building2 size={20} />}
          {...register('nome')}
          errorMessage={errors.nome?.message}
        />

        <Input
          label={docLabel}
          placeholder={docLabel === 'CNPJ' ? '00.000.000/0000-00' : '000.000.000-00'}
          icon={<CreditCard size={20} />}
          inputMode="numeric"
          {...register('cnpj_cpf')}
          onChange={handleDocumentChange}
          errorMessage={errors.cnpj_cpf?.message}
        />

        <Input
          label="E-mail corporativo ou pessoal"
          placeholder="contato@empresa.com"
          icon={<Mail size={20} />}
          type="email"
          autoComplete="email"
          {...register('email')}
          errorMessage={errors.email?.message}
        />

        <Controller
          name="area"
          control={control}
          render={({ field }) => (
            <Select
              label="Área de atuação"
              placeholder="Selecione uma área"
              options={segmentos}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              errorMessage={errors.area?.message}
            />
          )}
        />

        <div className="relative">
          <Input
            label="Senha de acesso"
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

        <p className="text-[12px] text-qe-gray-500 leading-relaxed">
          Após confirmar o e-mail, você enviará os documentos na{' '}
          <strong className="text-qe-gray-700">etapa 2</strong>. Sua conta ficará{' '}
          <strong className="text-qe-gray-700">pendente</strong> até aprovação do admin.
        </p>

        <Button
          type="submit"
          size="lg"
          loading={loading}
          trailingIcon={<ArrowRight size={20} />}
          className="w-full"
        >
          Cadastrar Empresa
        </Button>

        <p className="text-center text-[13px] text-qe-gray-500">
          É freelancer?{' '}
          <Link to="/cadastro" className="font-semibold text-qe-black hover:text-qe-yellow">
            Cadastre-se aqui
          </Link>
        </p>
      </form>
    </AuthPageShell>
  )
}
