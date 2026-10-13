import { AnimatePresence, motion } from 'framer-motion'
import { colorForCategory } from '../lib/supabase'

function initials(name) {
  return name
    .replace(/^(CF|CE|UE|UD|CD|FC|UDC|CFB|PB|NSA|AE)\s+/i, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

function Crest({ club }) {
  if (club.crestUrl) {
    return (
      <img
        src={club.crestUrl}
        alt={club.nom}
        className="crest-img"
        onError={(e) => {
          e.currentTarget.style.display = 'none'
          e.currentTarget.nextSibling.style.display = 'flex'
        }}
      />
    )
  }
  return null
}

function ClubRow({ club, delay }) {
  return (
    <motion.li
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.35, ease: 'easeOut' }}
      className="club-row"
    >
      <div className="crest-wrap">
        <Crest club={club} />
        <div className="crest-fallback" style={{ background: colorForCategory(club.categoria), display: club.crestUrl ? 'none' : 'flex' }}>
          {initials(club.nom)}
        </div>
      </div>
      <div className="club-info">
        <p className="club-name">{club.nom}</p>
        <p className="club-category" style={{ color: colorForCategory(club.categoria) }}>
          {club.categoria || 'Categoria pendent de confirmar'}
          {!club.confirmat && <span className="pending-dot" title="Pendent de confirmar" />}
        </p>
      </div>
    </motion.li>
  )
}

export default function ClubPanel({ municipi, onClose }) {
  return (
    <AnimatePresence>
      {municipi && (
        <motion.aside
          key={municipi.nom}
          className="club-panel"
          initial={{ x: '110%', opacity: 0.4 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '110%', opacity: 0.4 }}
          transition={{ type: 'spring', stiffness: 260, damping: 32 }}
        >
          <div className="club-panel-head">
            <div>
              <p className="eyebrow-comarca">{municipi.comarca}</p>
              <h2>{municipi.nom}</h2>
            </div>
            <button className="close-btn" onClick={onClose} aria-label="Tanca">
              ×
            </button>
          </div>

          {municipi.clubs.length === 0 ? (
            <p className="empty-note">
              Cap club de futbol 11 registrat a {municipi.nom} aquesta temporada, entre 1a
              Federació i 4a Catalana.
            </p>
          ) : (
            <ul className="club-list">
              {municipi.clubs.map((c, i) => (
                <ClubRow key={c.nom} club={c} delay={0.05 * i} />
              ))}
            </ul>
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
