-- Esquema per al mapa de futbol de la demarcació de Tarragona
-- Pensat per a Supabase (Postgres). Executa'l a: Supabase > SQL Editor > New query

create extension if not exists "pgcrypto";

-- 1. Comarques -------------------------------------------------
create table comarques (
  id           serial primary key,
  nom          text not null unique,
  path_svg     text not null,   -- contorn de la comarca (viewBox compartit amb municipis)
  centroid_x   numeric,
  centroid_y   numeric
);

-- 2. Municipis ----------------------------------------------------
create table municipis (
  id           serial primary key,
  nom          text not null,
  comarca_id   integer not null references comarques(id) on delete cascade,
  path_svg     text not null,   -- contorn real del municipi (mateix sistema de coordenades)
  bbox_x0      numeric not null,
  bbox_y0      numeric not null,
  bbox_x1      numeric not null,
  bbox_y1      numeric not null,
  unique (nom, comarca_id)
);
create index idx_municipis_comarca on municipis(comarca_id);

-- 3. Clubs (identitat del club, no canvia any a any) ---------------
create table clubs (
  id           serial primary key,
  nom          text not null,
  municipi_id  integer not null references municipis(id) on delete cascade,
  font         text,            -- d'on ve la dada (besoccer, fcf, etc.)
  creat_el     timestamptz default now()
);
create index idx_clubs_municipi on clubs(municipi_id);

-- 4. Categoria del club per temporada (historial) -------------------
create table club_temporades (
  id           serial primary key,
  club_id      integer not null references clubs(id) on delete cascade,
  temporada    text not null,      -- ex: '2026-27'
  categoria    text not null,      -- ex: 'Segona Federació — Grup 2'
  confirmat    boolean default false,
  actualitzat_el timestamptz default now(),
  unique (club_id, temporada)
);
create index idx_ct_temporada on club_temporades(temporada);

-- ---- Vista còmoda per consultar tot d'un cop (la fa servir el frontend) ----
create or replace view v_municipis_clubs as
select
  m.id            as municipi_id,
  m.nom           as municipi,
  c.nom           as comarca,
  m.path_svg      as municipi_path,
  m.bbox_x0, m.bbox_y0, m.bbox_x1, m.bbox_y1,
  cl.id           as club_id,
  cl.nom          as club_nom,
  ct.temporada,
  ct.categoria,
  ct.confirmat
from municipis m
join comarques c on c.id = m.comarca_id
left join clubs cl on cl.municipi_id = m.id
left join club_temporades ct on ct.club_id = cl.id
  and ct.temporada = (
    select temporada from club_temporades ct2
    where ct2.club_id = cl.id
    order by temporada desc limit 1
  );

-- ---- Accés públic de només lectura (per al frontend estàtic) ----
alter table comarques enable row level security;
alter table municipis enable row level security;
alter table clubs enable row level security;
alter table club_temporades enable row level security;

create policy "lectura publica comarques" on comarques for select using (true);
create policy "lectura publica municipis" on municipis for select using (true);
create policy "lectura publica clubs" on clubs for select using (true);
create policy "lectura publica club_temporades" on club_temporades for select using (true);
