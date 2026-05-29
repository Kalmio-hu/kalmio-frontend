import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Camera, ScrollText, Sparkles, Type, Upload, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { capture as captureEvent } from '@/lib/analytics'
import { useIsUserPremium } from '@/hooks/useIsUserPremium'
import { aiRecipeImportService } from '@/services/aiRecipeImport'
import type { RecipeImportPreview, RecipeImportSource } from '@/types'

type Mode = 'text' | 'photo'

interface AiRecipeImportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called with the parsed preview and which path produced it. The parent is responsible
   *  for opening the preview-edit dialog. */
  onPreview: (preview: RecipeImportPreview, source: RecipeImportSource, sourceUrl?: string | null) => void
}

const TEXT_MAX = 5000
const IMAGE_MAX_BYTES = 8 * 1024 * 1024
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
const IMAGE_PICKER_ACCEPT = IMAGE_TYPES.join(',')

type ErrorKey =
  | 'premium'
  | 'rateLimitText'
  | 'rateLimitPhoto'
  | 'monthlyQuota'
  | 'tooLarge'
  | 'unsupportedType'
  | 'cameraPermission'
  | 'cameraUnavailable'
  | 'aiUnavailable'
  | 'parseFailed'
  | 'generic'

export function AiRecipeImportModal({ open, onOpenChange, onPreview }: AiRecipeImportModalProps) {
  const { t } = useTranslation()
  const isPremium = useIsUserPremium()

  const [mode, setMode] = useState<Mode>('text')
  const [text, setText] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [errorKey, setErrorKey] = useState<ErrorKey | null>(null)

  function resetState() {
    setMode('text')
    setText('')
    setSourceUrl('')
    setImageFile(null)
    setErrorKey(null)
  }

  function handleClose() {
    onOpenChange(false)
    setTimeout(resetState, 200)
  }

  function mapError(err: unknown, currentMode: Mode): ErrorKey {
    const status = (err as { response?: { status?: number; data?: { type?: string } } })?.response?.status
    const type = (err as { response?: { data?: { type?: string } } })?.response?.data?.type
    if (status === 402) return isPremium ? 'generic' : 'premium'
    if (status === 413) return 'tooLarge'
    if (status === 415) return 'unsupportedType'
    if (status === 429) {
      if (type === 'urn:kalmio:error:monthly-quota-exceeded') return 'monthlyQuota'
      return currentMode === 'photo' ? 'rateLimitPhoto' : 'rateLimitText'
    }
    if (status === 502) return 'parseFailed'
    if (status === 503) return 'aiUnavailable'
    return 'generic'
  }

  const textMutation = useMutation({
    mutationFn: () =>
      aiRecipeImportService.importFromText(text.trim(), sourceUrl.trim() || null),
    onSuccess: preview => {
      captureEvent('ai_recipe_import_previewed', { source: 'PASTE_TEXT' })
      onPreview(preview, 'PASTE_TEXT', sourceUrl.trim() || null)
      handleClose()
    },
    onError: err => setErrorKey(mapError(err, 'text')),
  })

  const photoMutation = useMutation({
    mutationFn: () => {
      if (!imageFile) throw new Error('No image file')
      return aiRecipeImportService.digitizeHandwriting(imageFile)
    },
    onSuccess: preview => {
      captureEvent('ai_recipe_import_previewed', { source: 'HANDWRITING' })
      onPreview(preview, 'HANDWRITING', null)
      handleClose()
    },
    onError: err => setErrorKey(mapError(err, 'photo')),
  })

  const isPending = textMutation.isPending || photoMutation.isPending

  function handleSubmit() {
    setErrorKey(null)
    if (mode === 'text') textMutation.mutate()
    else photoMutation.mutate()
  }

  const canSubmitText = text.trim().length > 0 && text.length <= TEXT_MAX
  const canSubmit =
    !isPending &&
    ((mode === 'text' && canSubmitText) || (mode === 'photo' && imageFile != null))

  return (
    <Dialog
      open={open}
      onOpenChange={next => {
        if (!next) handleClose()
        else onOpenChange(next)
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#F28C28]" aria-hidden />
            {t('aiImport.title')}
          </DialogTitle>
          <DialogDescription>{t('aiImport.subtitle')}</DialogDescription>
        </DialogHeader>

        <ModeTabs mode={mode} onChange={m => { setMode(m); setErrorKey(null) }} />

        {mode === 'text' && (
          <TextPanel
            value={text}
            onChange={setText}
            sourceUrl={sourceUrl}
            onSourceUrlChange={setSourceUrl}
            disabled={isPending}
          />
        )}

        {mode === 'photo' && (
          <PhotoPanel
            file={imageFile}
            onFile={file => { setImageFile(file); setErrorKey(null) }}
            onError={key => setErrorKey(key)}
            disabled={isPending}
          />
        )}

        {errorKey && <ErrorBlock errorKey={errorKey} />}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={handleClose} disabled={isPending}>
            {t('common.cancel')}
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={!canSubmit}>
            {isPending ? (
              <>
                <Spinner className="mr-2 h-3.5 w-3.5" />
                {t('aiImport.parsing')}
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-3.5 w-3.5" />
                {t('aiImport.parse')}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Subcomponents ────────────────────────────────────────────────────────────

function ModeTabs({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  const { t } = useTranslation()
  const tabs: { id: Mode; icon: typeof Type; label: string }[] = [
    { id: 'text', icon: Type, label: t('aiImport.tabs.text') },
    { id: 'photo', icon: ScrollText, label: t('aiImport.tabs.photo') },
  ]
  return (
    <div className="grid grid-cols-2 gap-1.5 rounded-[12px] bg-[#F9F7F2] p-1">
      {tabs.map(tab => {
        const Icon = tab.icon
        const active = tab.id === mode
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            aria-pressed={active}
            className={cn(
              'flex flex-col items-center justify-center gap-1 rounded-[10px] py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]',
              active ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-gray-500 hover:text-[#1A1A1A]',
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

function TextPanel({
  value, onChange, sourceUrl, onSourceUrlChange, disabled,
}: {
  value: string
  onChange: (v: string) => void
  sourceUrl: string
  onSourceUrlChange: (v: string) => void
  disabled: boolean
}) {
  const { t } = useTranslation()
  const remaining = TEXT_MAX - value.length
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-gray-500">
          {t('aiImport.text.label')}
        </label>
        <Textarea
          autoFocus
          rows={8}
          value={value}
          onChange={e => onChange(e.target.value.slice(0, TEXT_MAX))}
          placeholder={t('aiImport.text.placeholder')}
          disabled={disabled}
        />
        <p className="text-xs text-gray-400 text-right">
          {t('aiImport.text.charsLeft', { count: remaining })}
        </p>
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-gray-500">
          {t('aiImport.text.sourceUrlLabel')}
        </label>
        <Input
          type="url"
          value={sourceUrl}
          onChange={e => onSourceUrlChange(e.target.value.slice(0, 2048))}
          placeholder={t('aiImport.text.sourceUrlPlaceholder')}
          disabled={disabled}
        />
      </div>
    </div>
  )
}

// ── PhotoPanel ───────────────────────────────────────────────────────────────

function PhotoPanel({
  file, onFile, onError, disabled,
}: {
  file: File | null
  onFile: (file: File | null) => void
  onError: (key: ErrorKey) => void
  disabled: boolean
}) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [cameraOpen, setCameraOpen] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const previewUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file],
  )
  useEffect(() => {
    if (!previewUrl) return
    return () => URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setCameraReady(false)
    setCameraOpen(false)
  }, [])

  useEffect(() => () => stopCamera(), [stopCamera])

  function validateAndSet(picked: File | null) {
    if (!picked) {
      onFile(null)
      return
    }
    if (picked.size > IMAGE_MAX_BYTES) {
      onError('tooLarge')
      onFile(null)
      return
    }
    if (picked.type && !IMAGE_TYPES.includes(picked.type.toLowerCase())) {
      onError('unsupportedType')
      onFile(null)
      return
    }
    onFile(picked)
  }

  function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
    validateAndSet(e.target.files?.[0] ?? null)
    e.target.value = ''
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
    if (disabled) return
    validateAndSet(e.dataTransfer.files?.[0] ?? null)
  }

  async function openCamera() {
    if (disabled) return
    if (!navigator.mediaDevices?.getUserMedia) {
      onError('cameraUnavailable')
      return
    }
    setCameraOpen(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      })
      streamRef.current = stream
      const video = videoRef.current
      if (video) {
        video.srcObject = stream
        video.onloadedmetadata = () => {
          video.play().catch(() => undefined)
          setCameraReady(true)
        }
      }
    } catch (err) {
      const name = (err as { name?: string })?.name
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        onError('cameraPermission')
      } else {
        onError('cameraUnavailable')
      }
      setCameraOpen(false)
    }
  }

  async function capture() {
    const video = videoRef.current
    if (!video || !cameraReady) return
    const width = video.videoWidth
    const height = video.videoHeight
    if (!width || !height) return
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0, width, height)
    const blob: Blob | null = await new Promise(resolve =>
      canvas.toBlob(resolve, 'image/jpeg', 0.92),
    )
    if (!blob) {
      onError('generic')
      return
    }
    const filename = `handwriting-${Date.now()}.jpg`
    const photo = new File([blob], filename, { type: 'image/jpeg' })
    validateAndSet(photo)
    stopCamera()
  }

  if (cameraOpen) {
    return (
      <div className="space-y-2">
        <div className="relative overflow-hidden rounded-[12px] bg-black aspect-[4/3]">
          <video
            ref={videoRef}
            playsInline
            muted
            className="h-full w-full object-cover"
          />
          {!cameraReady && (
            <div className="absolute inset-0 flex items-center justify-center text-white text-sm">
              <Spinner className="mr-2 h-4 w-4" />
              {t('aiImport.photo.cameraStarting')}
            </div>
          )}
        </div>
        <div className="flex justify-between gap-2">
          <Button type="button" variant="ghost" onClick={stopCamera}>
            {t('common.cancel')}
          </Button>
          <Button type="button" onClick={capture} disabled={!cameraReady}>
            <Camera className="mr-2 h-3.5 w-3.5" />
            {t('aiImport.photo.capture')}
          </Button>
        </div>
      </div>
    )
  }

  if (file && previewUrl) {
    return (
      <div className="space-y-2">
        <div className="relative overflow-hidden rounded-[12px] border border-[#e5e4e7] bg-[#F9F7F2] aspect-[4/3]">
          <img src={previewUrl} alt="" className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={() => onFile(null)}
            disabled={disabled}
            aria-label={t('aiImport.photo.remove')}
            className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant="secondary" onClick={() => inputRef.current?.click()} disabled={disabled}>
            <Upload className="mr-2 h-3.5 w-3.5" />
            {t('aiImport.photo.replaceUpload')}
          </Button>
          <Button type="button" variant="secondary" onClick={openCamera} disabled={disabled}>
            <Camera className="mr-2 h-3.5 w-3.5" />
            {t('aiImport.photo.retake')}
          </Button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={IMAGE_PICKER_ACCEPT}
          onChange={handlePick}
          disabled={disabled}
          className="sr-only"
        />
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_PICKER_ACCEPT}
        onChange={handlePick}
        disabled={disabled}
        className="sr-only"
      />
      <div
        role="button"
        tabIndex={0}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={e => {
          if (disabled) return
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        onDragOver={e => { e.preventDefault(); if (!disabled) setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        aria-disabled={disabled}
        className={cn(
          'w-full rounded-[12px] border-2 border-dashed px-4 py-6 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] cursor-pointer',
          isDragging
            ? 'border-[#F28C28] bg-[#F28C28]/10'
            : 'border-[#e5e4e7] bg-[#F9F7F2] hover:border-[#F28C28]',
          disabled && 'opacity-60 cursor-not-allowed',
        )}
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <Upload className="h-6 w-6 text-[#F28C28]" aria-hidden />
          <span className="text-sm font-medium text-[#1A1A1A]">
            {t('aiImport.photo.drop')}
          </span>
          <span className="text-xs text-gray-500">
            {t('aiImport.photo.hint')}
          </span>
        </div>
      </div>
      <Button
        type="button"
        variant="secondary"
        onClick={openCamera}
        disabled={disabled}
        className="w-full"
      >
        <Camera className="mr-2 h-3.5 w-3.5" />
        {t('aiImport.photo.useCamera')}
      </Button>
    </div>
  )
}

function ErrorBlock({ errorKey }: { errorKey: ErrorKey }) {
  const { t } = useTranslation()
  if (errorKey === 'premium') {
    return (
      <div className="rounded-[12px] border border-[#F28C28]/40 bg-[#F28C28]/10 p-3 text-sm text-[#1A1A1A]">
        <p className="font-medium">{t('aiImport.errors.premiumTitle')}</p>
        <p className="mt-1 text-gray-600">{t('aiImport.errors.premiumDescription')}</p>
        <Link
          to="/app/founding-member"
          className="mt-2 inline-block text-sm text-[#F28C28] underline underline-offset-2 hover:text-[#d97a20]"
        >
          {t('aiImport.errors.premiumCta')}
        </Link>
      </div>
    )
  }
  const messageKey: Record<Exclude<ErrorKey, 'premium'>, string> = {
    rateLimitText: 'aiImport.errors.rateLimitText',
    rateLimitPhoto: 'aiImport.errors.rateLimitPhoto',
    monthlyQuota: 'aiImport.errors.monthlyQuota',
    tooLarge: 'aiImport.errors.tooLarge',
    unsupportedType: 'aiImport.errors.unsupportedType',
    cameraPermission: 'aiImport.errors.cameraPermission',
    cameraUnavailable: 'aiImport.errors.cameraUnavailable',
    aiUnavailable: 'aiImport.errors.aiUnavailable',
    parseFailed: 'aiImport.errors.parseFailed',
    generic: 'aiImport.errors.generic',
  }
  return (
    <div className="rounded-[12px] border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      {t(messageKey[errorKey])}
    </div>
  )
}
