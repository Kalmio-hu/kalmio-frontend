/** @vitest-environment node */
import { describe, it, expect } from 'vitest'
import { REASON_CODES, shotCardRows, toReviewQueue, type RawReviewQueue } from './reviewQueue'

const t = (k: string) => k.split('.').pop() ?? k

describe('review queue helpers', () => {
  it('maps keys 1–6 to the six reason codes in contract order', () => {
    expect(REASON_CODES).toEqual([
      'WRONG_JOINT_POSITION', 'WRONG_SUPPORT', 'ANATOMY_ERROR', 'EQUIPMENT_ERROR', 'UNSAFE_RANGE', 'STYLE_DRIFT',
    ])
  })

  it('renders a structured shot card as poses, camera, checkpoints, faults, cues, then the rest', () => {
    const rows = shotCardRows(
      {
        poses: { start: 'ül', end: 'áll' },
        camera: 'oldalról',
        checkpoints: ['térd a boka fölött'],
        faults: ['előredől'],
        cues: { formal: ['Álljon fel.'], informal: ['Állj fel.'] },
        equipment: ['szék'],
        tempo: '2-1-2',
      },
      t,
    )
    expect(rows.map((r) => r.label)).toEqual([
      'poses · start', 'poses · end', 'camera', 'checkpoints', 'faults', 'cues · formal', 'cues · informal', 'equipment', 'tempo',
    ])
    expect(rows[0].values).toEqual(['ül'])
    expect(rows[8].values).toEqual(['2-1-2'])
  })

  it('tolerates flat arrays and an empty card', () => {
    expect(shotCardRows({}, t)).toEqual([])
    const rows = shotCardRows({ poses: ['a', 'b'], cues: ['x'] }, t)
    expect(rows).toEqual([
      { label: 'poses', values: ['a', 'b'] },
      { label: 'cues', values: ['x'] },
    ])
  })

  it('flattens the backend queue and maps the snake_case shot card', () => {
    const media = { id: 'm1', exerciseId: 'e1', characterCode: 'GABOR', mediaType: 'STILL_START' as const, style: 'STYLISED',
      url: 'u1', shotCardVersion: 1, provider: 'openai', model: 'x', attempt: 1, reportCount: 0,
      reviewStatus: 'PENDING' as const, createdAt: '2026-11-12T00:00:00Z' }
    const raw: RawReviewQueue = {
      items: [{ media, exercise: { id: 'e1', code: 'gym_squat', packCode: 'GYM', nameHu: 'Guggolás', nameEn: 'Squat' },
        shotCard: { start_pose: 'áll', end_pose: 'guggol', common_faults: ['térd befelé'], cues_hu: ['lassan'], camera: 'oldal', name: 'x' },
        pairedStill: { ...media, id: 'm2', mediaType: 'STILL_END' as const, url: 'u2' } }],
      pending: 7, approved: 1, rejected: 0, unpublished: 0,
    }
    const q = toReviewQueue(raw, [{ packCode: 'GYM', characterCode: 'GABOR', count: 7 }], 'hu', () => 'Gábor')
    expect(q.counts.pending).toBe(7)
    expect(q.packs).toEqual(['GYM'])
    expect(q.characters).toEqual([{ code: 'GABOR', name: 'Gábor' }])
    expect(q.items[0]).toMatchObject({ mediaId: 'm1', exerciseName: 'Guggolás', pack: 'GYM', characterName: 'Gábor', pairUrl: 'u2' })
    expect(q.items[0].shotCard).toEqual({ camera: 'oldal', poses: { start: 'áll', end: 'guggol' }, faults: ['térd befelé'], cues: ['lassan'] })
  })
})
