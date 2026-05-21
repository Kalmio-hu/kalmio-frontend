/**
 * Pure utility functions extracted from plan pages so they can be
 * imported by both page components and unit tests without triggering
 * the react-refresh/only-export-components lint rule.
 */

export function generatePlanName(
  memberNames: string[],
  startDate: string,
  t: (key: string, opts?: Record<string, unknown>) => string,
): string {
  if (!startDate) return ''
  const date = new Date(startDate)
  const monthDay = new Intl.DateTimeFormat('hu-HU', { month: 'long', day: 'numeric' }).format(date)
  if (memberNames.length <= 1) return t('plan.wizard.autoName', { date: monthDay })
  return t('plan.wizard.autoNameFamily', { date: monthDay })
}

/**
 * Generates an auto-name for a plan template (calendar-free).
 * Uses the current month as context since templates have no start date.
 */
export function generateTemplateName(
  memberNames: string[],
  t: (key: string, opts?: Record<string, unknown>) => string,
): string {
  const now = new Date()
  const monthName = new Intl.DateTimeFormat('hu-HU', { month: 'long' }).format(now)
  if (memberNames.length <= 1) return t('plan.wizard.autoName', { date: monthName })
  return t('plan.wizard.autoNameFamily', { date: monthName })
}
