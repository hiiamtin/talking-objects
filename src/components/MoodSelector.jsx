import React from 'react'

const MOODS = ['ตลก', 'จิกกัด', 'น่ารัก', 'จริงจัง']

export default function MoodSelector({ mood, onMoodChange }) {
  return (
    <div className="mood-selector">
      {MOODS.map(m => (
        <button
          key={m}
          className={`mood-btn ${mood === m ? 'active' : ''}`}
          onClick={() => onMoodChange(m)}
        >
          {m}
        </button>
      ))}
    </div>
  )
}
