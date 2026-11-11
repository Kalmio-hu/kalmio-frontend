/** @vitest-environment node */
import { describe, it, expect } from 'vitest'
import { REASON_CODES, shotCardRows } from './reviewQueue'

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
})
