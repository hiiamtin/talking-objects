const DIRS = [
  { key: 'top',    label: '↑' },
  { key: 'bottom', label: '↓' },
  { key: 'left',   label: '←' },
  { key: 'right',  label: '→' },
]

const BGS = [
  { key: 'white',       label: '⬜', title: 'ขาว' },
  { key: 'black',       label: '⬛', title: 'ดำ'  },
  { key: 'transparent', label: '◻',  title: 'โปร่งใส' },
]

export default function BubbleStyleBar({ tailDir, onTailDir, bubbleBg, onBubbleBg }) {
  return (
    <div className="bubble-style-bar">
      <div className="style-group">
        {DIRS.map(d => (
          <button
            key={d.key}
            className={`style-btn ${tailDir === d.key ? 'active' : ''}`}
            onClick={() => onTailDir(d.key)}
            title={d.key}
          >
            {d.label}
          </button>
        ))}
      </div>
      <div className="style-divider" />
      <div className="style-group">
        {BGS.map(b => (
          <button
            key={b.key}
            className={`style-btn ${bubbleBg === b.key ? 'active' : ''}`}
            onClick={() => onBubbleBg(b.key)}
            title={b.title}
          >
            {b.label}
          </button>
        ))}
      </div>
    </div>
  )
}
