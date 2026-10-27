const SUPABASE_URL = 'https://moupqlmazliymazcxgih.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vdXBxbG1hemxpeW1hemN4Z2loIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NDA3MDcsImV4cCI6MjEwNTIxNjcwN30.ZDM6zDKIcvc_STDyT_8IDozQT2ooLuZMp8vyIFLe9f8'

const headers = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
}

// Equirectangular-with-latitude-correction projection viewBox used when the
// comarca/municipi path_svg values were generated (db/schema + migrations).
export const VIEW_BOX = '0 0 800.0 754.9'

const CATEGORY_ORDER = [
  'Primera Federació',
  'Segona Federació',
  'Tercera Federació',
  'Lliga Elit',
  'Primera Catalana',
  'Segona Catalana',
  'Tercera Catalana',
  'Quarta Catalana',
]

export function categoryRank(categoria) {
  if (!categoria) return CATEGORY_ORDER.length
  const idx = CATEGORY_ORDER.findIndex((c) => categoria.startsWith(c))
  return idx === -1 ? CATEGORY_ORDER.length : idx
}

// Tier colors — reused everywhere a category needs a swatch (legend, badges,
// map tinting). Warmest gold at the top tier, cooling toward the base.
export const CATEGORY_COLORS = {
  'Primera Federació': '#e8481c',
  'Segona Federació': '#5f7fae',
  'Tercera Federació': '#8fd18a',
  'Lliga Elit': '#7b2fbf',
  'Primera Catalana': '#f2b705',
  'Segona Catalana': '#f6cb3d',
  'Tercera Catalana': '#f9dc79',
  'Quarta Catalana': '#fbebb0',
}

// True when a club's categoria (e.g. 'Segona Federació — Grup 2') belongs to
// one of the legend categories (e.g. 'Segona Federació').
export function clubInCategory(club, key) {
  return !!club.categoria && club.categoria.startsWith(key)
}

export function colorForCategory(categoria) {
  if (!categoria) return '#6b7b6f'
  const key = Object.keys(CATEGORY_COLORS).find((c) => categoria.startsWith(c))
  return key ? CATEGORY_COLORS[key] : '#6b7b6f'
}

// Groups clubs that share the same field into one pin (e.g. two clubs that
// both play at the same camp). Clubs without known camp coordinates are
// left out — the panel's flat list still shows them.
function buildCamps(clubs) {
  const byCamp = new Map()
  clubs.forEach((c) => {
    if (c.campX == null || c.campY == null) return
    const key = c.campNom || `${c.campX},${c.campY}`
    if (!byCamp.has(key)) {
      byCamp.set(key, { nom: c.campNom, x: c.campX, y: c.campY, clubs: [] })
    }
    byCamp.get(key).clubs.push(c)
  })
  return [...byCamp.values()]
}

export async function fetchMapData() {
  const [comarquesRes, rowsRes] = await Promise.all([
    fetch(`${SUPABASE_URL}/rest/v1/comarques?select=nom,path_svg`, { headers }),
    fetch(`${SUPABASE_URL}/rest/v1/v_municipis_clubs?select=*`, { headers }),
  ])

  if (!comarquesRes.ok || !rowsRes.ok) {
    throw new Error('No s\'ha pogut connectar amb la base de dades.')
  }

  const comarques = await comarquesRes.json()
  const rows = await rowsRes.json()

  const comarcaPaths = {}
  comarques.forEach((c) => {
    comarcaPaths[c.nom] = c.path_svg
  })

  const municipis = {}
  rows.forEach((r) => {
    const nom = r.municipi
    if (!municipis[nom]) {
      municipis[nom] = {
        nom,
        comarca: r.comarca,
        path: r.municipi_path,
        bbox: {
          x0: r.bbox_x0,
          y0: r.bbox_y0,
          x1: r.bbox_x1,
          y1: r.bbox_y1,
        },
        clubs: [],
      }
    }
    if (r.club_nom) {
      municipis[nom].clubs.push({
        nom: r.club_nom,
        categoria: r.categoria,
        confirmat: r.confirmat,
        crestUrl: r.crest_url,
        campNom: r.camp_nom ?? null,
        campX: r.camp_x ?? null,
        campY: r.camp_y ?? null,
      })
    }
  })

  Object.values(municipis).forEach((m) => {
    m.clubs.sort((a, b) => categoryRank(a.categoria) - categoryRank(b.categoria))
    m.topRank = m.clubs.length ? categoryRank(m.clubs[0].categoria) : null
    m.camps = buildCamps(m.clubs)
  })

  return { comarcaPaths, municipis: Object.values(municipis) }
}
