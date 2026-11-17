# CareLane
Walk-in patient queue for hospitals. React + Vite frontend, Supabase (Postgres, Auth, Realtime) backend.

## Setup
1. Create a Supabase project, then run `supabase/schema.sql` in the SQL Editor.
2. Copy `.env.example` to `.env` and fill in your project URL and anon key.
3. `npm install && npm run dev`
4. Sign up in the app, then run the demo-data lines at the bottom of `schema.sql` to link your account to a hospital.

## Design notes
- Normalised tables: hospitals, profiles, doctors, patients, visits (enums for role, priority, status).
- Row Level Security: staff only see and change their own hospital's data; roles limit who can add patients or manage doctors.
- `call_in` and `complete_visit` are database functions, so doctor assignment is atomic and two people can't grab the same doctor.
- Realtime subscriptions keep every screen's queue in sync.
