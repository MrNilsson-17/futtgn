import { useEffect, useRef, useState } from 'react'
import MapView from './components/MapView.jsx'
import ClubPanel from './components/ClubPanel.jsx'
import SearchBar from './components/SearchBar.jsx'
import Legend from './components/Legend.jsx'
import { fetchMapData } from './lib/supabase.js'

export default function App() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [selected, setSelected] = useState(null)
  const mapRef = useRef(null)

  useEffect(() => {
    fetchMapData()
      .then(setData)
      .catch((e) => setError(e.message))
  }, [])

  const selectedMuni = data?.municipis.find((m) => m.nom === selected) ?? null

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div className="brand">
          <span className="brand-mark">TGN</span>
          <div>
            <h1>Mapa del futbol tarragoní</h1>
            <p>Clubs de futbol 11, temporada 2026–27</p>
          </div>
        </div>
        {data && <SearchBar municipis={data.municipis} onPick={setSelected} />}
      </header>

      <main className="map-stage">
        {error && (
          <div className="status-banner status-error">
            No s'ha pogut carregar el mapa: {error}
          </div>
        )}
        {!data && !error && <div className="status-banner">Carregant el mapa…</div>}

        {data && (
          <MapView
            ref={mapRef}
            comarcaPaths={data.comarcaPaths}
            municipis={data.municipis}
            selected={selected}
            onSelect={setSelected}
          />
        )}

        {data && (
          <div className="map-controls">
            <button onClick={() => mapRef.current?.zoomIn()} aria-label="Apropa">
              +
            </button>
            <button onClick={() => mapRef.current?.zoomOut()} aria-label="Allunya">
              −
            </button>
            <button
              className="reset-btn"
              onClick={() => {
                setSelected(null)
                mapRef.current?.reset()
              }}
              aria-label="Vista general"
            >
              ⤢
            </button>
          </div>
        )}

        {data && <Legend />}
      </main>

      <ClubPanel municipi={selectedMuni} onClose={() => setSelected(null)} />
    </div>
  )
}
