-- 0003 — Milestone 3: Breeding & reproduction (docs/decisions/0007 Module 3)

create type breeding_event_type as enum
  ('heat', 'service', 'pregnancy_check', 'calving', 'dry_off', 'abortion');
create type breeding_method as enum ('ai', 'natural');
create type pd_result as enum ('positive', 'negative', 'unknown');

-- Buffalo gestation ≈ 310 days.
create table breeding_events (
  id                     uuid primary key default gen_random_uuid(),
  animal_id              uuid not null references animals (id) on delete cascade,
  event_type             breeding_event_type not null,
  event_date             date not null default current_date,
  method                 breeding_method,
  sire_ref               text,
  pd_result              pd_result,
  expected_calving_date  date,
  calf_animal_id         uuid references animals (id),
  notes                  text,
  created_at             timestamptz not null default now()
);
create index breeding_events_animal_idx on breeding_events (animal_id);
create index breeding_events_date_idx on breeding_events (event_date);
create index breeding_events_calving_idx on breeding_events (expected_calving_date);

-- fill expected_calving_date for a service when the caller didn't
create or replace function breeding_set_expected()
returns trigger
language plpgsql
as $$
begin
  if new.event_type = 'service' and new.expected_calving_date is null then
    new.expected_calving_date := new.event_date + 310;
  end if;
  return new;
end $$;

create trigger breeding_events_expected
  before insert on breeding_events
  for each row execute function breeding_set_expected();

-- keep the dam's status / lactation in step with the reproduction event
create or replace function breeding_apply()
returns trigger
language plpgsql
as $$
begin
  if new.event_type = 'pregnancy_check' and new.pd_result = 'positive' then
    update animals set status = 'pregnant' where id = new.animal_id;
  elsif new.event_type = 'calving' then
    update animals
      set lactation_number = coalesce(lactation_number, 0) + 1,
          status = 'milking'
      where id = new.animal_id;
  elsif new.event_type = 'dry_off' then
    update animals set status = 'dry' where id = new.animal_id;
  elsif new.event_type = 'abortion' then
    update animals set status = 'milking' where id = new.animal_id
      and status = 'pregnant';
  end if;
  return new;
end $$;

create trigger breeding_events_apply
  after insert on breeding_events
  for each row execute function breeding_apply();

alter table breeding_events enable row level security;
create policy breeding_events_owner on breeding_events
  for all using (is_owner()) with check (is_owner());
