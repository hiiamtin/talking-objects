import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import MoodSelector from './MoodSelector'

describe('MoodSelector', () => {
  it('renders all 4 mood buttons', () => {
    render(<MoodSelector mood="ตลก" onMoodChange={() => {}} />)
    expect(screen.getByText('ตลก')).toBeInTheDocument()
    expect(screen.getByText('จิกกัด')).toBeInTheDocument()
    expect(screen.getByText('น่ารัก')).toBeInTheDocument()
    expect(screen.getByText('จริงจัง')).toBeInTheDocument()
  })

  it('calls onMoodChange when button clicked', () => {
    const onChange = vi.fn()
    render(<MoodSelector mood="ตลก" onMoodChange={onChange} />)
    fireEvent.click(screen.getByText('จิกกัด'))
    expect(onChange).toHaveBeenCalledWith('จิกกัด')
  })

  it('highlights active mood', () => {
    render(<MoodSelector mood="น่ารัก" onMoodChange={() => {}} />)
    expect(screen.getByText('น่ารัก').closest('button')).toHaveClass('active')
  })
})
