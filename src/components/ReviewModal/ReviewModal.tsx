import * as React from 'react'
import { Star } from 'lucide-react'
import { Avatar, Button, ResponsiveSheet } from '@/components/ui'
import { submitReview } from '@/hooks/useReviews'
import { useToast } from '@/components/ui'

// ── StarRating ────────────────────────────────────────────────────────────────

interface StarRatingProps {
  value: number
  onChange: (value: number) => void
}

function StarRating({ value, onChange }: StarRatingProps) {
  const [hovered, setHovered] = React.useState(0)
  const active = hovered || value

  return (
    <div className="flex items-center gap-2" role="group" aria-label="Selecione a nota">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          aria-label={`${star} estrela${star > 1 ? 's' : ''}`}
          className="p-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-qe-yellow cursor-pointer"
        >
          <Star
            size={32}
            strokeWidth={1.5}
            className="transition-colors"
            fill={star <= active ? 'var(--qe-yellow)' : 'transparent'}
            stroke={star <= active ? 'var(--qe-yellow)' : 'var(--qe-gray-400)'}
          />
        </button>
      ))}
    </div>
  )
}

const STAR_LABELS: Record<number, string> = {
  1: 'Muito ruim',
  2: 'Ruim',
  3: 'Regular',
  4: 'Bom',
  5: 'Excelente',
}

// ── ReviewModal ───────────────────────────────────────────────────────────────

export interface ReviewModalProps {
  open:           boolean
  onClose:        () => void
  reviewId:       string
  avaliadoNome:   string
  avaliadoAvatar: string | null
  jobTitulo:      string
  onDone:         () => void
}

export function ReviewModal({
  open,
  onClose,
  reviewId,
  avaliadoNome,
  avaliadoAvatar,
  jobTitulo,
  onDone,
}: ReviewModalProps) {
  const { showToast } = useToast()
  const [nota,       setNota]       = React.useState(0)
  const [comentario, setComentario] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (open) { setNota(0); setComentario('') }
  }, [open])

  const handleSubmit = async () => {
    if (nota === 0 || submitting) return
    setSubmitting(true)
    try {
      await submitReview(reviewId, nota, comentario)
      showToast('Avaliação enviada com sucesso!', 'success')
      onDone()
    } catch {
      showToast('Erro ao enviar avaliação. Tente novamente.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ResponsiveSheet open={open} onClose={onClose} title="Avalie o serviço">
      <div className="p-6 space-y-6">

        {/* Avaliado */}
        <div className="flex flex-col items-center gap-3 text-center">
          <Avatar
            src={avaliadoAvatar ?? undefined}
            name={avaliadoNome}
            size="lg"
          />
          <div>
            <p className="text-[17px] font-bold text-qe-gray-900">{avaliadoNome}</p>
            <p className="text-[13px] text-qe-gray-500 mt-0.5">{jobTitulo}</p>
          </div>
        </div>

        {/* Estrelas */}
        <div className="flex flex-col items-center gap-2">
          <StarRating value={nota} onChange={setNota} />
          <p className="text-[13px] font-bold text-qe-gray-500 h-5 transition-opacity">
            {nota > 0 ? STAR_LABELS[nota] : ' '}
          </p>
        </div>

        {/* Comentário */}
        <div className="space-y-1.5">
          <label
            htmlFor="review-comment"
            className="text-[12px] font-bold text-qe-gray-500 uppercase tracking-wider"
          >
            Comentário (opcional)
          </label>
          <textarea
            id="review-comment"
            rows={3}
            maxLength={300}
            placeholder="Conte como foi a experiência..."
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            className="w-full rounded-qe-sm border border-qe-gray-200 bg-qe-gray-50 px-3 py-2.5 text-[14px] text-qe-gray-900 placeholder:text-qe-gray-400 resize-none focus:outline-none focus:border-qe-yellow transition-colors"
          />
          <p className="text-[11px] text-qe-gray-400 text-right">
            {comentario.length}/300
          </p>
        </div>

        {/* Ações */}
        <div className="space-y-3 pt-2">
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            disabled={nota === 0 || submitting}
            loading={submitting}
            onClick={handleSubmit}
          >
            Enviar Avaliação
          </Button>
          <Button
            variant="ghost"
            size="md"
            className="w-full border border-qe-gray-200"
            disabled={submitting}
            onClick={onClose}
          >
            Avaliar depois
          </Button>
        </div>

      </div>
    </ResponsiveSheet>
  )
}
