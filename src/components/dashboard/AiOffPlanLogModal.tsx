import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Camera, Mic, Sparkles, Type, Undo2, Upload, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { capture as captureEvent } from '@/lib/analytics'
import { useIsUserPremium } from '@/hooks/useIsUserPremium'
import { offPlanMealsService } from '@/services/offPlanMeals'
import type { AiOffPlanLogResponse, MealType } from '@/types'

type Mode = 'text' | 'photo' | 'voice'

interface AiOffPlanLogModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  date: string
}

const MEAL_TYPES: MealType[] = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']
const TEXT_MAX = 1000
const AUDIO_MAX_BYTES = 25 * 1024 * 1024
const AUDIO_MAX_MS = 30_000
const IMAGE_MAX_BYTES = 5 * 1024 * 1024
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

type ErrorKey =
  | 'premium'
  | 'rateLimitText'
  | 'rateLimitPhoto'
  | 'tooLarge'
  | 'unsupportedType'
  | 'cameraPermission'
  | 'cameraUnavailable'
  | 'micPermission'
  | 'micUnavailable'
  | 'generic'

export function AiOffPlanLogModal({ open, onOpenChange, date }: AiOffPlanLogModalProps) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const isPremium = useIsUserPremium()

  const [mode, setMode] = useState<Mode>('text')
  const [text, setText] = useState('')
  const [mealType, setMealType] = useState<MealType | ''>('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [result, setResult] = useState<AiOffPlanLogResponse | null>(null)
  const [errorKey, setErrorKey] = useState<ErrorKey | null>(null)

  function resetState() {
    setMode('text')
    setText('')
    setMealType('')

    setImageFile(null)
    setResult(null)
    setErrorKey(null)
  }

  function handleClose() {
    onOpenChange(false)
    // Defer reset so the contents don't flicker during close animation.
    setTimeout(resetState, 200)
  }

  function mapError(err: unknown): ErrorKey {
    const status = (err as { response?: { status?: number } })?.response?.status
    if (status === 402) return isPremium ? 'generic' : 'premium'
    if (status === 413) return 'tooLarge'
    if (status === 415) return 'unsupportedType'
    if (status === 429) return mode === 'photo' ? 'rateLimitPhoto' : 'rateLimitText'
    return 'generic'
  }

  function handleSuccess(data: AiOffPlanLogResponse, source: Mode) {
    setResult(data)
    setErrorKey(null)
    captureEvent('ai_off_plan_meal_logged', { source })
    void qc.invalidateQueries({ queryKey: ['dashboard', date] })
    void qc.invalidateQueries({ queryKey: ['macros', date] })
  }

  const textMutation = useMutation({
    mutationFn: () =>
      offPlanMealsService.logFromText({
        text: text.trim(),
        mealType: mealType || undefined,
        eatenAt: date,
      }),
    onSuccess: data => handleSuccess(data, 'text'),
    onError: err => setErrorKey(mapError(err)),
  })

  const voiceMutation = useMutation({
    mutationFn: (file: File) =>
      offPlanMealsService.logFromVoice(file, {
        mealType: mealType || undefined,
        eatenAt: date,
      }),
    onSuccess: data => handleSuccess(data, 'voice'),
    onError: err => setErrorKey(mapError(err)),
  })

  const photoMutation = useMutation({
    mutationFn: () => {
      if (!imageFile) throw new Error('No image file')
      return offPlanMealsService.logFromPhoto(imageFile, {
        mealType: mealType || undefined,
        eatenAt: date,
      })
    },
    onSuccess: data => handleSuccess(data, 'photo'),
    onError: err => setErrorKey(mapError(err)),
  })

  const undoMutation = useMutation({
    mutationFn: async (id: string) => offPlanMealsService.delete(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['dashboard', date] })
      void qc.invalidateQueries({ queryKey: ['macros', date] })
      toast({ title: t('dashboard.aiOffPlan.undone') })
      handleClose()
    },
    onError: () => {
      toast({ title: t('dashboard.aiOffPlan.undoError'), variant: 'destructive' })
    },
  })

  const isPending =
    textMutation.isPending || voiceMutation.isPending || photoMutation.isPending

  function handleSubmit() {
    setErrorKey(null)
    if (mode === 'text') textMutation.mutate()
    else photoMutation.mutate()
  }

  const canSubmitText = text.trim().length > 0 && text.length <= TEXT_MAX
  const canSubmit =
    !isPending &&
    ((mode === 'text' && canSubmitText) ||
      (mode === 'photo' && imageFile != null))

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
            {t('dashboard.aiOffPlan.title')}
          </DialogTitle>
          <DialogDescription>{t('dashboard.aiOffPlan.subtitle')}</DialogDescription>
        </DialogHeader>

        {result ? (
          <ResultView
            result={result}
            onUndo={() => undoMutation.mutate(result.id)}
            onDone={handleClose}
            isUndoing={undoMutation.isPending}
          />
        ) : (
          <>
            <ModeTabs mode={mode} onChange={m => { setMode(m); setErrorKey(null) }} />

            {mode === 'text' && (
              <TextPanel
                value={text}
                onChange={setText}
                disabled={isPending}
              />
            )}

            {mode === 'voice' && (
              <VoicePanel
                onRecord={file => { setErrorKey(null); voiceMutation.mutate(file) }}
                onError={key => setErrorKey(key)}
                isPending={voiceMutation.isPending}
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

            {/* Optional meal type */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">
                {t('dashboard.aiOffPlan.mealTypeLabel')}
              </label>
              <Select
                value={mealType}
                onChange={e => setMealType(e.target.value as MealType | '')}
                disabled={isPending}
              >
                <option value="">{t('dashboard.aiOffPlan.mealTypeAuto')}</option>
                {MEAL_TYPES.map(mt => (
                  <option key={mt} value={mt}>
                    {t(`dashboard.meals.mealTypes.${mt}`, { defaultValue: mt })}
                  </option>
                ))}
              </Select>
            </div>

            {errorKey && <ErrorBlock errorKey={errorKey} />}

            {mode !== 'voice' && (
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={handleClose} disabled={isPending}>
                  {t('common.cancel')}
                </Button>
                <Button type="button" onClick={handleSubmit} disabled={!canSubmit}>
                  {isPending ? (
                    <>
                      <Spinner className="mr-2 h-3.5 w-3.5" />
                      {t('dashboard.aiOffPlan.parsing')}
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-3.5 w-3.5" />
                      {t('dashboard.aiOffPlan.parse')}
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ── Subcomponents ────────────────────────────────────────────────────────────

function ModeTabs({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  const { t } = useTranslation()
  const tabs: { id: Mode; icon: typeof Type; label: string }[] = [
    { id: 'text', icon: Type, label: t('dashboard.aiOffPlan.tabs.text') },
    { id: 'photo', icon: Camera, label: t('dashboard.aiOffPlan.tabs.photo') },
    { id: 'voice', icon: Mic, label: t('dashboard.aiOffPlan.tabs.voice') },
  ]
  return (
    <div className="grid grid-cols-3 gap-1.5 rounded-[12px] bg-[#F9F7F2] p-1">
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
              active
                ? 'bg-white text-[#1A1A1A] shadow-sm'
                : 'text-gray-500 hover:text-[#1A1A1A]',
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
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  disabled: boolean
}) {
  const { t } = useTranslation()
  const remaining = TEXT_MAX - value.length
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-gray-500">
        {t('dashboard.aiOffPlan.text.label')}
      </label>
      <Textarea
        autoFocus
        rows={4}
        value={value}
        onChange={e => onChange(e.target.value.slice(0, TEXT_MAX))}
        placeholder={t('dashboard.aiOffPlan.text.placeholder')}
        disabled={disabled}
      />
      <p className="text-xs text-gray-400 text-right">
        {t('dashboard.aiOffPlan.text.charsLeft', { count: remaining })}
      </p>
    </div>
  )
}

// ── PhotoPanel ───────────────────────────────────────────────────────────────

function PhotoPanel({
  file,
  onFile,
  onError,
  disabled,
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
    const filename = `camera-${Date.now()}.jpg`
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
              {t('dashboard.aiOffPlan.photo.cameraStarting')}
            </div>
          )}
        </div>
        <div className="flex justify-between gap-2">
          <Button type="button" variant="ghost" onClick={stopCamera}>
            {t('common.cancel')}
          </Button>
          <Button type="button" onClick={capture} disabled={!cameraReady}>
            <Camera className="mr-2 h-3.5 w-3.5" />
            {t('dashboard.aiOffPlan.photo.capture')}
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
            aria-label={t('dashboard.aiOffPlan.photo.remove')}
            className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant="secondary" onClick={() => inputRef.current?.click()} disabled={disabled}>
            <Upload className="mr-2 h-3.5 w-3.5" />
            {t('dashboard.aiOffPlan.photo.replaceUpload')}
          </Button>
          <Button type="button" variant="secondary" onClick={openCamera} disabled={disabled}>
            <Camera className="mr-2 h-3.5 w-3.5" />
            {t('dashboard.aiOffPlan.photo.retake')}
          </Button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={IMAGE_TYPES.join(',')}
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
        accept={IMAGE_TYPES.join(',')}
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
            {t('dashboard.aiOffPlan.photo.drop')}
          </span>
          <span className="text-xs text-gray-500">
            {t('dashboard.aiOffPlan.photo.hint')}
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
        {t('dashboard.aiOffPlan.photo.useCamera')}
      </Button>
    </div>
  )
}

// ── VoicePanel ───────────────────────────────────────────────────────────────

function pickAudioMimeType(): { mimeType: string; extension: string } {
  const candidates: { mimeType: string; extension: string }[] = [
    { mimeType: 'audio/webm;codecs=opus', extension: 'webm' },
    { mimeType: 'audio/webm', extension: 'webm' },
    { mimeType: 'audio/mp4', extension: 'm4a' },
    { mimeType: 'audio/ogg;codecs=opus', extension: 'ogg' },
  ]
  if (typeof MediaRecorder === 'undefined') return { mimeType: '', extension: 'webm' }
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c.mimeType)) return c
  }
  return { mimeType: '', extension: 'webm' }
}

function VoicePanel({
  onRecord,
  onError,
  isPending,
}: {
  onRecord: (file: File) => void
  onError: (key: ErrorKey) => void
  isPending: boolean
}) {
  const { t } = useTranslation()
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startedAtRef = useRef<number>(0)
  const tickRef = useRef<number | null>(null)
  const holdingRef = useRef(false)

  const [recording, setRecording] = useState(false)
  const [elapsedMs, setElapsedMs] = useState(0)

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    if (tickRef.current != null) {
      window.clearInterval(tickRef.current)
      tickRef.current = null
    }
  }, [])

  useEffect(() => () => {
    try { recorderRef.current?.stop() } catch { /* ignore */ }
    stopStream()
  }, [stopStream])

  async function handlePointerDown(e: React.PointerEvent) {
    if (isPending || recording) return
    holdingRef.current = true
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      onError('micUnavailable')
      return
    }
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    } catch (err) {
      const name = (err as { name?: string })?.name
      onError(name === 'NotAllowedError' || name === 'SecurityError' ? 'micPermission' : 'micUnavailable')
      return
    }
    if (!holdingRef.current) {
      stream.getTracks().forEach(t => t.stop())
      return
    }
    streamRef.current = stream
    const { mimeType, extension } = pickAudioMimeType()
    let recorder: MediaRecorder
    try {
      recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
    } catch {
      onError('micUnavailable')
      stopStream()
      return
    }
    chunksRef.current = []
    recorder.ondataavailable = e => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data)
    }
    recorder.onstop = () => {
      const actualType = recorder.mimeType || mimeType || 'audio/webm'
      const blob = new Blob(chunksRef.current, { type: actualType })
      chunksRef.current = []
      stopStream()
      setRecording(false)
      if (blob.size === 0) { onError('micUnavailable'); return }
      if (blob.size > AUDIO_MAX_BYTES) { onError('tooLarge'); return }
      const audio = new File([blob], `voice-${Date.now()}.${extension}`, { type: actualType })
      onRecord(audio)
    }
    recorderRef.current = recorder
    startedAtRef.current = Date.now()
    setElapsedMs(0)
    tickRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startedAtRef.current
      setElapsedMs(elapsed)
      if (elapsed >= AUDIO_MAX_MS) {
        const rec = recorderRef.current
        if (rec && rec.state !== 'inactive') rec.stop()
      }
    }, 100)
    recorder.start()
    setRecording(true)
  }

  function handlePointerUp() {
    holdingRef.current = false
    const rec = recorderRef.current
    if (rec && rec.state !== 'inactive') rec.stop()
  }

  if (isPending) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <Spinner className="h-8 w-8 text-[#F28C28]" />
        <span className="text-sm text-gray-500">{t('dashboard.aiOffPlan.parsing')}</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 py-4 select-none">
      {/* Waveform + timer — visible while recording */}
      <div className={cn('flex flex-col items-center gap-2 transition-opacity duration-200', recording ? 'opacity-100' : 'opacity-0 pointer-events-none')}>
        <div className="flex items-end gap-[3px] h-8" aria-hidden>
          {Array.from({ length: 20 }).map((_, i) => (
            <span
              key={i}
              className="w-[3px] rounded-full bg-[#F28C28]"
              style={{
                height: '60%',
                animation: recording
                  ? `voiceBar ${0.45 + (i % 7) * 0.07}s ease-in-out infinite alternate`
                  : 'none',
                transform: recording ? undefined : 'scaleY(0.3)',
                transformOrigin: 'bottom',
              }}
            />
          ))}
        </div>
        <span className="text-sm tabular-nums font-medium text-[#F28C28]">
          {formatDuration(elapsedMs)}
        </span>
      </div>

      {/* Hold button */}
      <button
        type="button"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerCancel={handlePointerUp}
        disabled={isPending}
        className={cn(
          'relative flex h-20 w-20 items-center justify-center rounded-full shadow-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F28C28]/40 disabled:opacity-50',
          recording
            ? 'bg-[#F28C28] scale-110 shadow-[0_0_0_12px_rgba(242,140,40,0.18)]'
            : 'bg-[#F28C28] hover:scale-105 active:scale-110',
        )}
        aria-label={recording ? t('dashboard.aiOffPlan.voice.stop') : t('dashboard.aiOffPlan.voice.holdToRecord')}
      >
        {recording && (
          <span className="absolute inset-0 rounded-full animate-ping bg-[#F28C28]/40" aria-hidden />
        )}
        <Mic className="h-8 w-8 text-white relative" aria-hidden />
      </button>

      <span className="text-xs text-gray-400">
        {recording ? t('dashboard.aiOffPlan.voice.releaseToSend') : t('dashboard.aiOffPlan.voice.holdToRecord')}
      </span>
    </div>
  )
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}


function ErrorBlock({ errorKey }: { errorKey: ErrorKey }) {
  const { t } = useTranslation()
  if (errorKey === 'premium') {
    return (
      <div className="rounded-[12px] border border-[#F28C28]/40 bg-[#F28C28]/10 p-3 text-sm text-[#1A1A1A]">
        <p className="font-medium">{t('dashboard.aiOffPlan.errors.premiumTitle')}</p>
        <p className="mt-1 text-gray-600">{t('dashboard.aiOffPlan.errors.premiumDescription')}</p>
        <Link
          to="/app/founding-member"
          className="mt-2 inline-block text-sm text-[#F28C28] underline underline-offset-2 hover:text-[#d97a20]"
        >
          {t('dashboard.aiOffPlan.errors.premiumCta')}
        </Link>
      </div>
    )
  }
  const messageKey: Record<Exclude<ErrorKey, 'premium'>, string> = {
    rateLimitText: 'dashboard.aiOffPlan.errors.rateLimitText',
    rateLimitPhoto: 'dashboard.aiOffPlan.errors.rateLimitPhoto',
    tooLarge: 'dashboard.aiOffPlan.errors.tooLarge',
    unsupportedType: 'dashboard.aiOffPlan.errors.unsupportedType',
    cameraPermission: 'dashboard.aiOffPlan.errors.cameraPermission',
    cameraUnavailable: 'dashboard.aiOffPlan.errors.cameraUnavailable',
    micPermission: 'dashboard.aiOffPlan.errors.micPermission',
    micUnavailable: 'dashboard.aiOffPlan.errors.micUnavailable',
    generic: 'dashboard.aiOffPlan.errors.generic',
  }
  return (
    <div className="rounded-[12px] border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      {t(messageKey[errorKey])}
    </div>
  )
}

function ResultView({
  result,
  onUndo,
  onDone,
  isUndoing,
}: {
  result: AiOffPlanLogResponse
  onUndo: () => void
  onDone: () => void
  isUndoing: boolean
}) {
  const { t } = useTranslation()
  const confidencePct =
    typeof result.confidence === 'number' ? Math.round(result.confidence * 100) : null

  return (
    <div className="space-y-4 pt-1">
      <div className="rounded-[12px] border border-[#e5e4e7] bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-[#1A1A1A] truncate">{result.displayName}</p>
            {result.mealType && (
              <p className="text-xs uppercase tracking-wide text-gray-500 mt-0.5">
                {t(`dashboard.meals.mealTypes.${result.mealType}`, { defaultValue: result.mealType })}
              </p>
            )}
          </div>
          {confidencePct !== null && (
            <span className="rounded-full bg-[#4F7942]/10 px-2 py-0.5 text-xs font-medium text-[#4F7942] shrink-0">
              {t('dashboard.aiOffPlan.confidence', { value: confidencePct })}
            </span>
          )}
        </div>

        <div className="mt-3 grid grid-cols-4 gap-2 text-center">
          <Macro label={t('dashboard.aiOffPlan.macros.kcal')} value={result.kcal} unit="kcal" />
          <Macro label={t('dashboard.aiOffPlan.macros.protein')} value={result.proteinG} unit="g" />
          <Macro label={t('dashboard.aiOffPlan.macros.fat')} value={result.fatG} unit="g" />
          <Macro label={t('dashboard.aiOffPlan.macros.carbs')} value={result.carbG} unit="g" />
        </div>
      </div>

      <p className="text-xs text-gray-500">{t('dashboard.aiOffPlan.persistedHint')}</p>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onUndo} disabled={isUndoing}>
          {isUndoing ? (
            <Spinner className="mr-2 h-3.5 w-3.5" />
          ) : (
            <Undo2 className="mr-2 h-3.5 w-3.5" />
          )}
          {t('dashboard.aiOffPlan.undo')}
        </Button>
        <Button type="button" onClick={onDone} disabled={isUndoing}>
          {t('dashboard.aiOffPlan.done')}
        </Button>
      </div>
    </div>
  )
}

function Macro({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="rounded-[10px] bg-[#F9F7F2] py-2">
      <p className="text-[10px] uppercase tracking-wide text-gray-500">{label}</p>
      <p className="text-sm font-medium text-[#1A1A1A] mt-0.5">
        {Math.round(value)}
        <span className="ml-0.5 text-xs text-gray-500">{unit}</span>
      </p>
    </div>
  )
}
