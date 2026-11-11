/**
 * Second line of defence for the Move import boundary (contract §2), beside the
 * ESLint `no-restricted-imports` blocks in eslint.config.js.
 *
 *  1. Files under src/features/move/** may not import @/pages/*, the nutrition
 *     component folders, or @/services/* except users, notificationService,
 *     momentum and family. Relative escapes to those folders count too.
 *  2. Files outside the feature may import from '@/features/move' (the index)
 *     only, and only the allow-listed files may do that.
 *
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve, dirname, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const SRC = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const FEATURE = join(SRC, 'features', 'move')

const ALLOWED_IMPORTERS = [
  'App.tsx',
  'pages/Dashboard.tsx',
  'pages/Settings.tsx',
  'pages/admin/MoveReviewQueue.tsx',
  'components/OnboardingGate.tsx',
  'i18n/index.ts', // registers the move namespace (JSON only)
]
const ALLOWED_IMPORTER_DIRS = ['components/layout/']

const FORBIDDEN_COMPONENT_DIRS = [
  'dashboard', 'plan', 'shopping', 'recipe', 'recipes', 'schedule', 'fridge', 'grooming',
  'cook', 'taste', 'member', 'family', 'retail',
]
const ALLOWED_SERVICES = ['users', 'notificationService', 'momentum', 'family']

const IMPORT_RE = /(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)|import\s*['"]([^'"]+)['"]/g

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    const st = statSync(full)
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === 'dist') continue
      walk(full, out)
    } else if (/\.(ts|tsx)$/.test(name) && !/\.d\.ts$/.test(name)) {
      out.push(full)
    }
  }
  return out
}

function importsOf(file: string): string[] {
  const text = readFileSync(file, 'utf8')
  const specs: string[] = []
  for (const m of text.matchAll(IMPORT_RE)) specs.push(m[1] ?? m[2] ?? m[3])
  return specs
}

/** Resolve a specifier to a path relative to src/ with forward slashes, or null for packages. */
function toSrcPath(fromFile: string, spec: string): string | null {
  if (spec.startsWith('@/')) return spec.slice(2)
  if (spec.startsWith('.')) {
    const abs = resolve(dirname(fromFile), spec)
    const rel = relative(SRC, abs)
    if (rel.startsWith('..')) return null
    return rel.split(sep).join('/')
  }
  return null
}

const allFiles = walk(SRC)
const featureFiles = allFiles.filter((f) => f.startsWith(FEATURE + sep))
const outsideFiles = allFiles.filter((f) => !f.startsWith(FEATURE + sep))

describe('Move import boundary', () => {
  it('feature files do not import nutrition pages, components or services', () => {
    const violations: string[] = []
    for (const file of featureFiles) {
      for (const spec of importsOf(file)) {
        const p = toSrcPath(file, spec)
        if (!p) continue
        const rel = relative(SRC, file)
        if (p.startsWith('pages/')) violations.push(`${rel} → ${spec}`)
        if (FORBIDDEN_COMPONENT_DIRS.some((d) => p.startsWith(`components/${d}/`))) violations.push(`${rel} → ${spec}`)
        if (p.startsWith('services/')) {
          const name = p.slice('services/'.length).replace(/\.tsx?$/, '')
          if (!ALLOWED_SERVICES.includes(name)) violations.push(`${rel} → ${spec}`)
        }
      }
    }
    expect(violations, violations.join('\n')).toEqual([])
  })

  it('outside files import the feature through its index only, and only from the allow-list', () => {
    const violations: string[] = []
    for (const file of outsideFiles) {
      const rel = relative(SRC, file).split(sep).join('/')
      for (const spec of importsOf(file)) {
        const p = toSrcPath(file, spec)
        if (!p || !p.startsWith('features/move')) continue
        const isIndex = p === 'features/move' || p === 'features/move/index' || p === 'features/move/index.ts'
        const isI18nJson = /^features\/move\/i18n\/move\.(hu|en)\.json$/.test(p) && rel === 'i18n/index.ts'
        const allowed = ALLOWED_IMPORTERS.includes(rel) || ALLOWED_IMPORTER_DIRS.some((d) => rel.startsWith(d))
        if (!isIndex && !isI18nJson) violations.push(`${rel} → ${spec} (deep import)`)
        else if (!allowed) violations.push(`${rel} → ${spec} (not on the allow-list)`)
      }
    }
    expect(violations, violations.join('\n')).toEqual([])
  })

  it('the index exports only the sanctioned names', () => {
    const text = readFileSync(join(FEATURE, 'index.ts'), 'utf8')
    const names = Array.from(text.matchAll(/export\s*\{([^}]+)\}/g))
      .flatMap((m) => m[1].split(',').map((s) => s.trim()).filter(Boolean))
      .sort()
    expect(names).toEqual(
      [
        'MOVE_ACCENT',
        'MoveLandingRoute',
        'MovePlayerRoute',
        'MoveReviewQueueRoute',
        'MoveRoutes',
        'MoveStartRoute',
        'MoveTodayBlock',
        'useMoveStatus',
      ].sort(),
    )
  })
})
