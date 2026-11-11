/**
 * /app/admin/move/review — demonstration review queue (PRD §12.4).
 * Thin mount point: the page itself lives inside the Move feature so the
 * service and types stay behind the feature boundary (contract §2).
 */
import { MoveReviewQueueRoute } from '@/features/move'

export function MoveReviewQueue() {
  return <MoveReviewQueueRoute />
}
