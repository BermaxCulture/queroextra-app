import { useNavigate } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'

export default function EmailConfirmadoPage() {
  const navigate = useNavigate()
  const { signOut } = useAuth()

  const handleLogin = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-qe-gray-50 px-4">
      <div className="w-full max-w-[400px] bg-qe-white rounded-qe-lg border border-qe-gray-200 shadow-qe-sm p-8 flex flex-col items-center text-center gap-6">

        <div className="w-16 h-16 rounded-full bg-qe-success-bg flex items-center justify-center">
          <CheckCircle size={32} className="text-qe-success" />
        </div>

        <div className="space-y-2">
          <h1 className="text-[22px] font-bold text-qe-gray-900 leading-snug">
            E-mail confirmado!
          </h1>
          <p className="text-[14px] text-qe-gray-500 leading-relaxed">
            Seu endereço de e-mail foi atualizado com sucesso. Faça login novamente para continuar.
          </p>
        </div>

        <Button variant="primary" size="lg" className="w-full" onClick={handleLogin}>
          Ir para o Login
        </Button>
      </div>
    </div>
  )
}
