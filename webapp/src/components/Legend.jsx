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

export default function Legend() {
  return (
    <div className="legend">
      {Object.entries(CATEGORY_COLORS).map(([key, color]) => (
        <span key={key} className="legend-chip">
          <i style={{ background: color }} />
          {LABELS[key]}
        </span>
      ))}
    </div>
  )
}
