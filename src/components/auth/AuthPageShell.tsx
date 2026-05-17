import { Link } from 'react-router-dom'

interface AuthPageShellProps {
  title: string
  subtitle: string
  step?: { current: number; total: number }
  children: React.ReactNode
  footer?: React.ReactNode
}

export function AuthPageShell({ title, subtitle, step, children, footer }: AuthPageShellProps) {
  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-[440px] flex flex-col items-center">
        <div className="mb-8 text-center w-full">
          <h1 className="text-[40px] font-bold tracking-tight text-qe-black">
            Quero<span className="text-qe-yellow">Extra</span>
          </h1>
          <p className="text-qe-gray-500 mt-2 font-medium">{subtitle}</p>
          {step && (
            <p className="text-[12px] font-semibold text-qe-gray-400 mt-3 uppercase tracking-wider">
              Etapa {step.current} de {step.total}
            </p>
          )}
        </div>

        <div className="w-full bg-white rounded-[24px] p-8 shadow-qe-lg border border-qe-gray-100">
          <h2 className="text-[20px] font-bold text-qe-black mb-6">{title}</h2>
          {children}
        </div>

        {footer ?? (
          <div className="mt-6 text-center">
            <p className="text-caption text-qe-gray-500">
              Já tem uma conta?{' '}
              <Link
                to="/login"
                className="font-semibold text-qe-black hover:text-qe-yellow transition-colors"
              >
                Entrar
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
