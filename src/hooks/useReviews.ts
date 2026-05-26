import * as React from 'react'
import { supabase } from '@/lib/supabase'

export interface PendingReview {
  id: string
  job_id: string
  avaliado_id: string
  expires_at: string
  avaliado_nome: string
  avaliado_avatar: string | null
  job_titulo: string
}

// ── Utilities ────────────────────────────────────────────────────────────────

function expiresAt7Days(): string {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  return d.toISOString()
}

// ── API ───────────────────────────────────────────────────────────────────────

export async function createPendingReview(
  jobId: string,
  avaliadorId: string,
  avaliadoId: string,
): Promise<string | null> {
  // Check if review already exists to avoid overwriting a submitted review
  const { data: existing } = await supabase
    .from('reviews')
    .select('id, status')
    .eq('job_id',       jobId)
    .eq('avaliador_id', avaliadorId)
    .eq('avaliado_id',  avaliadoId)
    .maybeSingle()

  if (existing) {
    // Only surface the modal when the review is still actionable
    return existing.status === 'pendente' ? (existing as { id: string }).id : null
  }

  const { data, error } = await supabase
    .from('reviews')
    .insert({
      job_id:       jobId,
      avaliador_id: avaliadorId,
      avaliado_id:  avaliadoId,
      status:       'pendente',
      expires_at:   expiresAt7Days(),
    })
    .select('id')
    .single()

  if (error) {
    console.error('[useReviews] createPendingReview:', error)
    return null
  }
  return (data as { id: string }).id
}

export async function submitReview(
  reviewId: string,
  nota: number,
  comentario: string,
): Promise<void> {
  const { error } = await supabase
    .from('reviews')
    .update({ nota, comentario: comentario.trim() || null, status: 'enviada' })
    .eq('id', reviewId)

  if (error) throw error
}

export async function fetchPendingReviews(avaliadorId: string): Promise<PendingReview[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      id,
      job_id,
      avaliado_id,
      expires_at,
      avaliado:profiles!reviews_avaliado_id_fkey(nome, avatar_url),
      job:jobs!reviews_job_id_fkey(titulo)
    `)
    .eq('avaliador_id', avaliadorId)
    .eq('status', 'pendente')
    .gt('expires_at', new Date().toISOString())
    .order('expires_at', { ascending: true })

  if (error) {
    console.error('[useReviews] fetchPendingReviews:', error)
    return []
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((r: any) => ({
    id:             r.id,
    job_id:         r.job_id,
    avaliado_id:    r.avaliado_id,
    expires_at:     r.expires_at,
    avaliado_nome:  r.avaliado?.nome   ?? 'Usuário',
    avaliado_avatar: r.avaliado?.avatar_url ?? null,
    job_titulo:     r.job?.titulo      ?? '',
  }))
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function usePendingReviews(avaliadorId: string | undefined) {
  const [reviews, setReviews]   = React.useState<PendingReview[]>([])
  const [loading, setLoading]   = React.useState(false)

  const refresh = React.useCallback(async () => {
    if (!avaliadorId) return
    setLoading(true)
    const data = await fetchPendingReviews(avaliadorId)
    setReviews(data)
    setLoading(false)
  }, [avaliadorId])

  React.useEffect(() => { refresh() }, [refresh])

  return { reviews, loading, refresh }
}
