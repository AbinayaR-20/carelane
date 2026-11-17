-- CareLane schema. Run once in Supabase > SQL Editor.
create type role_t     as enum ('admin','frontdesk','doctor');
create type priority_t as enum ('critical','urgent','standard');
create type status_t   as enum ('waiting','in_consult','done');

create table hospitals (id uuid primary key default gen_random_uuid(), name text not null);

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  role role_t not null default 'frontdesk',
  hospital_id uuid references hospitals
);

create table doctors (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references hospitals,
  name text not null, specialty text,
  available boolean not null default true
);

create table patients (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references hospitals,
  name text not null,
  age int check (age between 0 and 120),
  created_at timestamptz not null default now()
);

create table visits (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references hospitals,
  patient_id uuid not null references patients on delete cascade,
  doctor_id uuid references doctors,
  complaint text not null default 'Not given',
  priority priority_t not null default 'standard',
  status status_t not null default 'waiting',
  arrived_at timestamptz not null default now(),
  started_at timestamptz, completed_at timestamptz
);
create index visits_queue_idx on visits (hospital_id, status, priority, arrived_at);

-- Helpers used by the security policies
create function my_hospital() returns uuid language sql stable security definer set search_path = public
as $$ select hospital_id from profiles where id = auth.uid() $$;
create function my_role() returns role_t language sql stable security definer set search_path = public
as $$ select role from profiles where id = auth.uid() $$;

-- Every new sign-up gets a profile (no hospital until an admin links them)
create function handle_new_user() returns trigger language plpgsql security definer set search_path = public
as $$ begin
  insert into profiles (id, full_name) values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- Row Level Security: staff only see and change their own hospital's data
alter table hospitals enable row level security;
alter table profiles  enable row level security;
alter table doctors   enable row level security;
alter table patients  enable row level security;
alter table visits    enable row level security;

create policy "own profile"   on profiles  for select using (id = auth.uid());
create policy "own hospital"  on hospitals for select using (id = my_hospital());
create policy "read doctors"  on doctors   for select using (hospital_id = my_hospital());
create policy "admin doctors" on doctors   for all    using (hospital_id = my_hospital() and my_role() = 'admin')
                                                      with check (hospital_id = my_hospital());
create policy "read patients" on patients  for select using (hospital_id = my_hospital());
create policy "add patients"  on patients  for insert with check (hospital_id = my_hospital() and my_role() in ('admin','frontdesk'));
create policy "read visits"   on visits    for select using (hospital_id = my_hospital());
create policy "add visits"    on visits    for insert with check (hospital_id = my_hospital() and my_role() in ('admin','frontdesk'));

-- Queue actions as database functions so two people can't grab the same doctor
create function call_in(p_visit uuid) returns void language plpgsql security definer set search_path = public
as $$ declare d uuid; begin
  if my_role() not in ('admin','frontdesk') then raise exception 'Not allowed'; end if;
  select id into d from doctors where hospital_id = my_hospital() and available order by name limit 1 for update skip locked;
  if d is null then raise exception 'No doctor is free'; end if;
  update doctors set available = false where id = d;
  update visits set status = 'in_consult', doctor_id = d, started_at = now()
    where id = p_visit and hospital_id = my_hospital() and status = 'waiting';
end $$;

create function complete_visit(p_visit uuid) returns void language plpgsql security definer set search_path = public
as $$ begin
  update doctors set available = true
    where id = (select doctor_id from visits where id = p_visit and hospital_id = my_hospital());
  update visits set status = 'done', completed_at = now() where id = p_visit and hospital_id = my_hospital();
end $$;

alter publication supabase_realtime add table visits, doctors;

-- Demo data, then link YOUR account (after you sign up in the app):
--   insert into hospitals (name) values ('City General') returning id;
--   insert into doctors (hospital_id, name, specialty) values ('<id>','Dr. Rao','General'),('<id>','Dr. Meena','Emergency');
--   update profiles set hospital_id = '<id>', role = 'admin' where id = (select id from auth.users where email = 'you@example.com');
