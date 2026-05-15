import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui'

export default function ExtrasHome() {
  const { profile, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-qe-off-white p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-display font-bold text-qe-black">Painel do Extra</h1>
            <p className="text-body text-qe-gray-500">Bem-vindo, {profile?.nome}</p>
          </div>
          <Button variant="ghost" onClick={signOut}>Sair</Button>
        </header>
        
        <div className="bg-white rounded-qe-lg p-12 shadow-qe-sm border border-qe-gray-200 text-center">
          <h2 className="text-h2 font-bold mb-4">Área do Contratado (Extra)</h2>
          <p className="text-body text-qe-gray-500 mb-8">Aqui você poderá encontrar oportunidades e gerenciar seus ganhos.</p>
          <Button variant="primary">Ver Vagas Disponíveis</Button>
        </div>
      </div>
    </div>
  )
}
