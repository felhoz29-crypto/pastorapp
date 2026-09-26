/*
# Add sociedad to miembros, predicador and titulo_mensaje to asistencias

1. Modified Tables
- miembros: Add `sociedad` column (text, NOT NULL, DEFAULT 'Caballero') with CHECK constraint
  restricting to 'Caballero', 'Dama', 'Joven', 'Niños'. Used to segment membership
  by society group in reports and dashboards.
- asistencias: Add `predicador` (text, DEFAULT '') and `titulo_mensaje` (text, DEFAULT '')
  columns. These capture who preached and the message title for each service, displayed
  in attendance reports.
2. Security
- No RLS policy changes needed. Existing policies on both tables already cover
  the new columns since column-level access is governed by table-level policies.
*/

ALTER TABLE public.miembros
  ADD COLUMN IF NOT EXISTS sociedad text NOT NULL DEFAULT 'Caballero'
  CHECK (sociedad IN ('Caballero', 'Dama', 'Joven', 'Niños'));

ALTER TABLE public.asistencias
  ADD COLUMN IF NOT EXISTS predicador text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS titulo_mensaje text NOT NULL DEFAULT '';