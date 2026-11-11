/** The start flow's screens in order (PRD §7.1; "who is it for" through the week on screen). */
export const START_STEPS = ['forWhom', 'modalities', 'schedule', 'equipment', 'health', 'result'] as const
export type StartStep = (typeof START_STEPS)[number]
