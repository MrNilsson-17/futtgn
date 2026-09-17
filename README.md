# Futbol Tarragona — mapa de clubs per municipi

Projecte per mostrar, en un mapa cartogràfic real de la demarcació de
Tarragona, quins clubs de futbol d'11 juga cada municipi (des de 1a
divisió fins a 4a catalana), sense equips filials.

Aquest repo comença només amb la **base de dades**. El frontend (el
mapa interactiu) s'hi connectarà en el següent pas.

## Estructura

```
db/
  schema.sql   -- taules: comarques, municipis, clubs, club_temporades
  seed.sql     -- dades reals ja recopilades (geometries + 65 clubs)
frontend/      -- (buit per ara — pròxim pas)
```

## Posar la base de dades en marxa (Supabase, gratuït)

1. Crea un compte a [supabase.com](https://supabase.com) i un projecte nou.
2. Ves a **SQL Editor → New query**, enganxa el contingut de
   `db/schema.sql` i executa'l.
3. Fes el mateix amb `db/seed.sql` (és gran, ~400KB — pot trigar uns
   segons).
4. Comprova-ho: **Table Editor** hauria de mostrar 10 comarques, 184
   municipis i 65 clubs.
5. Ves a **Project Settings → API** i copia:
   - `Project URL`
   - `anon public` key

Guarda aquests dos valors — els necessitarem per connectar el
frontend al següent pas.

## Model de dades

- Una comarca té molts municipis.
- Un municipi té 0, 1 o més clubs (mai equips "B"/filials — es
  filtren expressament).
- Un club té una fila a `club_temporades` per cada temporada, amb la
  seva categoria i si està **confirmada** amb font (BeSoccer/FCF) o
  no. Això permet guardar l'històric i actualitzar any rere any sense
  perdre les dades anteriors.
- `v_municipis_clubs` és una vista que ja retorna, per a cada
  municipi, el seu club i la categoria més recent — és la que farà
  servir el frontend.

## Estat de les dades

- **Reus**: temporada 2026-27, verificat (BeSoccer).
- **Resta de municipis amb club**: majoritàriament temporada 2024-25
  (BeSoccer/FCF), pendents d'actualitzar temporada a temporada.
- Molts municipis petits encara no tenen cap club a la base de
  dades — es poden anar afegint amb un `insert` a `clubs` +
  `club_temporades`.

## Següents passos

1. Desplegar aquest schema+seed a Supabase (aquest document).
2. Adaptar `frontend/index.html` perquè faci `fetch` a la vista
   `v_municipis_clubs` de Supabase en lloc de portar les dades
   incrustades.
3. Desplegar el frontend a Vercel/Netlify.
4. (Opcional) Automatitzar l'actualització de categories temporada
   rere temporada.
