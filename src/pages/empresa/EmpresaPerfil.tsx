import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Avatar,
  Button,
  Input,
  Select,
  ResponsiveSheet,
  useToast,
} from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import {
  cnpjCpfLabel,
  formatCnpjCpf,
  isValidCnpjCpf,
  stripCnpjCpf,
} from '@/lib/validators/cnpjCpf'
import { Building2, Mail, FileText, LogOut, Eye, Pencil, Lock, EyeOff } from 'lucide-react'

// ── Schemas ──────────────────────────────────────────────────────────────────

const editSchema = z.object({
  nome:     z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  cnpj_cpf: z.string().min(14, 'Documento inválido').refine(isValidCnpjCpf, 'CNPJ ou CPF inválido'),
  email:    z.string().email('E-mail inválido'),
  area:     z.string().min(1, 'Selecione o segmento'),
})
type EditFormData = z.infer<typeof editSchema>

const passwordSchema = z
  .object({
    newPassword:     z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .regex(/[A-Z]/, 'Deve conter letra maiúscula')
      .regex(/[a-z]/, 'Deve conter letra minúscula')
      .regex(/[0-9]/, 'Deve conter um número')
      .regex(/[^A-Za-z0-9]/, 'Deve conter caractere especial'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'As senhas não coincidem',
    path:    ['confirmPassword'],
  })
type PasswordFormData = z.infer<typeof passwordSchema>

// ── Component ─────────────────────────────────────────────────────────────────

export default function EmpresaPerfil() {
  const { profile, company, signOut } = useAuth()
  const navigate = useNavigate()
  const { showToast } = useToast()

  // Sheet visibility
  const [showEditSheet,     setShowEditSheet]     = React.useState(false)
  const [showPasswordSheet, setShowPasswordSheet] = React.useState(false)
  const [showLogoutSheet,   setShowLogoutSheet]   = React.useState(false)

  // Loading states
  const [saving,      setSaving]      = React.useState(false)
  const [savingPass,  setSavingPass]  = React.useState(false)
  const [loggingOut,  setLoggingOut]  = React.useState(false)

  // Password visibility
  const [showNew,     setShowNew]     = React.useState(false)
  const [showConfirm, setShowConfirm] = React.useState(false)

  // Segmentos from DB
  const [segmentos, setSegmentos] = React.useState<{ label: string; value: string }[]>([])

  React.useEffect(() => {
    supabase
      .from('segmentos')
      .select('nome, ordem')
      .order('ordem')
      .then(({ data }) => {
        if (data) setSegmentos(data.map((s) => ({ label: s.nome, value: s.nome })))
      })
  }, [])

  // Local overrides — updated optimistically after save (no full page reload)
  const [localNome,    setLocalNome]    = React.useState(profile?.nome ?? '')
  const [localArea,    setLocalArea]    = React.useState(company?.area ?? '')
  const [localCnpjCpf, setLocalCnpjCpf] = React.useState(
    company?.cnpj_cpf ? formatCnpjCpf(company.cnpj_cpf) : ''
  )

  // ── Edit form ──────────────────────────────────────────────────────────────

  const {
    register: regEdit,
    handleSubmit: handleEditSubmit,
    setValue: setEditValue,
    watch: watchEdit,
    control: editControl,
    formState: { errors: editErrors },
    reset: resetEdit,
  } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      nome:     profile?.nome ?? '',
      cnpj_cpf: company?.cnpj_cpf ? formatCnpjCpf(company.cnpj_cpf) : '',
      email:    profile?.email ?? '',
      area:     company?.area ?? '',
    },
  })

  const cnpjCpfValue = watchEdit('cnpj_cpf', '')
  const docLabel = cnpjCpfValue.length > 0 ? cnpjCpfLabel(cnpjCpfValue) : 'CNPJ ou CPF'

  React.useEffect(() => {
    if (showEditSheet) {
      resetEdit({
        nome:     localNome,
        cnpj_cpf: localCnpjCpf,
        email:    profile?.email ?? '',
        area:     localArea,
      })
    }
  }, [showEditSheet])

  const onEditSubmit = async (data: EditFormData) => {
    try {
      setSaving(true)

      const profileRes = await supabase
        .from('profiles')
        .update({ nome: data.nome })
        .eq('id', profile!.id)
      if (profileRes.error) throw profileRes.error

      const companyRes = await supabase
        .from('companies')
        .update({ area: data.area, cnpj_cpf: stripCnpjCpf(data.cnpj_cpf) })
        .eq('id', company!.id)
      if (companyRes.error) throw companyRes.error

      const emailChanged =
        data.email.trim().toLowerCase() !== (profile?.email ?? '').toLowerCase()
      if (emailChanged) {
        const { error: emailErr } = await supabase.auth.updateUser(
          { email: data.email.trim() },
          { emailRedirectTo: `${window.location.origin}/email-confirmado` }
        )
        if (emailErr) throw emailErr
      }

      setLocalNome(data.nome)
      setLocalArea(data.area)
      setLocalCnpjCpf(data.cnpj_cpf)

      const msg = emailChanged
        ? `Perfil atualizado! Confirme o novo e-mail enviado para ${data.email}.`
        : 'Perfil atualizado com sucesso!'

      showToast(msg, 'success')
      setShowEditSheet(false)
    } catch {
      showToast('Erro ao salvar alterações', 'error')
    } finally {
      setSaving(false)
    }
  }

  // ── Password form ──────────────────────────────────────────────────────────

  const {
    register: regPass,
    handleSubmit: handlePassSubmit,
    formState: { errors: passErrors },
    reset: resetPass,
  } = useForm<PasswordFormData>({ resolver: zodResolver(passwordSchema) })

  React.useEffect(() => {
    if (!showPasswordSheet) resetPass()
  }, [showPasswordSheet])

  const onPasswordSubmit = async (data: PasswordFormData) => {
    try {
      setSavingPass(true)
      const { error } = await supabase.auth.updateUser({ password: data.newPassword })
      if (error) throw error
      showToast('Senha alterada com sucesso!', 'success')
      setShowPasswordSheet(false)
    } catch {
      showToast('Erro ao alterar senha', 'error')
    } finally {
      setSavingPass(false)
    }
  }

  // ── Logout ─────────────────────────────────────────────────────────────────

  const handleLogout = async () => {
    try {
      setLoggingOut(true)
      await signOut()
    } finally {
      setLoggingOut(false)
      setShowLogoutSheet(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-h1 font-bold text-qe-gray-900">Meu Perfil</h1>
        <p className="text-[14px] text-qe-gray-500 mt-1">
          Gerencie os dados cadastrais da sua empresa no QueroExtra.
        </p>
      </div>

      <div className="bg-qe-white rounded-qe-md border border-qe-gray-200 p-6 md:p-8 space-y-6 shadow-qe-sm">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center gap-4 pb-6 border-b border-qe-gray-100">
          <Avatar
            src={profile?.avatar_url || undefined}
            name={localNome || 'Empresa'}
            size="lg"
            verified={company?.status === 'aprovado'}
          />
          <div className="text-center sm:text-left">
            <h2 className="text-[20px] font-bold text-qe-gray-900">{localNome || 'Empresa Parceira'}</h2>
            <div className="flex items-center gap-1.5 justify-center sm:justify-start mt-1 text-[13px] text-qe-gray-400 font-medium">
              <Building2 size={14} />
              <span>{localArea || 'Segmento não informado'}</span>
            </div>
          </div>
        </div>

        {/* Read-only fields */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-label text-qe-gray-400 uppercase">E-mail de Acesso</span>
              <div className="flex items-center gap-2 p-3 bg-qe-gray-50 border border-qe-gray-100 rounded-qe-sm text-[14px] text-qe-gray-700">
                <Mail size={15} className="text-qe-gray-400 shrink-0" />
                <span className="truncate">{profile?.email}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-label text-qe-gray-400 uppercase">Documento (CNPJ/CPF)</span>
              <div className="flex items-center gap-2 p-3 bg-qe-gray-50 border border-qe-gray-100 rounded-qe-sm text-[14px] text-qe-gray-700">
                <FileText size={15} className="text-qe-gray-400 shrink-0" />
                <span>{localCnpjCpf || company?.cnpj_cpf || 'Não cadastrado'}</span>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-label text-qe-gray-400 uppercase">Status da Conta</span>
            <div className="p-3 bg-qe-success-bg border border-qe-success/10 rounded-qe-sm text-[14px] text-qe-success font-bold flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-qe-success rounded-full" />
              <span>Estabelecimento Homologado e Ativo</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-6 border-t border-qe-gray-100 flex flex-col sm:flex-row gap-3 justify-between">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="secondary"
              size="md"
              leadingIcon={<Pencil size={15} />}
              onClick={() => setShowEditSheet(true)}
            >
              Editar Informações
            </Button>

            <Button
              variant="ghost"
              size="md"
              leadingIcon={<Lock size={15} />}
              className="border border-qe-gray-200"
              onClick={() => setShowPasswordSheet(true)}
            >
              Alterar Senha
            </Button>

            {company?.id && (
              <Button
                variant="ghost"
                size="md"
                leadingIcon={<Eye size={15} />}
                className="border border-qe-gray-200"
                onClick={() => navigate('/empresa/perfil-publico')}
              >
                Prévia pública
              </Button>
            )}
          </div>

          <Button
            variant="ghost"
            size="md"
            leadingIcon={<LogOut size={15} />}
            className="text-qe-error hover:bg-qe-error-bg border-none"
            onClick={() => setShowLogoutSheet(true)}
          >
            Encerrar Sessão
          </Button>
        </div>
      </div>

      {/* Sheet: Editar Perfil */}
      <ResponsiveSheet
        open={showEditSheet}
        onClose={() => setShowEditSheet(false)}
        title="Editar Informações"
      >
        <form onSubmit={handleEditSubmit(onEditSubmit)} className="space-y-4 p-4 pb-8">
          <Input
            label="Nome da Empresa"
            placeholder="Ex: Restaurante Bella Vista"
            errorMessage={editErrors.nome?.message}
            {...regEdit('nome')}
          />

          <Input
            label={docLabel}
            placeholder={docLabel === 'CNPJ' ? '00.000.000/0000-00' : '000.000.000-00'}
            inputMode="numeric"
            errorMessage={editErrors.cnpj_cpf?.message}
            {...regEdit('cnpj_cpf')}
            onChange={(e) =>
              setEditValue('cnpj_cpf', formatCnpjCpf(e.target.value), { shouldValidate: true })
            }
          />

          <div className="space-y-1">
            <Input
              label="E-mail de Acesso"
              type="email"
              placeholder="contato@empresa.com"
              errorMessage={editErrors.email?.message}
              {...regEdit('email')}
            />
            <p className="text-[12px] text-qe-gray-400 leading-relaxed px-1">
              Ao alterar, um e-mail de confirmação será enviado para o novo endereço.
            </p>
          </div>

          <Controller
            name="area"
            control={editControl}
            render={({ field }) => (
              <Select
                label="Segmento / Área de Atuação"
                placeholder="Selecione um segmento"
                options={segmentos}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                errorMessage={editErrors.area?.message}
              />
            )}
          />

          <Button type="submit" variant="primary" size="lg" className="w-full" loading={saving}>
            Salvar Alterações
          </Button>
        </form>
      </ResponsiveSheet>

      {/* Sheet: Alterar Senha */}
      <ResponsiveSheet
        open={showPasswordSheet}
        onClose={() => setShowPasswordSheet(false)}
        title="Alterar Senha"
      >
        <form onSubmit={handlePassSubmit(onPasswordSubmit)} className="space-y-4 p-4 pb-8">
          <div className="relative">
            <Input
              label="Nova Senha"
              type={showNew ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="new-password"
              errorMessage={passErrors.newPassword?.message}
              {...regPass('newPassword')}
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              className="absolute right-4 top-[42px] text-qe-gray-400 hover:text-qe-gray-600 transition-colors"
              tabIndex={-1}
              aria-label={showNew ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="relative">
            <Input
              label="Confirmar Nova Senha"
              type={showConfirm ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="new-password"
              errorMessage={passErrors.confirmPassword?.message}
              {...regPass('confirmPassword')}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-4 top-[42px] text-qe-gray-400 hover:text-qe-gray-600 transition-colors"
              tabIndex={-1}
              aria-label={showConfirm ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <p className="text-[12px] text-qe-gray-400 leading-relaxed px-1">
            A senha deve ter mínimo 8 caracteres, letra maiúscula, minúscula, número e caractere especial.
          </p>

          <Button type="submit" variant="primary" size="lg" className="w-full" loading={savingPass}>
            Alterar Senha
          </Button>
        </form>
      </ResponsiveSheet>

      {/* Sheet: Confirmar Logout */}
      <ResponsiveSheet
        open={showLogoutSheet}
        onClose={() => setShowLogoutSheet(false)}
        title="Encerrar Sessão"
      >
        <div className="p-4 pb-8 space-y-4">
          <p className="text-[14px] text-qe-gray-600 leading-relaxed">
            Tem certeza que deseja sair? Você precisará fazer login novamente para acessar o painel.
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              size="md"
              className="flex-1"
              onClick={() => setShowLogoutSheet(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              size="md"
              className="flex-1"
              loading={loggingOut}
              onClick={handleLogout}
            >
              Sair
            </Button>
          </div>
        </div>
      </ResponsiveSheet>
    </div>
  )
}
