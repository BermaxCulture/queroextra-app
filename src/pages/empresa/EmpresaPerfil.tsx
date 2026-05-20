import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Avatar,
  Button,
  Input,
  ResponsiveSheet,
  useToast,
} from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Building2, Mail, FileText, LogOut, Eye, Pencil } from 'lucide-react'

const editSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  area: z.string().min(2, 'Informe o segmento de atuação'),
})
type EditFormData = z.infer<typeof editSchema>

export default function EmpresaPerfil() {
  const { profile, company, signOut } = useAuth()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [showEditSheet, setShowEditSheet] = React.useState(false)
  const [showLogoutSheet, setShowLogoutSheet] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [loggingOut, setLoggingOut] = React.useState(false)

  // Local overrides after successful save — avoids full page reload
  const [localNome, setLocalNome] = React.useState(profile?.nome ?? '')
  const [localArea, setLocalArea] = React.useState(company?.area ?? '')

  const { register, handleSubmit, formState: { errors }, reset } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: { nome: profile?.nome ?? '', area: company?.area ?? '' },
  })

  React.useEffect(() => {
    if (showEditSheet) reset({ nome: localNome, area: localArea })
  }, [showEditSheet])

  const onSubmit = async (data: EditFormData) => {
    try {
      setSaving(true)
      const [profileRes, companyRes] = await Promise.all([
        supabase.from('profiles').update({ nome: data.nome }).eq('id', profile!.id),
        supabase.from('companies').update({ area: data.area }).eq('id', company!.id),
      ])
      if (profileRes.error) throw profileRes.error
      if (companyRes.error) throw companyRes.error
      setLocalNome(data.nome)
      setLocalArea(data.area)
      showToast('Perfil atualizado com sucesso!', 'success')
      setShowEditSheet(false)
    } catch {
      showToast('Erro ao salvar alterações', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    try {
      setLoggingOut(true)
      await signOut()
    } finally {
      setLoggingOut(false)
      setShowLogoutSheet(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-h1 font-bold text-qe-gray-900">Meu Perfil</h1>
        <p className="text-[14px] text-qe-gray-500 mt-1">
          Gerencie os dados cadastrais da sua empresa no QueroExtra.
        </p>
      </div>

      <div className="bg-qe-white rounded-qe-md border border-qe-gray-200 p-6 md:p-8 space-y-6 shadow-qe-sm">
        {/* Header com avatar */}
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

        {/* Campos somente leitura */}
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
                <span>{company?.cnpj_cpf || 'Não cadastrado'}</span>
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

        {/* Ações */}
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
        title="Editar Perfil"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4 pb-8">
          <Input
            label="Nome da Empresa"
            placeholder="Ex: Restaurante Bella Vista"
            errorMessage={errors.nome?.message}
            {...register('nome')}
          />
          <Input
            label="Segmento / Área de Atuação"
            placeholder="Ex: Alimentação, Eventos, Construção..."
            errorMessage={errors.area?.message}
            {...register('area')}
          />
          <Button type="submit" variant="primary" size="lg" className="w-full" loading={saving}>
            Salvar Alterações
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
