import { useMemo, useState } from 'react'

export default function SearchBar({ municipis, onPick }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)

  const results = useMemo(() => {
    if (!q.trim()) return []
    const needle = q.trim().toLowerCase()
    return municipis
      .filter((m) => m.nom.toLowerCase().includes(needle) || m.clubs.some((c) => c.nom.toLowerCase().includes(needle)))
      .slice(0, 7)
  }, [q, municipis])

  const pick = (nom) => {
    onPick(nom)
    setQ('')
    setOpen(false)
  }

  return (
    <div className="search-wrap">
      <input
        className="search-input"
        placeholder="Cerca un municipi o un club…"
        value={q}
        onChange={(e) => {
          setQ(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
      />
      {open && results.length > 0 && (
        <ul className="search-results">
          {results.map((m) => (
            <li key={m.nom}>
              <button onMouseDown={() => pick(m.nom)}>
                <span className="res-nom">{m.nom}</span>
                <span className="res-comarca">{m.comarca}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
