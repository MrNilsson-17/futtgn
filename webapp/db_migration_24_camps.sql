-- Migració 24: afegeix la ubicació del camp (dins del mapa SVG) per als clubs
-- de municipis amb més d'un equip. Pensat per anar-se omplint municipi a
-- municipi (bloc a bloc). Un mateix camp_x/camp_y el poden compartir diversos
-- clubs si juguen al mateix estadi (p. ex. Mas Iglesias / Mas Pellicer a Reus).

alter table clubs add column if not exists camp_nom text;
alter table clubs add column if not exists camp_x numeric;
alter table clubs add column if not exists camp_y numeric;

-- Calafell: dos camps clarament diferenciats (centre i barri de Segur)
update clubs set
  camp_nom = 'Camp Municipal de Calafell',
  camp_x = 746.92,
  camp_y = 277.77
where nom = 'CF Calafell';

update clubs set
  camp_nom = 'Camp Municipal de Segur de Calafell',
  camp_x = 763.50,
  camp_y = 267.13
where nom = 'Athletic Segur CF';

-- Cal afegir les columnes noves a la vista (sempre al FINAL del select,
-- si no Postgres dona l'error 42P16 de "cannot change name of view column")
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
  ct.confirmat,
  cl.crest_url    as crest_url,
  cl.camp_nom     as camp_nom,
  cl.camp_x       as camp_x,
  cl.camp_y       as camp_y
from municipis m
join comarques c on c.id = m.comarca_id
left join clubs cl on cl.municipi_id = m.id
left join club_temporades ct on ct.club_id = cl.id
  and ct.temporada = (
    select temporada from club_temporades ct2
    where ct2.club_id = cl.id
    order by temporada desc limit 1
  );
