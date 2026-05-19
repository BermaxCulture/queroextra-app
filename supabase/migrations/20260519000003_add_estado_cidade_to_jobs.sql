alter table jobs
  add column if not exists estado text,
  add column if not exists cidade text;

comment on column jobs.estado is 'Estado (UF) onde a vaga será realizada.';
comment on column jobs.cidade is 'Cidade onde a vaga será realizada.';
