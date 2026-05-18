import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Upload, X, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button, useToast } from '@/components/ui'
import { AuthPageShell } from '@/components/auth/AuthPageShell'
import { useAuth } from '@/contexts/AuthContext'
import {
  ACCEPTED_DOCUMENT_EXTENSIONS,
  validateDocumentFile,
} from '@/lib/validators/file'
import { notifyAdminNewCompanySignup } from '@/services/empresa/empresaSignup'
import { uploadCompanyDocument } from '@/services/storage/uploadFile'

interface UploadedDoc {
  file: File
  id: string
}

const DOCUMENT_HINTS = [
  'Contrato social',
  'Identidade do responsável',
  'Certificado MEI',
]

export default function CadastroEmpresaDocumentosForm() {
  const { user, company, refreshCompany } = useAuth()
  const [documents, setDocuments] = useState<UploadedDoc[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const { showToast } = useToast()

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return

    const next: UploadedDoc[] = [...documents]
    const nextErrors: Record<string, string> = { ...errors }

    Array.from(fileList).forEach((file) => {
      const id = `${file.name}-${file.size}-${Date.now()}`
      const validationError = validateDocumentFile(file)
      if (validationError) {
        nextErrors[id] = validationError
        return
      }
      next.push({ file, id })
    })

    setDocuments(next)
    setErrors(nextErrors)
  }

  const removeDocument = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id))
    setErrors((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (documents.length === 0) {
      showToast('Envie ao menos um documento para continuar.', 'error')
      return
    }

    setLoading(true)
    try {
      const paths: string[] = []
      for (const doc of documents) {
        const path = await uploadCompanyDocument(user.id, doc.file)
        paths.push(path)
      }

      const existing = company?.documento_url ?? []
      const { error } = await supabase
        .from('companies')
        .update({
          documento_url: [...existing, ...paths],
          status: 'pendente',
        })
        .eq('profile_id', user.id)

      if (error) throw error

      await notifyAdminNewCompanySignup(user.id)
      await refreshCompany()

      showToast(
        'Documentos enviados! Seu cadastro está em análise. Você receberá um e-mail quando for aprovado.',
        'success'
      )
      navigate('/empresa/aguardando', { replace: true })
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erro ao enviar documentos.'
      showToast(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthPageShell
      title="Documentos da empresa"
      subtitle="Cadastro de empresa — etapa 2 de 2"
      step={{ current: 2, total: 2 }}
      footer={null}
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <p className="text-[14px] text-qe-gray-600 leading-relaxed">
          Envie um ou mais documentos para verificação. Formatos aceitos: PDF, JPG e PNG.
          Máximo de <strong>10MB</strong> por arquivo.
        </p>

        <ul className="text-[13px] text-qe-gray-500 space-y-1 list-disc pl-5">
          {DOCUMENT_HINTS.map((hint) => (
            <li key={hint}>{hint}</li>
          ))}
        </ul>

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_DOCUMENT_EXTENSIONS}
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-qe-gray-200 rounded-qe-md hover:border-qe-yellow hover:bg-qe-yellow/5 transition-colors"
        >
          <Upload size={28} className="text-qe-gray-400" />
          <span className="text-[14px] font-semibold text-qe-gray-700">
            Selecionar arquivos
          </span>
          <span className="text-[12px] text-qe-gray-500">PDF, JPG ou PNG — até 10MB cada</span>
        </button>

        {documents.length > 0 && (
          <ul className="space-y-2">
            {documents.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center gap-3 p-3 bg-qe-gray-50 rounded-qe-sm border border-qe-gray-100"
              >
                <FileText size={20} className="text-qe-gray-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-qe-gray-800 truncate">
                    {doc.file.name}
                  </p>
                  <p className="text-[11px] text-qe-gray-500">
                    {(doc.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {errors[doc.id] && (
                    <p className="text-[11px] text-qe-error">{errors[doc.id]}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeDocument(doc.id)}
                  className="p-1 text-qe-gray-400 hover:text-qe-error transition-colors"
                  aria-label={`Remover ${doc.file.name}`}
                >
                  <X size={18} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <Button
          type="submit"
          size="lg"
          loading={loading}
          trailingIcon={<ArrowRight size={20} />}
          className="w-full"
          disabled={documents.length === 0}
        >
          Enviar documentos
        </Button>
      </form>
    </AuthPageShell>
  )
}
