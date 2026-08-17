-- Permite que o Freelancer atualize suas próprias candidaturas (ex: para cancelar)
create policy "applications: atualização pelo freelancer"
  on applications for update
  using (
    exists (
      select 1 from freelancers f
      where f.id = applications.freelancer_id
        and f.profile_id = auth.uid()
    )
  );

-- Permite que a empresa dona da vaga atualize as candidaturas vinculadas a ela (ex: aprovar/recusar)
create policy "applications: atualização pela empresa"
  on applications for update
  using (
    exists (
      select 1 from jobs j
      join companies c on c.id = j.company_id
      where j.id = applications.job_id
        and c.profile_id = auth.uid()
    )
  );
