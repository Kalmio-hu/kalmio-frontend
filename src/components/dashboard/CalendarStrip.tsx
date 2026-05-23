import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { dashboardService } from '@/services/dashboard'
import { todayIsoLocal, dateToIsoLocal } from '@/lib/utils'
import type { CalendarDayDto } from '@/types'

// ── helpers ──────────────────────────────────────────────────────────────

/** Returns a Date as "YYYY-MM-DD" in local timezone. */
function isoDate(d: Date): string {
  return dateToIsoLocal(d)
}

/** Return the Monday of the week containing `d`. */
function weekMonday(d: Date): Date {
  const copy = new Date(d)
  const day = copy.getDay()           // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day
  copy.setDate(copy.getDate() + diff)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function addDays(d: Date, n: number): Date {
  const copy = new Date(d)
  copy.setDate(copy.getDate() + n)
  return copy
}

// ── sub-components ────────────────────────────────────────────────────────

const DAY_LABELS_HU = ['H', 'K', 'Sz', 'Cs', 'P', 'Sz', 'V']
const DAY_LABELS_EN = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

interface DayIconsProps {
  day: CalendarDayDto | undefined
}

function DayIcons({ day }: DayIconsProps) {
  if (!day) return null
  return (
    <div className="flex items-center justify-center gap-0.5 h-4">
      {day.hasMeals && (
        <span aria-hidden className="text-[10px] leading-none">🍽</span>
      )}
      {day.hasPrepTasks && (
        <span aria-hidden className="text-[10px] leading-none">🥘</span>
      )}
      {day.hasShoppingDay && (
        <span aria-hidden className="text-[10px] leading-none">🛒</span>
      )}
      {day.needsGrooming && (
        <span aria-hidden className="text-[10px] leading-none">🧊</span>
      )}
      {day.isPlanRenewalReminder && (
        <span aria-hidden className="text-[10px] leading-none">📋</span>
      )}
    </div>
  )
}

// ── main component ────────────────────────────────────────────────────────

interface CalendarStripProps {
  selectedDate: string   // "YYYY-MM-DD"
  onSelectDate: (date: string) => void
  onDayData?: (day: CalendarDayDto | undefined) => void
}

export function CalendarStrip({ selectedDate, onSelectDate, onDayData }: CalendarStripProps) {
  const { t, i18n } = useTranslation()
  const today = todayIsoLocal()
  const [weekStart, setWeekStart] = useState<Date>(() => weekMonday(new Date()))

  const weekEnd = addDays(weekStart, 6)
  const fromStr = isoDate(weekStart)
  const toStr = isoDate(weekEnd)

  const { data: calendarDays } = useQuery<CalendarDayDto[]>({
    queryKey: ['calendar', fromStr, toStr],
    queryFn: () => dashboardService.getCalendar(fromStr, toStr),
    staleTime: 60_000,
  })

  useEffect(() => {
    if (!onDayData) return
    onDayData(calendarDays?.find(c => c.date === selectedDate))
  }, [calendarDays, selectedDate, onDayData])

  const dayLabelsByIndex = i18n.language.startsWith('hu') ? DAY_LABELS_HU : DAY_LABELS_EN

  const days: Date[] = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  return (
    <div className="bg-white border-b border-[#e5e4e7] px-2 py-2">
      <div className="flex items-center gap-1">
        {/* Prev week */}
        <button
          type="button"
          aria-label={t('common.prevWeek')}
          onClick={() => setWeekStart(d => addDays(d, -7))}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-[#F9F7F2] transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </button>

        {/* Day cells */}
        <div className="flex flex-1 justify-around">
          {days.map((day, i) => {
            const dateStr = isoDate(day)
            const isToday = dateStr === today
            const isSelected = dateStr === selectedDate
            const isPast = dateStr < today
            const dayData = calendarDays?.find(c => c.date === dateStr)

            return (
              <button
                key={dateStr}
                type="button"
                aria-label={dateStr}
                aria-pressed={isSelected}
                onClick={() => onSelectDate(dateStr)}
                className={[
                  'flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-[10px] min-w-[38px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]',
                  isSelected
                    ? 'bg-[#1A1A1A] text-white'
                    : isPast && !isToday
                      ? 'hover:bg-[#F9F7F2] text-gray-400'
                      : 'hover:bg-[#F9F7F2] text-[#1A1A1A]',
                ].join(' ')}
              >
                <span className="text-[10px] font-medium uppercase leading-none">
                  {dayLabelsByIndex[i]}
                </span>
                <div className="relative flex items-center justify-center w-7 h-7">
                  {isToday && !isSelected && (
                    <span
                      aria-hidden
                      className="absolute inset-0 rounded-full bg-[#F28C28]/20"
                    />
                  )}
                  <span
                    className={[
                      'text-sm font-semibold leading-none z-10',
                      isToday && !isSelected ? 'text-[#F28C28]' : '',
                    ].join(' ')}
                  >
                    {day.getDate()}
                  </span>
                </div>
                <DayIcons day={dayData} />
              </button>
            )
          })}
        </div>

        {/* Next week */}
        <button
          type="button"
          aria-label={t('common.nextWeek')}
          onClick={() => setWeekStart(d => addDays(d, 7))}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-[#F9F7F2] transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]"
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  )
}
