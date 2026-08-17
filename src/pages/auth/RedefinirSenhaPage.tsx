import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { z } from 'zod'
import { Mail, KeyRound, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button, Input, useToast } from '@/components/ui'

type Step = 'email' | 'code' | 'password'

export default function RedefinirSenhaPage() {
  const [searchParams] = useSearchParams()
  const emailFromQuery = searchParams.get('email') ?? ''
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [step, setStep] = useState<Step>(emailFromQuery ? 'code' : 'email')
  const [email, setEmail] = useState(emailFromQuery)
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  const sendCode = async (targetEmail: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(targetEmail)
    if (error) throw error
  }

  const handleSendCode = async (e: FormEvent) => {
    e.preventDefault()
    if (!z.string().email().safeParse(email).success) {
      showToast('Digite um e-mail válido.', 'info')
      return
    }
    setLoading(true)
    try {
      await sendCode(email)
      showToast('Enviamos um código de 6 dígitos para o seu e-mail.', 'success')
      setStep('code')
    } catch (error: any) {
      showToast(error?.message || 'Não foi possível enviar o código.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    setResending(true)
    try {
      await sendCode(email)
      showToast('Reenviamos o código para o seu e-mail.', 'success')
    } catch (error: any) {
      showToast(error?.message || 'Não foi possível reenviar o código.', 'error')
    } finally {
      setResending(false)
    }
  }

  const handleVerifyCode = async (e: FormEvent) => {
    e.preventDefault()
    if (code.length !== 6) {
      showToast('Digite os 6 dígitos do código.', 'info')
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'recovery' })
      if (error) throw error
      setStep('password')
    } catch (error: any) {
      const message = error?.message === 'Token has expired or is invalid'
        ? 'Código inválido ou expirado. Solicite um novo.'
        : (error?.message || 'Não foi possível verificar o código.')
      showToast(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSetPassword = async (e: FormEvent) => {
    e.preventDefault()
    if (password.length < 6) {
      showToast('A senha deve ter pelo menos 6 caracteres.', 'info')
      return
    }
    if (password !== confirmPassword) {
      showToast('As senhas não coincidem.', 'info')
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      // Força um novo login com a senha nova, em vez de aproveitar a sessão
      // de recovery — mais claro pro usuário e evita ter que replicar aqui a
      // lógica de redirecionamento por tipo (freelancer/empresa/admin) do LoginPage.
      await supabase.auth.signOut()
      showToast('Senha alterada com sucesso! Faça login com a nova senha.', 'success')
      navigate('/login')
    } catch (error: any) {
      showToast(error?.message || 'Não foi possível alterar a senha.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const subtitle =
    step === 'email' ? 'Recupere o acesso à sua conta' :
    step === 'code' ? 'Digite o código enviado por e-mail' :
    'Crie uma nova senha'

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-[400px]">
        <div className="mb-12 text-center">
          <h1 className="text-[40px] font-bold tracking-tight text-qe-black">
            Quero<span className="text-qe-yellow">Extra</span>
          </h1>
          <p className="text-qe-gray-500 mt-2 font-medium">{subtitle}</p>
        </div>

        <div className="w-full bg-white rounded-[24px] shadow-qe-lg border border-qe-gray-100 overflow-hidden">
          <div className="h-1.5 bg-qe-navy" />

          {step === 'email' && (
            <form onSubmit={handleSendCode} className="space-y-6 p-8">
              <Input
                label="E-mail"
                placeholder="seu@email.com"
                icon={<Mail size={20} />}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
              <Button type="submit" size="lg" loading={loading} trailingIcon={<ArrowRight size={20} />}>
                Enviar código
              </Button>
              <p className="text-center text-caption text-qe-gray-500">
                <Link to="/login" className="font-semibold text-qe-black hover:text-qe-yellow transition-colors">
                  Voltar para o login
                </Link>
              </p>
            </form>
          )}

          {step === 'code' && (
            <form onSubmit={handleVerifyCode} className="space-y-6 p-8">
              <p className="text-[13px] text-qe-gray-500">
                Enviamos um código de 6 dígitos para <strong className="text-qe-gray-900">{email}</strong>.
              </p>
              <Input
                label="Código de verificação"
                placeholder="000000"
                icon={<KeyRound size={20} />}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                className="tracking-[0.5em] text-center font-bold text-[20px]"
                autoFocus
              />
              <Button type="submit" size="lg" loading={loading} trailingIcon={<ArrowRight size={20} />}>
                Confirmar código
              </Button>
              <div className="flex items-center justify-between text-caption">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resending}
                  className="font-semibold text-qe-yellow hover:text-qe-yellow-hover transition-colors disabled:opacity-50"
                >
                  {resending ? 'Reenviando...' : 'Reenviar código'}
                </button>
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="text-qe-gray-500 hover:text-qe-gray-700 transition-colors"
                >
                  Trocar e-mail
                </button>
              </div>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={handleSetPassword} className="space-y-6 p-8">
              <div className="relative">
                <Input
                  label="Nova senha"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  icon={<Lock size={20} />}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-[42px] text-qe-gray-400 hover:text-qe-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <Input
                label="Confirmar nova senha"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                icon={<Lock size={20} />}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <Button type="submit" size="lg" loading={loading} trailingIcon={<ArrowRight size={20} />}>
                Salvar nova senha
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
