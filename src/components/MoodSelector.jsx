import React from 'react'

const MOODS = ['ตลก', 'จิกกัด', 'น่ารัก', 'จริงจัง']

export default function MoodSelector({ mood, onMoodChange, moodLabels }) {
  return (
    <div className="mood-selector">
      {MOODS.map(m => (
        <button
          key={m}
          className={`mood-btn ${mood === m ? 'active' : ''}`}
          onClick={() => onMoodChange(m)}
        >
          {moodLabels?.[m] ?? m}
        </button>
      ))}
    </div>
  )
}
