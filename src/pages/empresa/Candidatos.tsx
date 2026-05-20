import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { CandidatosTab } from '@/components/empresa/CandidatosTab'

export default function Candidatos() {
  const navigate = useNavigate()

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        type="button"
        onClick={() => navigate('/empresa/gestao')}
        className="flex items-center gap-2 text-[14px] text-qe-gray-500 font-bold hover:text-qe-gray-700 cursor-pointer"
      >
        <ArrowLeft size={16} />
        Voltar para Gestão
      </button>

      <div>
        <h1 className="text-h1 font-bold text-qe-gray-900">Análise de Perfis</h1>
        <p className="text-[14px] text-qe-gray-500 mt-1">
          Analise e aprove profissionais qualificados que se candidataram às suas vagas.
        </p>
      </div>

      <CandidatosTab tabParamName="tab" />
    </div>
  )
}
