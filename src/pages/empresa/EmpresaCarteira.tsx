import {
  StatCard,
  Button,
  EmptyState,
} from '@/components/ui'
import {
  Wallet,
  TrendingUp,
  Download,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react'

export default function EmpresaCarteira() {
  return (
    <div className="space-y-8">
      {/* Título */}
      <div>
        <h1 className="text-h1 font-bold text-qe-gray-900">Minha Carteira</h1>
        <p className="text-[14px] text-qe-gray-500 mt-1">
          Acompanhe suas despesas de contratação e histórico financeiro.
        </p>
      </div>

      {/* Alerta de MVP */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-qe-md p-4 max-w-3xl">
        <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={20} />
        <div className="text-[13px] text-amber-800 leading-relaxed">
          <strong>Pagamentos diretamente ao profissional:</strong> Nesta fase de lançamento do
          QueroExtra, o pagamento dos turnos contratados deve ser feito diretamente para o
          freelancer (via Pix ou dinheiro) logo após a conclusão do expediente. Em breve você poderá
          centralizar todo o seu financeiro e faturamento por aqui.
        </div>
      </div>

      {/* Grade Financeira */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Total Pago em Extras"
          value="R$ 0,00"
          subtext="Histórico acumulado"
          icon={<TrendingUp size={16} className="text-qe-success" />}
        />
        <StatCard
          label="Turnos Pagos"
          value="0"
          subtext="Profissionais contratados"
        />
        <StatCard
          label="Pendentes de Fechamento"
          value="R$ 0,00"
          subtext="A pagar diretamente"
          icon={<Wallet size={16} className="text-qe-yellow" />}
        />
      </section>

      {/* Histórico Mockado */}
      <div className="bg-white rounded-qe-md border border-qe-gray-200 p-6 md:p-8 space-y-6 shadow-qe-sm">
        <div className="flex justify-between items-center pb-4 border-b border-qe-gray-100">
          <div>
            <h3 className="text-[16px] font-bold text-qe-gray-900">Histórico de Lançamentos</h3>
            <p className="text-[12px] text-qe-gray-400 mt-0.5">Seus turnos finalizados e valores</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-1 text-[12px] font-bold text-qe-gray-500 hover:text-qe-gray-700"
          >
            <Download size={14} /> Exportar CSV
          </Button>
        </div>

        <EmptyState
          icon={<FileSpreadsheet size={40} className="text-qe-gray-300" />}
          title="Sem movimentações recentes"
          description="Você ainda não possui turnos concluídos ou faturados."
        />
      </div>
    </div>
  )
}
