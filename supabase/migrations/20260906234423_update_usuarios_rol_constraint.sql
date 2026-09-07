/*
# Update usuarios rol constraint to include admin and super_admin

## Changes
- Drops the existing `usuarios_rol_check` constraint that only allowed 'pastor', 'tesorero', 'lider'.
- Adds a new constraint that also allows 'admin' and 'super_admin'.
*/

ALTER TABLE public.usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check;

ALTER TABLE public.usuarios ADD CONSTRAINT usuarios_rol_check
  CHECK (rol IN ('pastor', 'tesorero', 'lider', 'admin', 'super_admin'));
