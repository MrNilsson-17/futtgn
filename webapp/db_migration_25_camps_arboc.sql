-- Migració 25: camps de L'Arboç

update clubs set
  camp_nom = 'Camp Municipal de l''Arboç',
  camp_x = 751.46,
  camp_y = 225.40
where nom = 'CF l''Arboç';

update clubs set
  camp_nom = 'Escola Camp Joliu',
  camp_x = 762.61,
  camp_y = 208.92
where nom = 'NSA Camp Joliu';
