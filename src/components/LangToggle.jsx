import React from 'react'

export default function LangToggle({ lang, onLangChange }) {
  return (
    <div className="lang-toggle">
      <button
        className={`lang-btn ${lang === 'th' ? 'active' : ''}`}
        onClick={() => onLangChange('th')}
      >
        TH
      </button>
      <span className="lang-divider">|</span>
      <button
        className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
        onClick={() => onLangChange('en')}
      >
        EN
      </button>
    </div>
  )
}
