import { buildPrompt } from './gemini'

describe('buildPrompt', () => {
  it('Thai prompt contains Thai mood description', () => {
    const prompt = buildPrompt('ตลก', 'th')
    expect(prompt).toContain('ตลก ขำขัน มีมุก ร่าเริง')
    expect(prompt).toContain('ภาษาไทย')
  })

  it('English prompt contains English mood description', () => {
    const prompt = buildPrompt('ตลก', 'en')
    expect(prompt).toContain('funny, witty, playful')
    expect(prompt).toContain('English only')
  })

  it('Thai prompt contains all 4 moods correctly', () => {
    expect(buildPrompt('จิกกัด', 'th')).toContain('roast แรงๆ')
    expect(buildPrompt('น่ารัก', 'th')).toContain('อ้อน งอน')
    expect(buildPrompt('จริงจัง', 'th')).toContain('มีสาระ')
  })

  it('English prompt contains all 4 moods correctly', () => {
    expect(buildPrompt('จิกกัด', 'en')).toContain('savage roast')
    expect(buildPrompt('น่ารัก', 'en')).toContain('cute, whiny')
    expect(buildPrompt('จริงจัง', 'en')).toContain('sincere, thoughtful')
  })
})
