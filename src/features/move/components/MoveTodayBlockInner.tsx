import { CheckInStrip } from './CheckInStrip'
import { TodayCard } from './TodayCard'
import type { MovementTodayBlockDto } from '../types'
import '../move.css'

/**
 * Dashboard composition for the movement pillar (PRD §10): the morning check-in
 * strip at the top until answered or dismissed, then the today card.
 */
export function MoveTodayBlockInner({ movement }: { movement: MovementTodayBlockDto }) {
  return (
    <div className="move-block flex flex-col gap-3" data-space="move">
      <CheckInStrip date={movement.date} checkIn={movement.checkIn} />
      <TodayCard
        session={movement.session}
        restDay={movement.restDay}
        tomorrowLine={movement.tomorrowLine}
        lifeState={movement.lifeState}
        couplingLine={movement.couplingLine}
      />
    </div>
  )
}
