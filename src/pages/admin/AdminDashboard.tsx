import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, ChevronRight, Wallet } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui'

export default function AdminDashboard() {
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    supabase
      .from('companies')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pendente')
      .then(({ count }) => setPendingCount(count ?? 0))
  }, [])

  return (
    <div className="min-h-screen bg-qe-off-white font-sans p-6">
      <div className="max-w-xl mx-auto space-y-3">
        <h1 className="text-[22px] font-bold text-qe-gray-900 mb-3">Admin</h1>
        <Link
          to="/admin/empresas-pendentes"
          className="flex items-center justify-between p-5 bg-qe-white rounded-qe-md border border-qe-gray-100 hover:border-qe-yellow transition-colors"
        >
          <div className="flex items-center gap-3">
            <Building2 size={22} className="text-qe-gray-600" />
            <span className="text-[15px] font-semibold text-qe-gray-900">Validar Empresas</span>
          </div>
          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <Badge variant="warning">
                {pendingCount} pendente{pendingCount !== 1 ? 's' : ''}
              </Badge>
            )}
            <ChevronRight size={18} className="text-qe-gray-400" />
          </div>
        </Link>

        <Link
          to="/admin/pagamentos"
          className="flex items-center justify-between p-5 bg-qe-white rounded-qe-md border border-qe-gray-100 hover:border-qe-yellow transition-colors"
        >
          <div className="flex items-center gap-3">
            <Wallet size={22} className="text-qe-gray-600" />
            <span className="text-[15px] font-semibold text-qe-gray-900">Pagamentos</span>
          </div>
          <ChevronRight size={18} className="text-qe-gray-400" />
        </Link>
      </div>
    </div>
  )
}
