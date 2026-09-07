export interface Iglesia {
  id: string;
  nombre: string;
  pastor_nombre: string;
  ciudad: string;
  plan: 'trial' | 'activo';
  fecha_vencimiento: string | null;
  logo_url: string | null;
  created_by: string;
  created_at: string;
}

export interface Usuario {
  id: string;
  email: string;
  iglesia_id: string;
  rol: 'pastor' | 'tesorero' | 'lider' | 'admin' | 'super_admin';
  nombre: string;
  created_at: string;
}

export interface Miembro {
  id: string;
  iglesia_id: string;
  nombre: string;
  celular: string;
  email: string;
  fecha_nacimiento: string | null;
  direccion: string;
  estado: 'activo' | 'inactivo';
  bautizado: boolean;
  nivel_discipulado: 1 | 2 | 3;
  celula: string;
  lider_id: string | null;
  foto_url: string | null;
  total_aportado: number;
  fecha_ultima_asistencia: string | null;
  qr_code: string | null;
  created_at: string;
}

export interface Transaccion {
  id: string;
  iglesia_id: string;
  tipo: 'ingreso' | 'gasto';
  categoria: string;
  monto: number;
  miembro_id: string | null;
  fecha: string;
  forma_pago: 'Efectivo' | 'Nequi' | 'Transferencia';
  comprobante_url: string | null;
  observacion: string;
  created_at: string;
}

export interface Asistencia {
  id: string;
  iglesia_id: string;
  fecha_servicio: string;
  tipo_servicio: string;
  miembros_presentes: string[];
  total: number;
  created_at: string;
}

export interface Seguimiento {
  id: string;
  iglesia_id: string;
  miembro_id: string;
  tipo: 'Visita' | 'Llamada' | 'Oracion';
  nota: string;
  fecha: string;
}

export type Screen =
  | 'dashboard'
  | 'registrar-ingreso'
  | 'registrar-gasto'
  | 'transacciones'
  | 'miembros'
  | 'nuevo-miembro'
  | 'ficha-miembro'
  | 'asistencia'
  | 'informe';
