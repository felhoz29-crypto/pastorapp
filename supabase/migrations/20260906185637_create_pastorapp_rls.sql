/*
# PASTORAPP - RLS Policies & Helper Function (Part 2)

## Security
- RLS enabled on ALL tables.
- SECURITY DEFINER function get_user_iglesia_id() returns the caller's iglesia_id.
- All data tables scoped by iglesia_id matching the caller's iglesia.
- iglesias: creator (created_by = auth.uid()) has full CRUD.
- usuarios: self-registration for INSERT; pastor manages users in same iglesia.
- Storage policies for logos and comprobantes buckets.
*/

-- ============================================================
-- HELPER FUNCTION: get_user_iglesia_id
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_user_iglesia_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT iglesia_id FROM public.usuarios WHERE id = auth.uid();
$$;

-- ============================================================
-- RLS: iglesias
-- ============================================================
ALTER TABLE public.iglesias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_iglesia" ON public.iglesias;
CREATE POLICY "select_own_iglesia" ON public.iglesias
  FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR id = public.get_user_iglesia_id()
  );

DROP POLICY IF EXISTS "insert_own_iglesia" ON public.iglesias;
CREATE POLICY "insert_own_iglesia" ON public.iglesias
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "update_own_iglesia" ON public.iglesias;
CREATE POLICY "update_own_iglesia" ON public.iglesias
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "delete_own_iglesia" ON public.iglesias;
CREATE POLICY "delete_own_iglesia" ON public.iglesias
  FOR DELETE TO authenticated
  USING (created_by = auth.uid());

-- ============================================================
-- RLS: usuarios
-- ============================================================
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_usuarios" ON public.usuarios;
CREATE POLICY "select_usuarios" ON public.usuarios
  FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR iglesia_id = public.get_user_iglesia_id()
  );

DROP POLICY IF EXISTS "insert_usuarios" ON public.usuarios;
CREATE POLICY "insert_usuarios" ON public.usuarios
  FOR INSERT TO authenticated
  WITH CHECK (
    id = auth.uid()
    OR iglesia_id = public.get_user_iglesia_id()
  );

DROP POLICY IF EXISTS "update_usuarios" ON public.usuarios;
CREATE POLICY "update_usuarios" ON public.usuarios
  FOR UPDATE TO authenticated
  USING (
    id = auth.uid()
    OR iglesia_id = public.get_user_iglesia_id()
  )
  WITH CHECK (
    id = auth.uid()
    OR iglesia_id = public.get_user_iglesia_id()
  );

DROP POLICY IF EXISTS "delete_usuarios" ON public.usuarios;
CREATE POLICY "delete_usuarios" ON public.usuarios
  FOR DELETE TO authenticated
  USING (iglesia_id = public.get_user_iglesia_id());

-- ============================================================
-- RLS: miembros
-- ============================================================
ALTER TABLE public.miembros ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_miembros" ON public.miembros;
CREATE POLICY "select_miembros" ON public.miembros
  FOR SELECT TO authenticated
  USING (iglesia_id = public.get_user_iglesia_id());

DROP POLICY IF EXISTS "insert_miembros" ON public.miembros;
CREATE POLICY "insert_miembros" ON public.miembros
  FOR INSERT TO authenticated
  WITH CHECK (iglesia_id = public.get_user_iglesia_id());

DROP POLICY IF EXISTS "update_miembros" ON public.miembros;
CREATE POLICY "update_miembros" ON public.miembros
  FOR UPDATE TO authenticated
  USING (iglesia_id = public.get_user_iglesia_id())
  WITH CHECK (iglesia_id = public.get_user_iglesia_id());

DROP POLICY IF EXISTS "delete_miembros" ON public.miembros;
CREATE POLICY "delete_miembros" ON public.miembros
  FOR DELETE TO authenticated
  USING (iglesia_id = public.get_user_iglesia_id());

-- ============================================================
-- RLS: transacciones
-- ============================================================
ALTER TABLE public.transacciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_transacciones" ON public.transacciones;
CREATE POLICY "select_transacciones" ON public.transacciones
  FOR SELECT TO authenticated
  USING (iglesia_id = public.get_user_iglesia_id());

DROP POLICY IF EXISTS "insert_transacciones" ON public.transacciones;
CREATE POLICY "insert_transacciones" ON public.transacciones
  FOR INSERT TO authenticated
  WITH CHECK (iglesia_id = public.get_user_iglesia_id());

DROP POLICY IF EXISTS "update_transacciones" ON public.transacciones;
CREATE POLICY "update_transacciones" ON public.transacciones
  FOR UPDATE TO authenticated
  USING (iglesia_id = public.get_user_iglesia_id())
  WITH CHECK (iglesia_id = public.get_user_iglesia_id());

DROP POLICY IF EXISTS "delete_transacciones" ON public.transacciones;
CREATE POLICY "delete_transacciones" ON public.transacciones
  FOR DELETE TO authenticated
  USING (iglesia_id = public.get_user_iglesia_id());

-- ============================================================
-- RLS: asistencias
-- ============================================================
ALTER TABLE public.asistencias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_asistencias" ON public.asistencias;
CREATE POLICY "select_asistencias" ON public.asistencias
  FOR SELECT TO authenticated
  USING (iglesia_id = public.get_user_iglesia_id());

DROP POLICY IF EXISTS "insert_asistencias" ON public.asistencias;
CREATE POLICY "insert_asistencias" ON public.asistencias
  FOR INSERT TO authenticated
  WITH CHECK (iglesia_id = public.get_user_iglesia_id());

DROP POLICY IF EXISTS "update_asistencias" ON public.asistencias;
CREATE POLICY "update_asistencias" ON public.asistencias
  FOR UPDATE TO authenticated
  USING (iglesia_id = public.get_user_iglesia_id())
  WITH CHECK (iglesia_id = public.get_user_iglesia_id());

DROP POLICY IF EXISTS "delete_asistencias" ON public.asistencias;
CREATE POLICY "delete_asistencias" ON public.asistencias
  FOR DELETE TO authenticated
  USING (iglesia_id = public.get_user_iglesia_id());

-- ============================================================
-- RLS: seguimientos
-- ============================================================
ALTER TABLE public.seguimientos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_seguimientos" ON public.seguimientos;
CREATE POLICY "select_seguimientos" ON public.seguimientos
  FOR SELECT TO authenticated
  USING (iglesia_id = public.get_user_iglesia_id());

DROP POLICY IF EXISTS "insert_seguimientos" ON public.seguimientos;
CREATE POLICY "insert_seguimientos" ON public.seguimientos
  FOR INSERT TO authenticated
  WITH CHECK (iglesia_id = public.get_user_iglesia_id());

DROP POLICY IF EXISTS "update_seguimientos" ON public.seguimientos;
CREATE POLICY "update_seguimientos" ON public.seguimientos
  FOR UPDATE TO authenticated
  USING (iglesia_id = public.get_user_iglesia_id())
  WITH CHECK (iglesia_id = public.get_user_iglesia_id());

DROP POLICY IF EXISTS "delete_seguimientos" ON public.seguimientos;
CREATE POLICY "delete_seguimientos" ON public.seguimientos
  FOR DELETE TO authenticated
  USING (iglesia_id = public.get_user_iglesia_id());

-- ============================================================
-- STORAGE POLICIES
-- ============================================================
DROP POLICY IF EXISTS "upload_logos" ON storage.objects;
CREATE POLICY "upload_logos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'logos');

DROP POLICY IF EXISTS "read_logos" ON storage.objects;
CREATE POLICY "read_logos" ON storage.objects
  FOR SELECT USING (bucket_id = 'logos');

DROP POLICY IF EXISTS "update_logos" ON storage.objects;
CREATE POLICY "update_logos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'logos')
  WITH CHECK (bucket_id = 'logos');

DROP POLICY IF EXISTS "delete_logos" ON storage.objects;
CREATE POLICY "delete_logos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'logos');

DROP POLICY IF EXISTS "upload_comprobantes" ON storage.objects;
CREATE POLICY "upload_comprobantes" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'comprobantes');

DROP POLICY IF EXISTS "read_comprobantes" ON storage.objects;
CREATE POLICY "read_comprobantes" ON storage.objects
  FOR SELECT USING (bucket_id = 'comprobantes');

DROP POLICY IF EXISTS "update_comprobantes" ON storage.objects;
CREATE POLICY "update_comprobantes" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'comprobantes')
  WITH CHECK (bucket_id = 'comprobantes');

DROP POLICY IF EXISTS "delete_comprobantes" ON storage.objects;
CREATE POLICY "delete_comprobantes" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'comprobantes');
