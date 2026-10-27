import { useMemo, useState } from 'react'
import { colorForCategory } from '../lib/supabase'

// Treu accents i majúscules perquè "jesus" trobi "Jesús".
const norm = (s) =>
  (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .trim()

// Els resultats que comencen pel que s'ha escrit, primer.
const rank = (name, needle) => (name.startsWith(needle) ? 0 : 1)

const shortCat = (categoria) => (categoria ? categoria.split(' — ')[0] : '')

export default function SearchBar({ municipis, onPick }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [cursor, setCursor] = useState(0)

  const results = useMemo(() => {
    const needle = norm(q)
    if (!needle) return []

    const muni = municipis
      .map((m) => ({ m, n: norm(m.nom) }))
      .filter(({ n }) => n.includes(needle))
      .sort((a, b) => rank(a.n, needle) - rank(b.n, needle) || a.n.localeCompare(b.n))
      .slice(0, 4)
      .map(({ m }) => ({ type: 'municipi', key: `m-${m.nom}`, municipi: m.nom, comarca: m.comarca }))

    const clubs = []
    municipis.forEach((m) => {
      m.clubs.forEach((c) => {
        const n = norm(c.nom)
        if (n.includes(needle)) clubs.push({ c, m, n })
      })
    })
    clubs.sort((a, b) => rank(a.n, needle) - rank(b.n, needle) || a.n.localeCompare(b.n))

    const clubRes = clubs.slice(0, 6).map(({ c, m }) => ({
      type: 'club',
      key: `c-${m.nom}-${c.nom}`,
      nom: c.nom,
      categoria: c.categoria,
      municipi: m.nom,
    }))

    return [...muni, ...clubRes]
  }, [q, municipis])

  const pick = (r) => {
    onPick(r.municipi)
    setQ('')
    setOpen(false)
    setCursor(0)
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setCursor((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setCursor((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && open && results[cursor]) {
      e.preventDefault()
      pick(results[cursor])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
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
          setCursor(0)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={onKeyDown}
        role="combobox"
        aria-expanded={open && results.length > 0}
        aria-label="Cerca un municipi o un club"
      />
      {open && q.trim() && results.length === 0 && (
        <div className="search-results search-empty">Cap resultat per a «{q.trim()}»</div>
      )}
      {open && results.length > 0 && (
        <ul className="search-results" role="listbox">
          {results.map((r, i) => (
            <li key={r.key}>
              <button
                className={i === cursor ? 'is-cursor' : ''}
                onMouseDown={() => pick(r)}
                onMouseEnter={() => setCursor(i)}
              >
                {r.type === 'municipi' ? (
                  <>
                    <span className="res-main">
                      <span className="res-tag">Municipi</span>
                      <span className="res-nom">{r.municipi}</span>
                    </span>
                    <span className="res-comarca">{r.comarca}</span>
                  </>
                ) : (
                  <>
                    <span className="res-main">
                      <i className="res-dot" style={{ background: colorForCategory(r.categoria) }} />
                      <span className="res-nom">{r.nom}</span>
                    </span>
                    <span className="res-comarca">
                      {r.municipi}
                      {r.categoria ? ` · ${shortCat(r.categoria)}` : ''}
                    </span>
                  </>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
