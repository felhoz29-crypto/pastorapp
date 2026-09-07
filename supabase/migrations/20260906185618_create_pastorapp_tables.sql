/*
# PASTORAPP - Complete Database Schema (Part 1: Tables)

## Overview
Multi-tenant SaaS app for church pastors in Colombia. Each pastor creates their church
(iglesia) and only sees data scoped to their iglesia_id.

## New Tables
1. iglesias - Churches. created_by = auth.uid().
2. usuarios - App users. id = auth.uid(), linked to iglesia.
3. miembros - Church members.
4. transacciones - Financial transactions.
5. asistencias - Attendance records.
6. seguimientos - Pastoral follow-ups.
*/

-- ============================================================
-- TABLE: iglesias
-- ============================================================
CREATE TABLE IF NOT EXISTS public.iglesias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  pastor_nombre text NOT NULL DEFAULT '',
  ciudad text NOT NULL DEFAULT '',
  plan text NOT NULL DEFAULT 'trial',
  fecha_vencimiento date,
  logo_url text,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: usuarios
-- ============================================================
CREATE TABLE IF NOT EXISTS public.usuarios (
  id uuid PRIMARY KEY DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  iglesia_id uuid NOT NULL REFERENCES public.iglesias(id) ON DELETE CASCADE,
  rol text NOT NULL DEFAULT 'pastor' CHECK (rol IN ('pastor', 'tesorero', 'lider')),
  nombre text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: miembros
-- ============================================================
CREATE TABLE IF NOT EXISTS public.miembros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  iglesia_id uuid NOT NULL REFERENCES public.iglesias(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  celular text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  fecha_nacimiento date,
  direccion text NOT NULL DEFAULT '',
  estado text NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
  bautizado boolean NOT NULL DEFAULT false,
  nivel_discipulado smallint NOT NULL DEFAULT 1 CHECK (nivel_discipulado IN (1, 2, 3)),
  celula text NOT NULL DEFAULT '',
  lider_id uuid REFERENCES public.miembros(id) ON DELETE SET NULL,
  foto_url text,
  total_aportado numeric(12, 2) NOT NULL DEFAULT 0,
  fecha_ultima_asistencia date,
  qr_code text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_miembros_iglesia ON public.miembros(iglesia_id);
CREATE INDEX IF NOT EXISTS idx_miembros_qr ON public.miembros(qr_code);

-- ============================================================
-- TABLE: transacciones
-- ============================================================
CREATE TABLE IF NOT EXISTS public.transacciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  iglesia_id uuid NOT NULL REFERENCES public.iglesias(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('ingreso', 'gasto')),
  categoria text NOT NULL DEFAULT 'Diezmo',
  monto numeric(12, 2) NOT NULL DEFAULT 0,
  miembro_id uuid REFERENCES public.miembros(id) ON DELETE SET NULL,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  forma_pago text NOT NULL DEFAULT 'Efectivo' CHECK (forma_pago IN ('Efectivo', 'Nequi', 'Transferencia')),
  comprobante_url text,
  observacion text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transacciones_iglesia ON public.transacciones(iglesia_id);
CREATE INDEX IF NOT EXISTS idx_transacciones_fecha ON public.transacciones(fecha);

-- ============================================================
-- TABLE: asistencias
-- ============================================================
CREATE TABLE IF NOT EXISTS public.asistencias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  iglesia_id uuid NOT NULL REFERENCES public.iglesias(id) ON DELETE CASCADE,
  fecha_servicio date NOT NULL DEFAULT CURRENT_DATE,
  tipo_servicio text NOT NULL DEFAULT 'Domingo AM',
  miembros_presentes uuid[] NOT NULL DEFAULT '{}',
  total integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_asistencias_iglesia ON public.asistencias(iglesia_id);
CREATE INDEX IF NOT EXISTS idx_asistencias_fecha ON public.asistencias(fecha_servicio);

-- ============================================================
-- TABLE: seguimientos
-- ============================================================
CREATE TABLE IF NOT EXISTS public.seguimientos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  iglesia_id uuid NOT NULL REFERENCES public.iglesias(id) ON DELETE CASCADE,
  miembro_id uuid NOT NULL REFERENCES public.miembros(id) ON DELETE CASCADE,
  tipo text NOT NULL DEFAULT 'Visita' CHECK (tipo IN ('Visita', 'Llamada', 'Oracion')),
  nota text NOT NULL DEFAULT '',
  fecha timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seguimientos_iglesia ON public.seguimientos(iglesia_id);
CREATE INDEX IF NOT EXISTS idx_seguimientos_miembro ON public.seguimientos(miembro_id);

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true), ('comprobantes', 'comprobantes', true)
ON CONFLICT (id) DO NOTHING;
