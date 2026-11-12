/**
 * Seven day columns with session chips (PRD §7.2). Mobile: vertical list;
 * desktop: grid. Chips drag to another day with dnd-kit → `POST …/move`;
 * a 409 shows the one-line reason and the chip snaps back. Every chip has a
 * keyboard-reachable "Műveletek" menu with the same moves, "Másikat kérek"
 * and "Ma nem megy". Tapping a chip opens its overview (SessionOverview); the
 * "+" on a day adds a session by hand (AddSessionDialog). In the narrow
 * desktop columns the chip stacks (container query).
 */
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { restrictToWindowEdges } from '@dnd-kit/modifiers'
import { Check, Flame, Leaf, Lock, MoreHorizontal, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/components/ui/toast'
import { moveService } from '../services/moveService'
import { moveKeys } from '../lib/queryKeys'
import { useMoveT } from '../lib/register'
import { MOVE_ACCENT, MOVE_SESSION } from '../lib/constants'
import { ModalityPicture, pictureKeyFor } from '../lib/modalityPictures'
import { dayMonthLabel, weekdayLabel } from '../lib/dates'
import {
  dayDropId,
  intensityKey,
  isDraggable,
  isHard,
  parseDayDropId,
  parseSessionDragId,
  refusalReason,
  sameRoleAlternatives,
  sessionDragId,
  type WeekDayView,
  type WeekView,
} from '../lib/weekView'
import { FitDownloadButton } from './FitDownloadButton'
import { SessionOverview } from './SessionOverview'
import { AddSessionDialog } from './AddSessionDialog'
import type { ModalityDto, NotTodayChoice, SessionDto } from '../types'

interface WeekGridProps {
  view: WeekView
  modalities: ModalityDto[]
  /** Query key of the week being shown, invalidated after every mutation. */
  weekStart?: string
}

export function WeekGrid({ view, modalities, weekStart }: WeekGridProps) {
  const { t, i18n } = useMoveT()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [menuFor, setMenuFor] = useState<SessionDto | null>(null)
  const [swapFor, setSwapFor] = useState<SessionDto | null>(null)
  const [notTodayFor, setNotTodayFor] = useState<SessionDto | null>(null)
  const [overviewFor, setOverviewFor] = useState<SessionDto | null>(null)
  const [addFor, setAddFor] = useState<string | null>(null)
  // A drag that ends where it started still fires a click on the chip; that click must not open the overview.
  const lastDragEnd = useRef(0)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  )

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: moveKeys.week(weekStart) })
    void qc.invalidateQueries({ queryKey: moveKeys.today })
    void qc.invalidateQueries({ queryKey: moveKeys.sheet(weekStart) })
    void qc.invalidateQueries({ queryKey: ['dashboard'] })
  }

  const move = useMutation({
    mutationFn: ({ id, date }: { id: string; date: string }) => moveService.moveSession(id, { date }),
    onSuccess: () => {
      toast({ title: t('week.moved'), variant: 'success' })
      invalidate()
    },
    onError: (err) => {
      const reason = refusalReason(err)
      // 409 → the one-line reason; the chip never moved locally, so it is already "snapped back".
      toast({
        title: reason === null ? t('common.error') : reason ? t('week.refused', { reason }) : t('week.refusedGeneric'),
        variant: 'destructive',
      })
    },
  })

  const swap = useMutation({
    mutationFn: ({ id, modalityCode }: { id: string; modalityCode?: string }) =>
      moveService.swapSession(id, modalityCode ? { modalityCode } : { variant: 'OTHER' }),
    onSuccess: () => {
      toast({ title: t('week.swapped'), variant: 'success' })
      setSwapFor(null)
      invalidate()
    },
    onError: () => toast({ title: t('common.error'), variant: 'destructive' }),
  })

  const notToday = useMutation({
    mutationFn: ({ id, choice }: { id: string; choice: NotTodayChoice }) => moveService.notToday(id, { choice }),
    onSuccess: (res, vars) => {
      setNotTodayFor(null)
      invalidate()
      if (vars.choice === 'SHORTER') {
        navigate(`${MOVE_SESSION(res.session?.id ?? vars.id)}?planB=1`)
        return
      }
      toast({ title: vars.choice === 'UNWELL' ? t('today.unwellSet') : t('today.moved'), variant: 'success' })
    },
    onError: () => toast({ title: t('common.error'), variant: 'destructive' }),
  })

  const allSessions = view.days.flatMap((d) => d.sessions)
  const active = activeId ? allSessions.find((s) => s.id === activeId) ?? null : null

  const onDragStart = (e: DragStartEvent) => setActiveId(parseSessionDragId(String(e.active.id)))
  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null)
    lastDragEnd.current = Date.now()
    const id = parseSessionDragId(String(e.active.id))
    const date = e.over ? parseDayDropId(String(e.over.id)) : null
    if (!id || !date) return
    const s = allSessions.find((x) => x.id === id)
    if (!s || s.date === date) return
    move.mutate({ id, date })
  }

  const requestMove = (s: SessionDto, date: string) => {
    setMenuFor(null)
    if (s.date !== date) move.mutate({ id: s.id, date })
  }

  const openOverview = (s: SessionDto) => {
    if (Date.now() - lastDragEnd.current < 300) return
    setOverviewFor(s)
  }

  return (
    <>
      <DndContext sensors={sensors} modifiers={[restrictToWindowEdges]} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <ol className="grid grid-cols-1 md:grid-cols-7 gap-3" aria-label={t('week.title')}>
          {view.days.map((day) => (
            <DayColumn
              key={day.date}
              day={day}
              locale={i18n.language}
              dragging={activeId !== null}
              onMenu={setMenuFor}
              onOpen={openOverview}
              onAdd={setAddFor}
            />
          ))}
        </ol>
        <DragOverlay modifiers={[restrictToWindowEdges]}>{active ? <Chip session={active} overlay /> : null}</DragOverlay>
      </DndContext>
      <p className="mt-3 text-sm text-gray-500">{t('week.dragHint')}</p>

      {/* Overview — what to expect, the exercises, edit them, correct the log */}
      <Dialog open={!!overviewFor} onOpenChange={(o) => !o && setOverviewFor(null)}>
        <DialogContent className="move-block max-w-xl">
          {overviewFor && (
            <SessionOverview
              session={overviewFor}
              onStart={() => navigate(MOVE_SESSION(overviewFor.id))}
              onActions={() => {
                setMenuFor(overviewFor)
                setOverviewFor(null)
              }}
              onClose={() => setOverviewFor(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <AddSessionDialog date={addFor} modalities={modalities} onClose={() => setAddFor(null)} />

      {/* Actions menu — keyboard path for move / swap / not today */}
      <Dialog open={!!menuFor} onOpenChange={(o) => !o && setMenuFor(null)}>
        <DialogContent className="move-block">
          {menuFor && (
            <>
              <DialogHeader>
                <DialogTitle>{t('week.actions')}</DialogTitle>
                <DialogDescription>
                  {t('week.chipLabel', { modality: menuFor.modalityName, minutes: menuFor.durationMin, intensity: t(`week.intensity.${intensityKey(menuFor.intensity)}`) })}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {menuFor.status === 'PLANNED' && (
                  <Button size="lg" className="w-full bg-[#2A9D8F] hover:bg-[#21867A] focus-visible:ring-[#2A9D8F]" onClick={() => navigate(MOVE_SESSION(menuFor.id))}>
                    {t('week.start')}
                  </Button>
                )}
                {!menuFor.fixedClass && menuFor.status === 'PLANNED' && (
                  <Button size="lg" variant="secondary" className="w-full" onClick={() => { setSwapFor(menuFor); setMenuFor(null) }}>
                    {t('week.swapTitle')}
                  </Button>
                )}
                {menuFor.status === 'PLANNED' && (
                  <Button size="lg" variant="secondary" className="w-full" onClick={() => { setNotTodayFor(menuFor); setMenuFor(null) }}>
                    {t('week.notToday')}
                  </Button>
                )}
                {(menuFor.format === 'TARGET' || menuFor.format === 'CARD') && (
                  <FitDownloadButton sessionId={menuFor.id} date={menuFor.date} size="lg" className="w-full" />
                )}
                {isDraggable(menuFor) && (
                  <fieldset className="space-y-2">
                    <legend className="text-sm font-medium text-[#1A1A1A]">{t('week.moveTo')}</legend>
                    <div className="grid grid-cols-2 gap-2">
                      {view.days
                        .filter((d) => d.date !== menuFor.date && !d.isPast)
                        .map((d) => (
                          <Button key={d.date} variant="secondary" className="min-h-12 capitalize" disabled={move.isPending} onClick={() => requestMove(menuFor, d.date)} aria-label={t('week.moveToDay', { day: weekdayLabel(d.date, i18n.language, 'long') })}>
                            {weekdayLabel(d.date, i18n.language, 'short')} {dayMonthLabel(d.date, i18n.language)}
                          </Button>
                        ))}
                    </div>
                  </fieldset>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* "Másikat kérek" — other modalities of the same role */}
      <Dialog open={!!swapFor} onOpenChange={(o) => !o && setSwapFor(null)}>
        <DialogContent className="move-block">
          {swapFor && (
            <>
              <DialogHeader>
                <DialogTitle>{t('week.swapTitle')}</DialogTitle>
                <DialogDescription>{t('week.swapHint')}</DialogDescription>
              </DialogHeader>
              <ul className="space-y-2">
                {sameRoleAlternatives(swapFor, modalities).map((m) => (
                  <li key={m.code}>
                    <button
                      type="button"
                      disabled={swap.isPending}
                      onClick={() => swap.mutate({ id: swapFor.id, modalityCode: m.code })}
                      className="w-full min-h-12 flex items-center gap-3 rounded-[12px] border border-[#e5e4e7] bg-white px-4 text-left text-base text-[#1A1A1A] hover:bg-[#2A9D8F]/10"
                    >
                      <ModalityPicture pictureKey={pictureKeyFor(m)} className="h-8 w-8 text-[#2A9D8F]" />
                      {m.name}
                    </button>
                  </li>
                ))}
                <li>
                  <button
                    type="button"
                    disabled={swap.isPending}
                    onClick={() => swap.mutate({ id: swapFor.id })}
                    className="w-full min-h-12 rounded-[12px] border border-dashed border-[#e5e4e7] bg-white px-4 text-left text-base text-gray-700 hover:bg-[#2A9D8F]/10"
                  >
                    {t('week.swapOther')}
                  </button>
                </li>
              </ul>
              {sameRoleAlternatives(swapFor, modalities).length === 0 && <p className="mt-2 text-sm text-gray-500">{t('week.swapNone')}</p>}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* "Ma nem megy" — three answers (PRD §7.3) */}
      <Dialog open={!!notTodayFor} onOpenChange={(o) => !o && setNotTodayFor(null)}>
        <DialogContent className="move-block">
          {notTodayFor && (
            <>
              <DialogHeader>
                <DialogTitle>{t('week.notToday')}</DialogTitle>
                <DialogDescription>{t('week.notTodayQuestion')}</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-2">
                <Button size="lg" variant="secondary" disabled={notToday.isPending} onClick={() => notToday.mutate({ id: notTodayFor.id, choice: 'SHORTER' })}>
                  {t('week.shorter')}
                </Button>
                <Button size="lg" variant="secondary" disabled={notToday.isPending} onClick={() => notToday.mutate({ id: notTodayFor.id, choice: 'LATER' })}>
                  {t('week.later')}
                </Button>
                <Button size="lg" variant="secondary" disabled={notToday.isPending} onClick={() => notToday.mutate({ id: notTodayFor.id, choice: 'UNWELL' })}>
                  {t('week.unwell')}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

// ── Day column ───────────────────────────────────────────────────────────────

function DayColumn({ day, locale, dragging, onMenu, onOpen, onAdd }: { day: WeekDayView; locale: string; dragging: boolean; onMenu: (s: SessionDto) => void; onOpen: (s: SessionDto) => void; onAdd: (date: string) => void }) {
  const { t } = useMoveT()
  const { setNodeRef, isOver } = useDroppable({ id: dayDropId(day.date), disabled: day.isPast })
  return (
    <li
      ref={setNodeRef}
      className={cn(
        'rounded-[16px] border bg-white p-3 min-h-28 flex flex-col gap-2 transition-colors',
        day.isToday ? 'border-[#2A9D8F]' : 'border-[#e5e4e7]',
        isOver && !day.isPast && 'bg-[#2A9D8F]/10 border-[#2A9D8F]',
        dragging && day.isPast && 'opacity-50',
      )}
      aria-label={t('week.dayLabel', { weekday: weekdayLabel(day.date, locale, 'long'), date: dayMonthLabel(day.date, locale) })}
    >
      <header className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-semibold text-[#1A1A1A] capitalize">{weekdayLabel(day.date, locale, 'short')}</span>
        <span className="text-xs text-gray-500">{dayMonthLabel(day.date, locale)}</span>
        {day.isToday && (
          <span className="text-xs font-semibold" style={{ color: MOVE_ACCENT }}>
            {t('week.today')}
          </span>
        )}
      </header>
      {day.restDay ? (
        <p className="text-sm text-gray-500 flex items-center gap-1">
          <Leaf className="h-4 w-4" aria-hidden />
          {t('week.restDay')}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {day.sessions.map((s) => (
            <DraggableChip key={s.id} session={s} onMenu={onMenu} onOpen={onOpen} />
          ))}
        </ul>
      )}
      {!day.isPast && (
        <button
          type="button"
          onClick={() => onAdd(day.date)}
          aria-label={t('addSession.addTo', { day: weekdayLabel(day.date, locale, 'long') })}
          className="mt-auto self-start inline-flex items-center gap-1 min-h-10 rounded-lg px-2 text-sm text-gray-500 hover:bg-[#2A9D8F]/10 hover:text-[#1A1A1A]"
        >
          <Plus className="h-4 w-4" aria-hidden />
          <span>{t('addSession.short')}</span>
        </button>
      )}
    </li>
  )
}

function DraggableChip({ session, onMenu, onOpen }: { session: SessionDto; onMenu: (s: SessionDto) => void; onOpen: (s: SessionDto) => void }) {
  const draggable = isDraggable(session)
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: sessionDragId(session.id), disabled: !draggable })
  return (
    <li ref={setNodeRef} className={cn(isDragging && 'opacity-40')}>
      <Chip session={session} onMenu={onMenu} onOpen={onOpen} dragHandleProps={draggable ? { ...attributes, ...listeners } : undefined} />
    </li>
  )
}

// ── Chip ─────────────────────────────────────────────────────────────────────

function Chip({ session, onMenu, onOpen, dragHandleProps, overlay }: { session: SessionDto; onMenu?: (s: SessionDto) => void; onOpen?: (s: SessionDto) => void; dragHandleProps?: Record<string, unknown>; overlay?: boolean }) {
  const { t } = useMoveT()
  const hard = isHard(session)
  const done = session.status === 'DONE' || session.status === 'PLAN_B'
  const missed = session.status === 'MISSED'
  const label = t('week.chipLabel', { modality: session.modalityName, minutes: session.durationMin, intensity: t(`week.intensity.${intensityKey(session.intensity)}`) })
  return (
    // Below 16rem (the seven desktop columns) the chip stacks: picture on top, then one fact per line.
    <div className="@container">
      <div
        className={cn(
          'relative rounded-[12px] border p-1.5 bg-white',
          hard ? 'border-[#1A1A1A]/40' : 'border-[#e5e4e7]',
          done && 'bg-[#4F7942]/10',
          missed && 'opacity-70',
          overlay && 'shadow-lg',
        )}
      >
        <button
          type="button"
          {...(dragHandleProps ?? {})}
          onClick={onOpen && !overlay ? () => onOpen(session) : undefined}
          aria-label={label}
          className={cn(
            'w-full min-h-12 rounded-lg p-1 text-left flex flex-col items-start gap-1 @3xs:flex-row @3xs:items-center @3xs:gap-2 @3xs:pr-9',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A9D8F]',
            onOpen && 'hover:bg-black/[0.03]',
            dragHandleProps && 'cursor-grab touch-none',
          )}
        >
          <ModalityPicture pictureKey={pictureKeyFor({ code: session.modalityCode })} className="h-9 w-9 shrink-0" />
          <div className="min-w-0 w-full">
            <p className="text-sm font-semibold text-[#1A1A1A] break-words hyphens-auto @3xs:truncate">{session.modalityName}</p>
            <p className="text-xs text-gray-600 flex flex-col @3xs:flex-row @3xs:flex-wrap @3xs:items-center @3xs:gap-x-1">
              <span className="whitespace-nowrap">{t('common.minutes', { count: session.durationMin })}</span>
              <span aria-hidden className="hidden @3xs:inline">·</span>
              <span className={cn('inline-flex items-center gap-0.5 whitespace-nowrap', hard && 'font-semibold text-[#1A1A1A]')}>
                {hard ? <Flame className="h-3 w-3" aria-hidden /> : <Leaf className="h-3 w-3" aria-hidden />}
                {t(`week.intensity.${intensityKey(session.intensity)}`)}
              </span>
              {session.fixedClass && (
                <span className="inline-flex items-center gap-0.5 whitespace-nowrap">
                  <span aria-hidden className="hidden @3xs:inline">·</span>
                  <Lock className="h-3 w-3" aria-hidden />
                  {t('week.fixedClass')}
                </span>
              )}
              {(done || missed) && (
                <span className="inline-flex items-center gap-0.5">
                  <span aria-hidden className="hidden @3xs:inline">·</span>
                  {done && <Check className="h-3 w-3 shrink-0" aria-hidden />}
                  {t(`week.status.${session.status}`)}
                </span>
              )}
            </p>
          </div>
        </button>
        {onMenu && !overlay && (
          <button
            type="button"
            onClick={() => onMenu(session)}
            aria-label={t('week.actions')}
            className="absolute top-1.5 right-1.5 h-8 w-8 inline-flex items-center justify-center rounded-lg text-gray-600 hover:bg-black/5 @3xs:top-1/2 @3xs:-translate-y-1/2"
          >
            <MoreHorizontal className="h-5 w-5" aria-hidden />
          </button>
        )}
      </div>
    </div>
  )
}
