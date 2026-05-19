alter table jobs add column if not exists beneficios text;
comment on column jobs.beneficios is 'Benefícios opcionais oferecidos pela empresa para a vaga.';
