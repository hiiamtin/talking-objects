const DIRS = [
  { key: 'auto',   label: '🔄' },
  { key: 'top',    label: '↑'  },
  { key: 'bottom', label: '↓'  },
  { key: 'left',   label: '←'  },
  { key: 'right',  label: '→'  },
]

const BGS = [
  { key: 'white',       label: '⬜' },
  { key: 'black',       label: '⬛' },
  { key: 'transparent', label: '◻'  },
]

const SIZES = [
  { key: 'sm', label: 'S' },
  { key: 'md', label: 'M' },
  { key: 'lg', label: 'L' },
  { key: 'xl', label: 'XL' },
]

const COLORS = [
  { key: null,      label: '◐', title: 'Auto' },
  { key: '#111111', label: '⚫', title: 'Black' },
  { key: '#ffffff', label: '⚪', title: 'White' },
  { key: '#FFD600', label: '🟡', title: 'Yellow' },
  { key: '#E53935', label: '🔴', title: 'Red' },
]

export default function BubbleStyleBar({
  tailDir, onTailDir,
  bubbleBg, onBubbleBg,
  fontSize, onFontSize,
  fontColor, onFontColor,
}) {
  return (
    <div className="bubble-style-bar">
      {/* Tail direction */}
      <div className="style-group">
        {DIRS.map(d => (
          <button
            key={d.key}
            className={`style-btn ${tailDir === d.key ? 'active' : ''}`}
            onClick={() => onTailDir(d.key)}
            title={d.key}
          >{d.label}</button>
        ))}
      </div>

      <div className="style-divider" />

      {/* Bubble background */}
      <div className="style-group">
        {BGS.map(b => (
          <button
            key={b.key}
            className={`style-btn ${bubbleBg === b.key ? 'active' : ''}`}
            onClick={() => onBubbleBg(b.key)}
          >{b.label}</button>
        ))}
      </div>

      <div className="style-divider" />

      {/* Font size */}
      <div className="style-group">
        {SIZES.map(s => (
          <button
            key={s.key}
            className={`style-btn ${fontSize === s.key ? 'active' : ''}`}
            onClick={() => onFontSize(s.key)}
          >{s.label}</button>
        ))}
      </div>

      <div className="style-divider" />

      {/* Font color */}
      <div className="style-group">
        {COLORS.map(c => (
          <button
            key={String(c.key)}
            className={`style-btn ${fontColor === c.key ? 'active' : ''}`}
            onClick={() => onFontColor(c.key)}
            title={c.title}
          >{c.label}</button>
        ))}
      </div>
    </div>
  )
}
