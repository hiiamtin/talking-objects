import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import LangToggle from './LangToggle'

describe('LangToggle', () => {
  it('renders TH and EN buttons', () => {
    render(<LangToggle lang="th" onLangChange={() => {}} />)
    expect(screen.getByText('TH')).toBeInTheDocument()
    expect(screen.getByText('EN')).toBeInTheDocument()
  })

  it('calls onLangChange with en when EN clicked', () => {
    const onChange = vi.fn()
    render(<LangToggle lang="th" onLangChange={onChange} />)
    fireEvent.click(screen.getByText('EN'))
    expect(onChange).toHaveBeenCalledWith('en')
  })
})
