import { describe, it, expect } from 'vitest'
import { generateBlessingFromImage } from './gemini'

describe('gemini module', () => {
  it('exports generateBlessingFromImage function', () => {
    expect(typeof generateBlessingFromImage).toBe('function')
  })
})
