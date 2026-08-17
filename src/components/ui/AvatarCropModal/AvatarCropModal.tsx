import * as React from 'react'
import { ZoomIn, ZoomOut, Check } from 'lucide-react'
import { Modal } from '../Modal'
import { Button } from '../Button'
import type { AvatarCropModalProps } from './AvatarCropModal.types'

const VIEWPORT_SIZE = 260 // px — área circular de recorte exibida na tela
const OUTPUT_SIZE = 512 // px — resolução final exportada (sempre quadrada)
const MAX_ZOOM = 3

export const AvatarCropModal: React.FC<AvatarCropModalProps> = ({
  open,
  file,
  onClose,
  onConfirm,
  loading,
}) => {
  const imgRef = React.useRef<HTMLImageElement>(null)
  const dragRef = React.useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null)

  const [imageUrl, setImageUrl] = React.useState<string | null>(null)
  const [naturalSize, setNaturalSize] = React.useState({ width: 0, height: 0 })
  const [zoom, setZoom] = React.useState(1)
  const [offset, setOffset] = React.useState({ x: 0, y: 0 })

  React.useEffect(() => {
    if (!file) {
      setImageUrl(null)
      return
    }
    const url = URL.createObjectURL(file)
    setImageUrl(url)
    setNaturalSize({ width: 0, height: 0 })
    setZoom(1)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const baseScale =
    naturalSize.width > 0
      ? Math.max(VIEWPORT_SIZE / naturalSize.width, VIEWPORT_SIZE / naturalSize.height)
      : 1

  const displayedWidth = naturalSize.width * baseScale * zoom
  const displayedHeight = naturalSize.height * baseScale * zoom

  const clampOffset = React.useCallback(
    (x: number, y: number, dw: number, dh: number) => {
      const minX = Math.min(0, VIEWPORT_SIZE - dw)
      const minY = Math.min(0, VIEWPORT_SIZE - dh)
      return {
        x: Math.max(minX, Math.min(0, x)),
        y: Math.max(minY, Math.min(0, y)),
      }
    },
    []
  )

  const handleImgLoad = () => {
    const img = imgRef.current
    if (!img) return
    const scale = Math.max(VIEWPORT_SIZE / img.naturalWidth, VIEWPORT_SIZE / img.naturalHeight)
    const w = img.naturalWidth * scale
    const h = img.naturalHeight * scale
    setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight })
    setOffset({ x: (VIEWPORT_SIZE - w) / 2, y: (VIEWPORT_SIZE - h) / 2 })
  }

  const handleZoomChange = (value: number) => {
    const dw = naturalSize.width * baseScale * value
    const dh = naturalSize.height * baseScale * value
    setZoom(value)
    setOffset((prev) => clampOffset(prev.x, prev.y, dw, dh))
  }

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = { startX: e.clientX, startY: e.clientY, originX: offset.x, originY: offset.y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    setOffset(clampOffset(dragRef.current.originX + dx, dragRef.current.originY + dy, displayedWidth, displayedHeight))
  }

  const onPointerUp = () => {
    dragRef.current = null
  }

  const handleConfirm = async () => {
    const img = imgRef.current
    if (!img || !naturalSize.width) return

    const canvas = document.createElement('canvas')
    canvas.width = OUTPUT_SIZE
    canvas.height = OUTPUT_SIZE
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const ratio = 1 / (baseScale * zoom) // pixels naturais por pixel de tela
    const sx = -offset.x * ratio
    const sy = -offset.y * ratio
    const sSize = VIEWPORT_SIZE * ratio

    ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE)

    canvas.toBlob(
      async (blob) => {
        if (!blob) return
        const croppedFile = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
        await onConfirm(croppedFile)
      },
      'image/jpeg',
      0.9
    )
  }

  return (
    <Modal open={open} onClose={onClose} title="Ajustar Foto">
      <div className="space-y-5">
        <div
          className="relative mx-auto rounded-full overflow-hidden bg-qe-gray-100 border border-qe-gray-200 cursor-grab active:cursor-grabbing touch-none select-none"
          style={{ width: VIEWPORT_SIZE, height: VIEWPORT_SIZE }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          {imageUrl && (
            <img
              ref={imgRef}
              src={imageUrl}
              onLoad={handleImgLoad}
              draggable={false}
              alt="Pré-visualização da foto"
              style={{
                position: 'absolute',
                left: offset.x,
                top: offset.y,
                width: displayedWidth || undefined,
                height: displayedHeight || undefined,
                maxWidth: 'none',
              }}
            />
          )}
        </div>

        <div className="flex items-center gap-3 px-1">
          <ZoomOut size={16} className="text-qe-gray-400 shrink-0" />
          <input
            type="range"
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            onChange={(e) => handleZoomChange(Number(e.target.value))}
            className="w-full accent-qe-yellow"
            aria-label="Zoom da imagem"
          />
          <ZoomIn size={16} className="text-qe-gray-400 shrink-0" />
        </div>

        <p className="text-[12px] text-qe-gray-400 text-center">
          Arraste a imagem para posicionar e use o controle para ajustar o zoom.
        </p>

        <div className="flex gap-3 pt-1">
          <Button variant="secondary" size="md" className="flex-1" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="md"
            className="flex-1"
            leadingIcon={<Check size={16} />}
            loading={loading}
            onClick={handleConfirm}
          >
            Salvar Foto
          </Button>
        </div>
      </div>
    </Modal>
  )
}
