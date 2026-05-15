import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-qe-bg-page flex flex-col items-center justify-center p-4">
      <h1 className="text-display text-qe-black mb-4 text-center">
        Quero<span className="text-qe-yellow">Extra</span>
      </h1>
      <p className="text-body text-qe-gray-700 mb-8 text-center max-w-md">
        A plataforma que conecta os melhores freelancers aos melhores eventos e restaurantes.
      </p>
      <div className="flex gap-4">
        <Link to="/login">
          <Button variant="primary">Entrar</Button>
        </Link>
        <Link to="/cadastro">
          <Button variant="secondary">Criar conta</Button>
        </Link>
      </div>
    </div>
  )
}
