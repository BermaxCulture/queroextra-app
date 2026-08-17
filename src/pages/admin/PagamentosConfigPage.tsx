import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

export default function PagamentosConfigPage() {
  return (
    <div className="min-h-screen bg-qe-off-white font-sans">
      <div className="bg-qe-white border-b border-qe-gray-100 px-5 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link
            to="/admin"
            className="flex items-center gap-1 text-[14px] text-qe-gray-600 hover:text-qe-gray-900 transition-colors"
          >
            <ChevronLeft size={16} />
            Voltar
          </Link>
          <span className="text-qe-gray-200 select-none">|</span>
          <h1 className="text-[17px] font-bold text-qe-gray-900">Pagamentos</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-5">
        <div className="bg-qe-white rounded-qe-md border border-qe-gray-100 p-5 space-y-3">
          <h2 className="text-[16px] font-bold text-qe-gray-900">Painel administrativo movido</h2>
          <p className="text-[13px] text-qe-gray-500 leading-relaxed">
            O admin foi separado para um projeto próprio (<code>queroextra-admin</code>).
            Testes de PIX de baixo valor agora são feitos marcando a empresa como conta de teste
            (<code>companies.is_test_account</code>), permitindo criar vagas reais de R$1 — em vez
            de um modo global que reduzia o valor de toda cobrança da plataforma enquanto ligado.
          </p>
        </div>
      </div>
    </div>
  )
}
