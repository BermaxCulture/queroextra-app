import { useAuth } from '@/contexts/AuthContext'
import {
  Avatar,
  Button,
} from '@/components/ui'
import {
  Building2,
  Mail,
  FileText,
  LogOut,
} from 'lucide-react'

export default function EmpresaPerfil() {
  const { profile, company, signOut } = useAuth()

  const handleLogout = async () => {
    if (window.confirm('Tem certeza que deseja sair de sua conta?')) {
      await signOut()
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Título */}
      <div>
        <h1 className="text-h1 font-bold text-qe-gray-900">Meu Perfil</h1>
        <p className="text-[14px] text-qe-gray-500 mt-1">
          Gerencie os dados cadastrais da sua empresa no QueroExtra.
        </p>
      </div>

      {/* Card Principal */}
      <div className="bg-white rounded-qe-md border border-qe-gray-200 p-6 md:p-8 space-y-6 shadow-qe-sm">
        <div className="flex flex-col sm:flex-row items-center gap-4 pb-6 border-b border-qe-gray-100">
          <Avatar
            src={profile?.avatar_url || undefined}
            name={profile?.nome || 'Empresa'}
            size="lg"
          />
          <div className="text-center sm:text-left">
            <h2 className="text-[20px] font-bold text-qe-gray-900">{profile?.nome || 'Empresa Parceira'}</h2>
            <div className="flex items-center gap-1.5 justify-center sm:justify-start mt-1 text-[13px] text-qe-gray-400 font-medium">
              <Building2 size={14} />
              <span>{company?.area || 'Segmento não informado'}</span>
            </div>
          </div>
        </div>

        {/* Campos de Dados */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Email */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-qe-gray-400 uppercase tracking-[0.5px]">E-mail de Acesso</span>
              <div className="flex items-center gap-2 p-3 bg-qe-gray-50 border border-qe-gray-100 rounded-qe-sm text-[14px] text-qe-gray-700">
                <Mail size={15} className="text-qe-gray-400" />
                <span className="truncate">{profile?.email}</span>
              </div>
            </div>

            {/* CNPJ / CPF */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-qe-gray-400 uppercase tracking-[0.5px]">Documento (CNPJ/CPF)</span>
              <div className="flex items-center gap-2 p-3 bg-qe-gray-50 border border-qe-gray-100 rounded-qe-sm text-[14px] text-qe-gray-700">
                <FileText size={15} className="text-qe-gray-400" />
                <span>{company?.cnpj_cpf || 'Não cadastrado'}</span>
              </div>
            </div>
          </div>

          {/* Status do Cadastro */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-qe-gray-400 uppercase tracking-[0.5px]">Status da Conta</span>
            <div className="p-3 bg-qe-success-bg border border-qe-success/10 rounded-qe-sm text-[14px] text-qe-success font-bold flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-qe-success rounded-full animate-pulse" />
              <span>Estabelecimento Homologado e Ativo</span>
            </div>
          </div>
        </div>

        {/* Botões de Ações */}
        <div className="pt-6 border-t border-qe-gray-100 flex flex-col sm:flex-row gap-3 justify-between">
          <Button
            variant="secondary"
            size="md"
            className="flex items-center gap-2 text-qe-gray-500 font-bold hover:text-qe-gray-700"
            onClick={() => window.alert('Edição de dados disponível em breve')}
          >
            Editar Informações
          </Button>

          <Button
            variant="ghost"
            size="md"
            className="flex items-center justify-center gap-2 text-qe-error hover:bg-qe-error-bg font-bold border-none"
            onClick={handleLogout}
          >
            <LogOut size={16} /> Encerrar Sessão
          </Button>
        </div>
      </div>
    </div>
  )
}
