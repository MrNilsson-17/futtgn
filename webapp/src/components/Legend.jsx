import { CATEGORY_COLORS } from '../lib/supabase'

const LABELS = {
  'Primera Federació': '1a Federació',
  'Segona Federació': '2a Federació',
  'Tercera Federació': '3a Federació',
  'Lliga Elit': 'Lliga Elit',
  'Primera Catalana': '1a Catalana',
  'Segona Catalana': '2a Catalana',
  'Tercera Catalana': '3a Catalana',
  'Quarta Catalana': '4a Catalana',
}

export default function Legend({ active, onToggle }) {
  return (
    <div className="legend" role="group" aria-label="Filtra per categoria">
      {Object.entries(CATEGORY_COLORS).map(([key, color]) => (
        <button
          key={key}
          type="button"
          className={`legend-chip${active === key ? ' is-active' : ''}${
            active && active !== key ? ' is-muted' : ''
          }`}
          aria-pressed={active === key}
          onClick={() => onToggle(key)}
          title={active === key ? 'Torna a mostrar totes les categories' : `Mostra només ${LABELS[key]}`}
          style={active === key ? { borderColor: color } : undefined}
        >
          <i style={{ background: color }} />
          {LABELS[key]}
        </button>
      ))}
    </div>
  )
}
