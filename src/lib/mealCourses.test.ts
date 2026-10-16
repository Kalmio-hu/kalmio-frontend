import { describe, expect, it } from 'vitest'
import { addableCourses, canRemoveCourse, mainOf, slotRows, sortByCourse } from './mealCourses'
import type { TemplateMeal } from '@/types'

function row(id: string, course: TemplateMeal['course'], extra: Partial<TemplateMeal> = {}): TemplateMeal {
  return {
    id,
    planId: 'p',
    dayIndex: 0,
    mealType: 'LUNCH',
    memberId: 'm',
    recipeId: `r-${id}`,
    offPlanMealTemplateId: null,
    servings: 1,
    source: 'MANUAL',
    course,
    ...extra,
  } as TemplateMeal
}

describe('mealCourses', () => {
  it('sorts course rows into plating order: soup, main, side, condiment', () => {
    const sorted = sortByCourse([row('c', 'CONDIMENT'), row('s', 'SIDE'), row('m', 'MAIN'), row('l', 'SOUP')])
    expect(sorted.map(r => r.course)).toEqual(['SOUP', 'MAIN', 'SIDE', 'CONDIMENT'])
  })

  it('treats a row without a course as MAIN (legacy rows)', () => {
    const legacy = row('x', undefined)
    expect(mainOf([row('s', 'SIDE'), legacy])?.id).toBe('x')
    expect(sortByCourse([row('s', 'SIDE'), legacy]).map(r => r.id)).toEqual(['x', 's'])
  })

  it('offers only the missing courses, and MAIN first when the slot is empty', () => {
    expect(addableCourses([])).toEqual(['MAIN'])
    expect(addableCourses(['MAIN'])).toEqual(['SOUP', 'SIDE', 'CONDIMENT'])
    expect(addableCourses(['MAIN', 'SIDE'])).toEqual(['SOUP', 'CONDIMENT'])
    expect(addableCourses(['SOUP', 'MAIN', 'SIDE', 'CONDIMENT'])).toEqual([])
  })

  it('keeps the MAIN row while other courses exist', () => {
    const main = row('m', 'MAIN')
    const side = row('s', 'SIDE')
    expect(canRemoveCourse(main, [main, side])).toBe(false)
    expect(canRemoveCourse(side, [main, side])).toBe(true)
    expect(canRemoveCourse(main, [main])).toBe(true)
  })

  it('selects the rows of one slot only', () => {
    const meals = [
      row('a', 'MAIN'),
      row('b', 'SIDE'),
      row('other-day', 'MAIN', { dayIndex: 1 }),
      row('other-member', 'MAIN', { memberId: 'z' }),
      row('other-slot', 'MAIN', { mealType: 'DINNER' }),
    ]
    expect(slotRows(meals, 0, 'LUNCH', 'm').map(r => r.id)).toEqual(['a', 'b'])
  })
})
