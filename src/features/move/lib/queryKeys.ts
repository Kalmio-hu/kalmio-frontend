/**
 * TanStack Query keys for Kalmio Move. Everything hangs off `['move']` so one
 * `invalidateQueries({ queryKey: moveKeys.all })` clears the whole space.
 */
export const moveKeys = {
  all: ['move'] as const,
  status: ['move', 'status'] as const,
  profile: ['move', 'profile'] as const,
  equipment: ['move', 'equipment'] as const,
  limits: ['move', 'limits'] as const,
  fixedClasses: ['move', 'fixed-classes'] as const,
  modalities: ['move', 'modalities'] as const,
  characters: ['move', 'characters'] as const,
  today: ['move', 'today'] as const,
  week: (start?: string) => ['move', 'week', start ?? 'current'] as const,
  session: (sessionId: string) => ['move', 'session', sessionId] as const,
  replan: ['move', 'replan'] as const,
  progress: ['move', 'progress'] as const,
  library: (pack?: string, level?: string) => ['move', 'library', pack ?? '', level ?? ''] as const,
  selfTests: ['move', 'self-tests'] as const,
  helper: ['move', 'helper'] as const,
  helperSummary: (helpedUserId: string) => ['move', 'helper', 'summary', helpedUserId] as const,
  sheet: (start?: string) => ['move', 'sheet', start ?? 'current'] as const,
  devices: ['move', 'devices'] as const,
  calendarToken: ['move', 'calendar', 'token'] as const,
  familySession: ['move', 'family-session'] as const,
  admin: {
    queue: (status: string, pack: string, character: string) =>
      ['move', 'admin', 'review-queue', status, pack, character] as const,
    exercises: ['move', 'admin', 'exercises'] as const,
    exercise: (id: string) => ['move', 'admin', 'exercises', id] as const,
    stats: ['move', 'admin', 'stats'] as const,
  },
}
