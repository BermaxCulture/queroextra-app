import { supabase } from '@/lib/supabase'

/**
 * Verifica se o e-mail já está cadastrado na plataforma (qualquer tipo de usuário).
 * Usa uma função RPC com SECURITY DEFINER que consulta auth.users diretamente,
 * garantindo funcionamento mesmo para usuários não autenticados.
 *
 * @returns true se o e-mail está disponível, false se já existe.
 */
export async function checkEmailAvailable(email: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('check_email_available', {
    p_email: email.trim(),
  })

  if (error) {
    // Em caso de erro na consulta, deixa o signUp tentar normalmente
    console.warn('Erro ao verificar disponibilidade do e-mail:', error)
    return true
  }

  return data === true
}
