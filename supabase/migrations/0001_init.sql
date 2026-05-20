alter table prospects enable row level security;

create policy "agence voit ses prospects"
on prospects
for select
to authenticated
using (
  agence_id = (
    select agence_id from users where id = auth.uid()
  )
);

create policy "agence modifie ses prospects"
on prospects
for update
to authenticated
using (
  agence_id = (
    select agence_id from users where id = auth.uid()
  )
)
with check (
  agence_id = (
    select agence_id from users where id = auth.uid()
  )
);