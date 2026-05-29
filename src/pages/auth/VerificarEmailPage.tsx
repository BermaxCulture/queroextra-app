import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui'
import { InputOTP } from '@/components/ui/InputOTP'
import { AuthPageShell } from '@/components/auth/AuthPageShell'
import { createEmpresaRecords, type EmpresaEtapa1Data } from '@/services/empresa/empresaSignup'

const RESEND_COOLDOWN = 60

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain) return email
  const visible = local.length <= 2 ? local[0] : local.slice(0, 2)
  return `${visible}***@${domain}`
}

export default function VerificarEmailPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const email = searchParams.get('email') ?? ''
  const tipo = searchParams.get('tipo') ?? 'freelancer'

  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    if (!email) navigate('/login', { replace: true })
  }, [email, navigate])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setTimeout(() => setResendCooldown((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  const handleVerify = async (token: string) => {
    if (loading) return
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'signup',
      })

      if (error) throw error
      if (!data.user) throw new Error('Verificação falhou.')

      if (tipo === 'empresa') {
        const raw = sessionStorage.getItem('qe_pending_empresa')
        if (raw) {
          const pending = JSON.parse(raw) as EmpresaEtapa1Data
          await createEmpresaRecords(data.user.id, pending)
          sessionStorage.removeItem('qe_pending_empresa')
        }
        navigate('/cadastro/empresa/documentos', { replace: true })
      } else {
        showToast('E-mail confirmado! Bem-vindo(a) à QueroExtra.', 'success')
        navigate('/extras', { replace: true })
      }
    } catch (error: any) {
      const msg =
        error?.message?.includes('expired') || error?.message?.includes('invalid')
          ? 'Código inválido ou expirado. Tente reenviar um novo código.'
          : 'Erro ao verificar código. Tente novamente.'
      showToast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0) return
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email })
      if (error) throw error
      showToast('Novo código enviado! Verifique seu e-mail.', 'success')
      setResendCooldown(RESEND_COOLDOWN)
    } catch {
      showToast('Erro ao reenviar código. Tente novamente.', 'error')
    }
  }

  return (
    <AuthPageShell title="Verifique seu e-mail" subtitle="Confirme seu cadastro">
      <div className="flex flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-qe-yellow/10 flex items-center justify-center">
            <Mail size={24} className="text-qe-yellow" />
          </div>
          <p className="text-[14px] text-qe-gray-600 leading-relaxed">
            Enviamos um código de 8 dígitos para
            <br />
            <strong className="text-qe-black">{maskEmail(email)}</strong>
          </p>
        </div>

        {/* quantidade de digitos  */}
        <InputOTP
          length={8}
          autoFocus
          disabled={loading}
          onComplete={handleVerify}
        />

        {loading && (
          <p className="text-[13px] text-qe-gray-500 animate-pulse">Verificando...</p>
        )}

        <div className="text-center space-y-1">
          <p className="text-[13px] text-qe-gray-500">Não recebeu o código?</p>
          {resendCooldown > 0 ? (
            <p className="text-[13px] text-qe-gray-400">Reenviar em {resendCooldown}s</p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              className="text-[13px] font-semibold text-qe-black hover:text-qe-yellow transition-colors"
            >
              Reenviar código
            </button>
          )}
        </div>

        <p className="text-[12px] text-qe-gray-400 text-center leading-relaxed">
          Verifique também sua pasta de spam.
          <br />O código expira em 60 minutos.
        </p>
      </div>
    </AuthPageShell>
  )
}
