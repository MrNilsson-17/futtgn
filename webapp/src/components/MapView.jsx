import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react'
import { VIEW_BOX, colorForCategory } from '../lib/supabase'

const FULL = VIEW_BOX.split(' ').map(Number)
const FULL_BOX = { x: FULL[0], y: FULL[1], w: FULL[2], h: FULL[3] }
const MIN_W = FULL_BOX.w * 0.035
const MAX_W = FULL_BOX.w

function clampView(v) {
  v.w = Math.min(MAX_W, Math.max(MIN_W, v.w))
  v.h = v.w * (FULL_BOX.h / FULL_BOX.w)
  v.x = Math.min(FULL_BOX.x + FULL_BOX.w - v.w, Math.max(FULL_BOX.x, v.x))
  v.y = Math.min(FULL_BOX.y + FULL_BOX.h - v.h, Math.max(FULL_BOX.y, v.y))
  return v
}

const MapView = forwardRef(function MapView({ comarcaPaths, municipis, selected, onSelect }, ref) {
  const svgRef = useRef(null)
  const holderRef = useRef(null)
  const viewRef = useRef({ ...FULL_BOX })
  const animRef = useRef(null)

  const applyView = useCallback(() => {
    const svg = svgRef.current
    if (!svg) return
    const v = viewRef.current
    svg.setAttribute('viewBox', `${v.x} ${v.y} ${v.w} ${v.h}`)
  }, [])

  const animateTo = useCallback(
    (target, duration = 650) => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
      const start = { ...viewRef.current }
      const t0 = performance.now()
      const ease = (t) => 1 - Math.pow(1 - t, 3)
      const step = (now) => {
        const t = Math.min(1, (now - t0) / duration)
        const e = ease(t)
        viewRef.current = {
          x: start.x + (target.x - start.x) * e,
          y: start.y + (target.y - start.y) * e,
          w: start.w + (target.w - start.w) * e,
          h: start.h + (target.h - start.h) * e,
        }
        applyView()
        if (t < 1) animRef.current = requestAnimationFrame(step)
      }
      animRef.current = requestAnimationFrame(step)
    },
    [applyView],
  )

  const zoomAt = useCallback(
    (factor, clientX, clientY) => {
      const svg = svgRef.current
      if (!svg) return
      const rect = svg.getBoundingClientRect()
      const v = viewRef.current
      const px = v.x + ((clientX - rect.left) / rect.width) * v.w
      const py = v.y + ((clientY - rect.top) / rect.height) * v.h
      const newW = v.w * factor
      const next = clampView({
        w: newW,
        h: newW * (FULL_BOX.h / FULL_BOX.w),
        x: px - ((px - v.x) / v.w) * newW,
        y: py - ((py - v.y) / v.h) * (newW * (FULL_BOX.h / FULL_BOX.w)),
      })
      viewRef.current = next
      applyView()
    },
    [applyView],
  )

  const zoomToBBox = useCallback(
    (bbox, pad = 0.45) => {
      const w = bbox.x1 - bbox.x0
      const h = bbox.y1 - bbox.y0
      const cx = (bbox.x0 + bbox.x1) / 2
      const cy = (bbox.y0 + bbox.y1) / 2
      let targetW = Math.max(w, h * (FULL_BOX.w / FULL_BOX.h)) * (1 + pad)
      targetW = Math.max(targetW, MIN_W * 1.4)
      const targetH = targetW * (FULL_BOX.h / FULL_BOX.w)
      animateTo(
        clampView({ x: cx - targetW / 2, y: cy - targetH / 2, w: targetW, h: targetH }),
      )
    },
    [animateTo],
  )

  useEffect(() => {
    if (selected) {
      const m = municipis.find((mu) => mu.nom === selected)
      if (m) zoomToBBox(m.bbox)
    } else {
      animateTo({ ...FULL_BOX })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected])

  // ---- pan / zoom gesture plumbing ----
  useEffect(() => {
    const holder = holderRef.current
    if (!holder) return

    let dragging = false
    let wasDrag = false
    let lastX = 0
    let lastY = 0
    const pointers = new Map()
    let pinchStartDist = 0
    let pinchStartW = 0

    const onMove = (e) => {
      if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })

      if (pointers.size === 2) {
        const pts = [...pointers.values()]
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
        if (pinchStartDist > 0) {
          const factor = pinchStartDist / dist
          const cx = (pts[0].x + pts[1].x) / 2
          const cy = (pts[0].y + pts[1].y) / 2
          const v = viewRef.current
          const newW = clampView({ ...v, w: pinchStartW * factor }).w
          const rect = svgRef.current.getBoundingClientRect()
          const px = v.x + ((cx - rect.left) / rect.width) * v.w
          const py = v.y + ((cy - rect.top) / rect.height) * v.h
          const newH = newW * (FULL_BOX.h / FULL_BOX.w)
          viewRef.current = clampView({
            w: newW,
            h: newH,
            x: px - ((px - v.x) / v.w) * newW,
            y: py - ((py - v.y) / v.h) * newH,
          })
          applyView()
        }
        return
      }

      if (!dragging) return
      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) wasDrag = true
      lastX = e.clientX
      lastY = e.clientY
      const svg = svgRef.current
      const rect = svg.getBoundingClientRect()
      const v = viewRef.current
      v.x -= (dx / rect.width) * v.w
      v.y -= (dy / rect.height) * v.h
      clampView(v)
      applyView()
    }

    const onUp = (e) => {
      pointers.delete(e.pointerId)
      if (pointers.size === 0) {
        dragging = false
        holder.classList.remove('dragging')
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
        window.removeEventListener('pointercancel', onUp)
      } else if (pointers.size === 1) {
        const [[, p]] = pointers
        dragging = true
        lastX = p.x
        lastY = p.y
        pinchStartDist = 0
      }
    }

    const onDown = (e) => {
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
      wasDrag = false
      if (pointers.size === 1) {
        dragging = true
        lastX = e.clientX
        lastY = e.clientY
        holder.classList.add('dragging')
      } else if (pointers.size === 2) {
        dragging = false
        const pts = [...pointers.values()]
        pinchStartDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
        pinchStartW = viewRef.current.w
      }
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
      window.addEventListener('pointercancel', onUp)
    }

    const onWheel = (e) => {
      e.preventDefault()
      const factor = e.deltaY > 0 ? 1.15 : 1 / 1.15
      zoomAt(factor, e.clientX, e.clientY)
    }

    holder.addEventListener('pointerdown', onDown)
    holder.addEventListener('wheel', onWheel, { passive: false })
    holder._wasDrag = () => wasDrag

    return () => {
      holder.removeEventListener('pointerdown', onDown)
      holder.removeEventListener('wheel', onWheel)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [applyView, zoomAt])

  useEffect(() => {
    applyView()
  }, [applyView])

  const handleMuniClick = (nom) => {
    if (holderRef.current?._wasDrag?.()) return
    onSelect(nom === selected ? null : nom)
  }

  useImperativeHandle(ref, () => ({
    zoomIn: () => {
      const svg = svgRef.current
      const rect = svg.getBoundingClientRect()
      zoomAt(1 / 1.4, rect.left + rect.width / 2, rect.top + rect.height / 2)
    },
    zoomOut: () => {
      const svg = svgRef.current
      const rect = svg.getBoundingClientRect()
      zoomAt(1.4, rect.left + rect.width / 2, rect.top + rect.height / 2)
    },
    reset: () => animateTo({ ...FULL_BOX }),
  }))

  return (
    <div ref={holderRef} className="map-holder">
      <svg ref={svgRef} viewBox={VIEW_BOX} preserveAspectRatio="xMidYMid meet">
        <defs>
          <radialGradient id="glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#e8c766" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#e8c766" stopOpacity="0" />
          </radialGradient>
        </defs>

        {municipis.map((m) => {
          const isSelected = m.nom === selected
          const hasClubs = m.clubs.length > 0
          const fill = hasClubs ? colorForCategory(m.clubs[0].categoria) : '#1a2c22'
          return (
            <path
              key={m.nom}
              d={m.path}
              className={`muni-shape${isSelected ? ' is-selected' : ''}${hasClubs ? ' has-clubs' : ''}`}
              style={{ '--muni-fill': fill }}
              onClick={() => handleMuniClick(m.nom)}
            >
              <title>{m.nom}</title>
            </path>
          )
        })}

        {Object.entries(comarcaPaths).map(([nom, d]) => (
          <path key={nom} d={d} className="comarca-outline" />
        ))}

        {selected &&
          (() => {
            const m = municipis.find((mu) => mu.nom === selected)
            if (!m) return null
            const cx = (m.bbox.x0 + m.bbox.x1) / 2
            const cy = (m.bbox.y0 + m.bbox.y1) / 2
            const r = Math.max(m.bbox.x1 - m.bbox.x0, m.bbox.y1 - m.bbox.y0) * 1.8
            return <circle cx={cx} cy={cy} r={r} fill="url(#glow)" className="selection-glow" />
          })()}

        {selected &&
          (() => {
            const m = municipis.find((mu) => mu.nom === selected)
            if (!m || !m.camps.length) return null
            return (
              <g className="camp-pins">
                {m.camps.map((camp, i) => (
                  <g key={i} className="camp-pin" transform={`translate(${camp.x} ${camp.y})`}>
                    <circle r="2.4" className="camp-pin-halo" />
                    <circle r="1.1" className="camp-pin-dot" />
                    <title>
                      {(camp.nom ? camp.nom + ' — ' : '') + camp.clubs.map((c) => c.nom).join(' i ')}
                    </title>
                  </g>
                ))}
              </g>
            )
          })()}
      </svg>
    </div>
  )
})

export default MapView
