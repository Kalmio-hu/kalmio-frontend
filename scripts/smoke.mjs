// Headless smoke test against the built bundle.
//
// Why this exists: the CI pipeline runs lint/test/build before this, but those
// only catch static errors. A SPA can build cleanly and still white-screen on
// boot (broken router, throwing useEffect, missing env var inlined as
// undefined). This script boots `vite preview` and verifies the app actually
// mounts in a real browser. It's the last gate before upload-to-prod.
//
// Failure modes it catches:
//   - Uncaught exceptions during initial render (pageerror)
//   - React never rendering anything into #root within 10s
//
// What it deliberately ignores:
//   - console.error from failed backend/Supabase calls — the smoke runs in CI
//     without a backend reachable, so network errors are expected noise
//   - Anything that requires interaction (login, route changes) — out of scope

import { spawn } from 'node:child_process'
import { chromium } from 'playwright'

const PORT = 4173
const URL = `http://localhost:${PORT}/`
const PREVIEW_BOOT_TIMEOUT_MS = 30_000
const RENDER_TIMEOUT_MS = 10_000

function log(msg) {
  console.log(`[smoke] ${msg}`)
}

async function waitForPort(url, timeoutMs) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch {
      // not yet
    }
    await new Promise(r => setTimeout(r, 250))
  }
  throw new Error(`preview server did not become reachable at ${url} within ${timeoutMs}ms`)
}

async function main() {
  log(`booting vite preview on :${PORT}`)
  const preview = spawn('pnpm', ['exec', 'vite', 'preview', '--port', String(PORT), '--strictPort'], {
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  preview.stdout.on('data', d => process.stdout.write(`[preview] ${d}`))
  preview.stderr.on('data', d => process.stderr.write(`[preview] ${d}`))

  let exitCode = 1
  let browser
  try {
    await waitForPort(URL, PREVIEW_BOOT_TIMEOUT_MS)
    log('preview is reachable, launching chromium')

    browser = await chromium.launch()
    const context = await browser.newContext()
    const page = await context.newPage()

    const pageErrors = []
    page.on('pageerror', err => {
      pageErrors.push(err)
      log(`pageerror: ${err.message}`)
    })

    log(`navigating to ${URL}`)
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: RENDER_TIMEOUT_MS })

    log('waiting for React to mount into #root')
    await page.waitForFunction(
      () => {
        const root = document.querySelector('#root')
        return root && root.childElementCount > 0
      },
      null,
      { timeout: RENDER_TIMEOUT_MS },
    )
    log('React mounted')

    // Give async effects a moment to fire — catches errors thrown in useEffect
    await page.waitForTimeout(2000)

    if (pageErrors.length > 0) {
      log(`FAIL: ${pageErrors.length} uncaught error(s) during boot`)
      for (const err of pageErrors) {
        log(`  - ${err.message}`)
      }
      exitCode = 1
    } else {
      log('PASS: app mounted with no uncaught errors')
      exitCode = 0
    }
  } catch (err) {
    log(`FAIL: ${err.message}`)
    exitCode = 1
  } finally {
    if (browser) await browser.close()
    preview.kill('SIGTERM')
    // Give it a moment to exit cleanly, then force
    await new Promise(r => setTimeout(r, 500))
    if (preview.exitCode === null) preview.kill('SIGKILL')
  }

  process.exit(exitCode)
}

main().catch(err => {
  console.error('[smoke] unexpected:', err)
  process.exit(1)
})
