/*
 * Estratégia A — companies.documento_url[] já contém os paths relativos do bucket company-docs.
 * Formato: {profile_id}/{timestamp}-{filename}
 * Acesso: supabase.storage.from('company-docs').createSignedUrl(path, 3600)
 * Não há URL pública — sempre signed URL com expiração de 1 hora.
 */

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle, ChevronLeft, FileText, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Badge, BottomSheet, Button, EmptyState, useToast } from '@/components/ui'

interface EmpresaPendente {
  id: string
  cnpj_cpf: string | null
  area: string | null
  documento_url: string[] | null
  status: string
  created_at: string
  profiles: {
    nome: string | null
    email: string | null
    celular: string | null
  } | null
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const date = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return `${date} às ${time}`
}

function isImage(path: string): boolean {
  return /\.(jpe?g|png|webp|gif)$/i.test(path)
}

function fileName(path: string): string {
  const raw = path.split('/').pop() ?? path
  return raw.replace(/^\d+-/, '')
}

export default function ValidarEmpresas() {
  const { showToast } = useToast()
  const [empresas, setEmpresas] = useState<EmpresaPendente[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<EmpresaPendente | null>(null)
  const [signedUrls, setSignedUrls] = useState<string[]>([])
  const [loadingUrls, setLoadingUrls] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [showRejection, setShowRejection] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  useEffect(() => {
    fetchEmpresas()
  }, [])

  async function fetchEmpresas() {
    setLoading(true)
    const { data, error } = await supabase
      .from('companies')
      .select(`
        id,
        cnpj_cpf,
        area,
        documento_url,
        status,
        created_at,
        profiles (
          nome,
          email,
          celular
        )
      `)
      .eq('status', 'pendente')
      .order('created_at', { ascending: true })

    if (error) {
      showToast('Erro ao carregar empresas.', 'error')
    } else {
      setEmpresas((data ?? []) as EmpresaPendente[])
    }
    setLoading(false)
  }

  async function openModal(empresa: EmpresaPendente) {
    setSelected(empresa)
    setShowRejection(false)
    setRejectionReason('')
    setSignedUrls([])

    const paths = empresa.documento_url ?? []
    if (paths.length === 0) return

    setLoadingUrls(true)
    const urls: string[] = []
    for (const path of paths) {
      const { data } = await supabase.storage
        .from('company-docs')
        .createSignedUrl(path, 3600)
      urls.push(data?.signedUrl ?? '')
    }
    setSignedUrls(urls)
    setLoadingUrls(false)
  }

  function closeModal() {
    setSelected(null)
    setSignedUrls([])
    setShowRejection(false)
    setRejectionReason('')
  }

  async function handleApprove() {
    if (!selected) return
    setActionLoading(true)
    const { error } = await supabase
      .from('companies')
      .update({ status: 'aprovado' })
      .eq('id', selected.id)

    if (error) {
      showToast('Erro ao aprovar empresa.', 'error')
    } else {
      showToast('Empresa aprovada com sucesso!', 'success')
      setEmpresas(prev => prev.filter(e => e.id !== selected.id))
      closeModal()
    }
    setActionLoading(false)
  }

  async function handleReject() {
    if (!selected) return
    if (rejectionReason.trim().length < 10) {
      showToast('O motivo deve ter ao menos 10 caracteres.', 'error')
      return
    }
    setActionLoading(true)
    const { error } = await supabase
      .from('companies')
      .update({ status: 'rejeitado' })
      .eq('id', selected.id)

    if (error) {
      showToast('Erro ao rejeitar empresa.', 'error')
    } else {
      showToast('Empresa rejeitada.', 'info')
      setEmpresas(prev => prev.filter(e => e.id !== selected.id))
      closeModal()
    }
    setActionLoading(false)
  }

  const docPaths = selected?.documento_url ?? []

  return (
    <div className="min-h-screen bg-qe-off-white font-sans">
      {/* Header */}
      <div className="bg-qe-white border-b border-qe-gray-100 px-5 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/admin"
              className="flex items-center gap-1 text-[14px] text-qe-gray-600 hover:text-qe-gray-900 transition-colors"
            >
              <ChevronLeft size={16} />
              Voltar
            </Link>
            <span className="text-qe-gray-200 select-none">|</span>
            <h1 className="text-[17px] font-bold text-qe-gray-900">Validar Empresas</h1>
          </div>
          {!loading && empresas.length > 0 && (
            <Badge variant="warning">
              {empresas.length} pendente{empresas.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </div>

      {/* Lista */}
      <div className="max-w-2xl mx-auto p-5 space-y-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-qe-yellow" />
          </div>
        ) : empresas.length === 0 ? (
          <EmptyState
            icon={<CheckCircle />}
            title="Nenhuma empresa pendente"
            description="Tudo em dia! 🎉"
          />
        ) : (
          empresas.map(empresa => (
            <div
              key={empresa.id}
              className="bg-qe-white rounded-qe-md border border-qe-gray-100 p-5"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-[16px] font-bold text-qe-gray-900">
                    {empresa.profiles?.nome ?? '—'}
                  </p>
                  <p className="text-[13px] text-qe-gray-500 mt-0.5">
                    {empresa.profiles?.email ?? '—'}
                  </p>
                </div>
                <Badge variant="pending">Pendente</Badge>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[13px] text-qe-gray-600 mb-4">
                <span>
                  <span className="font-medium">Documento:</span>{' '}
                  {empresa.cnpj_cpf ?? '—'}
                </span>
                <span>
                  <span className="font-medium">Área:</span>{' '}
                  {empresa.area ?? '—'}
                </span>
                <span>
                  <span className="font-medium">Cadastro:</span>{' '}
                  {formatDate(empresa.created_at)}
                </span>
                <span>
                  <span className="font-medium">Arquivos:</span>{' '}
                  {empresa.documento_url?.length ?? 0} documento
                  {(empresa.documento_url?.length ?? 0) !== 1 ? 's' : ''}
                </span>
              </div>

              <Button size="sm" onClick={() => openModal(empresa)} trailingIcon={<span>→</span>}>
                Ver documentos
              </Button>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      <BottomSheet open={!!selected} onClose={closeModal} title={selected?.profiles?.nome ?? 'Empresa'}>
        {selected && (
          <div className="space-y-5">
            {/* Badge + fechar */}
            <div className="flex items-center justify-between -mt-2">
              <Badge variant="pending">Pendente</Badge>
              <button
                type="button"
                onClick={closeModal}
                className="p-1 text-qe-gray-400 hover:text-qe-gray-700 transition-colors"
                aria-label="Fechar modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Documentos */}
            <div className="space-y-3">
              <p className="text-[12px] font-semibold text-qe-gray-500 uppercase tracking-wide">
                Documentos ({docPaths.length})
              </p>

              {loadingUrls ? (
                <div className="flex justify-center py-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-qe-yellow" />
                </div>
              ) : docPaths.length === 0 ? (
                <p className="text-[14px] text-qe-gray-500">Nenhum documento enviado.</p>
              ) : (
                docPaths.map((path, i) => {
                  const url = signedUrls[i]
                  const img = isImage(path)
                  const name = fileName(path)
                  return (
                    <div
                      key={path}
                      className="border border-qe-gray-100 rounded-qe-sm overflow-hidden"
                    >
                      {img && url && (
                        <img
                          src={url}
                          alt={name}
                          className="w-full object-contain max-h-[200px] bg-qe-gray-50"
                        />
                      )}
                      <div className="flex items-center gap-3 p-3">
                        <FileText size={18} className="text-qe-gray-500 shrink-0" />
                        <span className="text-[13px] text-qe-gray-700 flex-1 truncate">
                          {name}
                        </span>
                        {url ? (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[12px] font-semibold text-qe-navy hover:underline whitespace-nowrap"
                          >
                            Abrir →
                          </a>
                        ) : (
                          <span className="text-[12px] text-qe-error">Erro ao gerar link</span>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Motivo de rejeição */}
            {showRejection && (
              <div className="space-y-2">
                <label className="text-[13px] font-semibold text-qe-gray-700">
                  Motivo da rejeição <span className="text-qe-error">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder="Explique o motivo para rejeitar este cadastro..."
                  rows={3}
                  className="w-full border border-qe-gray-200 rounded-qe-sm px-3 py-2 text-[14px] text-qe-gray-900 resize-none focus:outline-none focus:border-qe-yellow"
                />
                <p className="text-[11px] text-qe-gray-400">
                  {rejectionReason.trim().length}/10 caracteres mínimos
                </p>
              </div>
            )}

            {/* Ações */}
            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={handleApprove}
                disabled={actionLoading}
                className="inline-flex items-center justify-center font-semibold font-sans rounded-qe-pill min-h-[52px] px-8 w-full text-[17px] bg-[#1A7A47] text-white hover:opacity-90 transition-opacity disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                {actionLoading ? (
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                ) : (
                  'Aprovar empresa'
                )}
              </button>

              {showRejection ? (
                <Button
                  size="lg"
                  variant="danger"
                  loading={actionLoading}
                  disabled={rejectionReason.trim().length < 10}
                  onClick={handleReject}
                >
                  Confirmar rejeição
                </Button>
              ) : (
                <Button
                  size="lg"
                  variant="danger"
                  onClick={() => setShowRejection(true)}
                >
                  Rejeitar
                </Button>
              )}
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  )
}
