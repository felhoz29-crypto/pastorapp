import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Miembro, Seguimiento, Asistencia, Screen } from '@/types';
import QRCode from 'qrcode';
import {
  ArrowLeft, Phone, MessageCircle, QrCode, MapPin, Calendar,
  Droplet, GraduationCap, Home, Wallet, Clock, Plus, X, Loader2, NotebookPen,
} from 'lucide-react';

interface Props {
  onNavigate: (s: Screen) => void;
  miembroId: string;
}

export default function FichaMiembro({ onNavigate, miembroId }: Props) {
  const { iglesia } = useAuth();
  const [miembro, setMiembro] = useState<Miembro | null>(null);
  const [seguimientos, setSeguimientos] = useState<Seguimiento[]>([]);
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [showNota, setShowNota] = useState(false);
  const [notaTipo, setNotaTipo] = useState<'Visita' | 'Llamada' | 'Oracion'>('Visita');
  const [notaTexto, setNotaTexto] = useState('');
  const [savingNota, setSavingNota] = useState(false);
  const qrRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!iglesia) return;
    (async () => {
      const [miembroRes, segRes, asisRes] = await Promise.all([
        supabase.from('miembros').select('*').eq('id', miembroId).maybeSingle(),
        supabase.from('seguimientos').select('*').eq('miembro_id', miembroId).order('fecha', { ascending: false }),
        supabase.from('asistencias').select('*').eq('iglesia_id', iglesia.id).order('fecha_servicio', { ascending: false }).limit(50),
      ]);

      setMiembro(miembroRes.data as Miembro | null);
      setSeguimientos((segRes.data || []) as Seguimiento[]);

      const miembroAsistencias = (asisRes.data || []).filter(
        (a: Asistencia) => a.miembros_presentes.includes(miembroId)
      );
      setAsistencias(miembroAsistencias);
      setLoading(false);
    })();
  }, [iglesia, miembroId]);

  const generateQR = async () => {
    if (!miembro) return;
    let code = miembro.qr_code;
    if (!code) {
      code = `PASTORAPP-${iglesia!.id.slice(0, 8)}-${miembro.id.slice(0, 8)}`;
      await supabase.from('miembros').update({ qr_code: code }).eq('id', miembro.id);
      setMiembro({ ...miembro, qr_code: code });
    }
    const dataUrl = await QRCode.toDataURL(code, { width: 256, margin: 1 });
    setQrDataUrl(dataUrl);
    setShowQR(true);
  };

  const handleSaveNota = async () => {
    if (!iglesia || !miembro || !notaTexto.trim()) return;
    setSavingNota(true);
    const { data, error } = await supabase
      .from('seguimientos')
      .insert({
        iglesia_id: iglesia.id,
        miembro_id: miembro.id,
        tipo: notaTipo,
        nota: notaTexto,
      })
      .select()
      .single();

    if (!error && data) {
      setSeguimientos([data as Seguimiento, ...seguimientos]);
      setNotaTexto('');
      setShowNota(false);
    }
    setSavingNota(false);
  };

  // Attendance chart data - last 6 months
  const monthlyAttendance = () => {
    const months: { label: string; count: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = d.toLocaleDateString('es-CO', { month: 'short' });
      const count = asistencias.filter((a) => {
        const fa = new Date(a.fecha_servicio);
        return fa.getMonth() === d.getMonth() && fa.getFullYear() === d.getFullYear();
      }).length;
      months.push({ label: monthName, count });
    }
    return months;
  };

  const chartData = monthlyAttendance();
  const maxCount = Math.max(...chartData.map((d) => d.count), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#1E3A8A]" />
      </div>
    );
  }

  if (!miembro) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-400">Miembro no encontrado</p>
        <button onClick={() => onNavigate('miembros')} className="mt-4 text-[#1E3A8A] font-medium text-sm">
          Volver a Miembros
        </button>
      </div>
    );
  }

  const phoneDigits = miembro.celular.replace(/\D/g, '');

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <button
        onClick={() => onNavigate('miembros')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="w-4 h-4" /> Volver a Miembros
      </button>

      {/* Profile Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#1E3A8A] flex items-center justify-center text-white text-2xl font-bold shrink-0">
            {miembro.nombre.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-900 truncate">{miembro.nombre}</h1>
            {miembro.celular && (
              <a href={`tel:+57${phoneDigits}`} className="text-sm text-[#1E3A8A] flex items-center gap-1 mt-0.5">
                <Phone className="w-3.5 h-3.5" /> {miembro.celular}
              </a>
            )}
            {miembro.email && (
              <p className="text-xs text-gray-400 truncate mt-0.5">{miembro.email}</p>
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-4">
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${miembro.estado === 'activo' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
            {miembro.estado}
          </span>
          {miembro.bautizado && (
            <span className="text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-600 font-medium flex items-center gap-1">
              <Droplet className="w-3 h-3" /> Bautizado
            </span>
          )}
          <span className="text-xs px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 font-medium flex items-center gap-1">
            <GraduationCap className="w-3 h-3" /> Nivel {miembro.nivel_discipulado}
          </span>
          {miembro.celula && (
            <span className="text-xs px-3 py-1 rounded-full bg-amber-50 text-amber-600 font-medium flex items-center gap-1">
              <Home className="w-3 h-3" /> {miembro.celula}
            </span>
          )}
        </div>

        {miembro.direccion && (
          <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-3">
            <MapPin className="w-4 h-4" /> {miembro.direccion}
          </p>
        )}
      </div>

      {/* Attendance Chart */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Asistencia últimos 6 meses</h2>
        <div className="flex items-end justify-between gap-2 h-32">
          {chartData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="w-full flex-1 flex items-end">
                <div
                  className="w-full bg-[#1E3A8A] rounded-t-lg transition-all min-h-[4px]"
                  style={{ height: `${(d.count / maxCount) * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-400 capitalize">{d.label}</span>
              <span className="text-xs font-semibold text-gray-600">{d.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-4 h-4 text-emerald-600" />
            <span className="text-xs text-gray-400">Aportaciones</span>
          </div>
          <p className="text-lg font-bold text-gray-900">${Number(miembro.total_aportado).toLocaleString('es-CO')}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <span className="text-xs text-gray-400">Última visita</span>
          </div>
          <p className="text-sm font-bold text-gray-900">
            {miembro.fecha_ultima_asistencia
              ? new Date(miembro.fecha_ultima_asistencia).toLocaleDateString('es-CO')
              : 'Sin registro'}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => { setShowNota(true); setNotaTipo('Visita'); }}
          className="flex flex-col items-center gap-1.5 p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all active:scale-95"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <NotebookPen className="w-5 h-5 text-[#1E3A8A]" />
          </div>
          <span className="text-xs font-medium text-gray-700">Registrar Visita</span>
        </button>
        <a
          href={`tel:+57${phoneDigits}`}
          className="flex flex-col items-center gap-1.5 p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all active:scale-95"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <Phone className="w-5 h-5 text-emerald-600" />
          </div>
          <span className="text-xs font-medium text-gray-700">Llamar</span>
        </a>
        <button
          onClick={generateQR}
          className="flex flex-col items-center gap-1.5 p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all active:scale-95"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
            <QrCode className="w-5 h-5 text-indigo-600" />
          </div>
          <span className="text-xs font-medium text-gray-700">Ver QR</span>
        </button>
      </div>

      {/* WhatsApp button */}
      {miembro.celular && (
        <a
          href={`https://wa.me/57${phoneDigits}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 p-3 bg-emerald-50 text-emerald-700 rounded-xl font-medium text-sm hover:bg-emerald-100 transition-all"
        >
          <MessageCircle className="w-4 h-4" /> Enviar WhatsApp
        </a>
      )}

      {/* Pastoral Notes */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700">Notas Pastorales</h2>
          <button
            onClick={() => setShowNota(true)}
            className="flex items-center gap-1 text-xs text-[#1E3A8A] font-medium"
          >
            <Plus className="w-3.5 h-3.5" /> Agregar
          </button>
        </div>

        {seguimientos.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No hay notas pastorales registradas</p>
        ) : (
          <div className="space-y-3">
            {seguimientos.map((s) => (
              <div key={s.id} className="p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                    {s.tipo}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(s.fecha).toLocaleDateString('es-CO')}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{s.nota}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QR Modal */}
      {showQR && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowQR(false)}>
          <div className="bg-white rounded-3xl p-6 max-w-xs w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Código QR del Miembro</h3>
              <button onClick={() => setShowQR(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="flex justify-center">
              <img src={qrDataUrl} alt="QR Code" className="w-48 h-48 rounded-xl" />
            </div>
            <p className="text-center text-xs text-gray-400 mt-3">{miembro.nombre}</p>
          </div>
        </div>
      )}

      {/* Add Note Modal */}
      {showNota && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowNota(false)}>
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Nueva Nota Pastoral</h3>
              <button onClick={() => setShowNota(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex gap-2">
                {(['Visita', 'Llamada', 'Oracion'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setNotaTipo(t)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                      notaTipo === t ? 'bg-[#1E3A8A] text-white' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <textarea
                value={notaTexto}
                onChange={(e) => setNotaTexto(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900 resize-none"
                placeholder="Escribe la nota pastoral..."
              />
              <button
                onClick={handleSaveNota}
                disabled={savingNota || !notaTexto.trim()}
                className="w-full bg-[#1E3A8A] text-white py-3 rounded-xl font-semibold hover:bg-[#1e40af] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {savingNota ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus className="w-4 h-4" /> Guardar Nota</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
