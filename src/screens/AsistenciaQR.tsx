import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Miembro, Screen } from '@/types';
import { Html5Qrcode } from 'html5-qrcode';
import {
  ArrowLeft, ScanLine, Search, Check, X, Loader2, UserPlus, Users, Calendar,
} from 'lucide-react';

interface Props {
  onNavigate: (s: Screen) => void;
}

interface Presente {
  miembro: Miembro;
  scanned: boolean;
}

export default function AsistenciaQR({ onNavigate }: Props) {
  const { iglesia } = useAuth();
  const [tipoServicio, setTipoServicio] = useState('Domingo AM');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [presentes, setPresentes] = useState<Presente[]>([]);
  const [scanning, setScanning] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manualSearch, setManualSearch] = useState('');
  const [manualResults, setManualResults] = useState<Miembro[]>([]);
  const [allMiembros, setAllMiembros] = useState<Miembro[]>([]);
  const [saving, setSaving] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerDivId = 'qr-scanner-region';

  const tiposServicio = ['Domingo AM', 'Domingo PM', 'Miercoles', 'Viernes', 'Especial'];

  useEffect(() => {
    if (!iglesia) return;
    (async () => {
      const { data } = await supabase
        .from('miembros')
        .select('*')
        .eq('iglesia_id', iglesia.id)
        .eq('estado', 'activo')
        .order('nombre', { ascending: true });
      setAllMiembros((data || []) as Miembro[]);
    })();
  }, [iglesia]);

  useEffect(() => {
    if (!showManual || !manualSearch.trim()) {
      setManualResults([]);
      return;
    }
    setManualResults(
      allMiembros.filter(
        (m) =>
          m.nombre.toLowerCase().includes(manualSearch.toLowerCase()) &&
          !presentes.some((p) => p.miembro.id === m.id)
      )
    );
  }, [manualSearch, showManual, allMiembros, presentes]);

  const startScan = async () => {
    setScanning(true);
    setTimeout(async () => {
      try {
        const html5Qrcode = new Html5Qrcode(scannerDivId);
        scannerRef.current = html5Qrcode;
        await html5Qrcode.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 200, height: 200 } },
          (decodedText) => handleScan(decodedText),
          () => {}
        );
      } catch (err) {
        console.error('Error starting scanner:', err);
        alert('No se pudo acceder a la cámara. Verifica los permisos.');
        setScanning(false);
      }
    }, 100);
  };

  const stopScan = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch {
        // ignore
      }
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const handleScan = async (decodedText: string) => {
    const { data } = await supabase
      .from('miembros')
      .select('*')
      .eq('qr_code', decodedText)
      .eq('iglesia_id', iglesia!.id)
      .maybeSingle();

    if (data) {
      const miembro = data as Miembro;
      setPresentes((prev) => {
        if (prev.some((p) => p.miembro.id === miembro.id)) return prev;
        return [...prev, { miembro, scanned: true }];
      });
    }
  };

  const addManual = (miembro: Miembro) => {
    setPresentes((prev) => {
      if (prev.some((p) => p.miembro.id === miembro.id)) return prev;
      return [...prev, { miembro, scanned: false }];
    });
    setManualSearch('');
    setShowManual(false);
  };

  const removePresente = (id: string) => {
    setPresentes((prev) => prev.filter((p) => p.miembro.id !== id));
  };

  const finalizar = async () => {
    if (!iglesia || presentes.length === 0) return;
    setSaving(true);

    try {
      const miembrosIds = presentes.map((p) => p.miembro.id);
      const { error } = await supabase.from('asistencias').insert({
        iglesia_id: iglesia.id,
        fecha_servicio: fecha,
        tipo_servicio: tipoServicio,
        miembros_presentes: miembrosIds,
        total: miembrosIds.length,
      });

      if (error) throw error;

      await Promise.all(
        miembrosIds.map((id) =>
          supabase
            .from('miembros')
            .update({ fecha_ultima_asistencia: fecha })
            .eq('id', id)
        )
      );

      onNavigate('dashboard');
    } catch (err) {
      console.error('Error guardando asistencia:', err);
      alert('Error al guardar asistencia.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <button
        onClick={() => { stopScan(); onNavigate('dashboard'); }}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="w-4 h-4" /> Volver
      </button>

      <div>
        <h1 className="text-xl font-bold text-gray-900">Tomar Asistencia</h1>
        <p className="text-gray-500 text-sm mt-0.5">{iglesia?.nombre}</p>
      </div>

      {/* Service selector */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Servicio</label>
          <div className="flex flex-wrap gap-2">
            {tiposServicio.map((t) => (
              <button
                key={t}
                onClick={() => setTipoServicio(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  tipoServicio === t
                    ? 'bg-[#1E3A8A] text-white'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900"
          />
        </div>
      </div>

      {/* Scanner */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        {scanning ? (
          <div>
            <div id={scannerDivId} className="w-full rounded-xl overflow-hidden bg-gray-900 aspect-square max-w-xs mx-auto" />
            <button
              onClick={stopScan}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-50 text-red-600 font-semibold text-sm hover:bg-red-100 transition-all"
            >
              <X className="w-4 h-4" /> Detener Escaneo
            </button>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
              <ScanLine className="w-8 h-8 text-[#1E3A8A]" />
            </div>
            <p className="text-sm text-gray-500 mb-4">Escanea el código QR de cada miembro</p>
            <button
              onClick={startScan}
              className="inline-flex items-center gap-2 bg-[#1E3A8A] text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-[#1e40af] active:scale-95 transition-all"
            >
              <ScanLine className="w-5 h-5" /> Escanear QR
            </button>
          </div>
        )}
      </div>

      {/* Presentes counter */}
      <div className="flex items-center justify-between bg-[#1E3A8A] text-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6" />
          <span className="font-semibold">Presentes</span>
        </div>
        <span className="text-2xl font-bold">{presentes.length}</span>
      </div>

      {/* Presentes list */}
      {presentes.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-2">
          {presentes.map((p) => (
            <div key={p.miembro.id} className="flex items-center gap-3 p-2.5 bg-emerald-50 rounded-xl">
              <div className="w-9 h-9 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-800 font-semibold text-sm shrink-0">
                {p.miembro.nombre.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-gray-900 flex-1 truncate">{p.miembro.nombre}</span>
              {p.scanned && <Check className="w-4 h-4 text-emerald-600" />}
              <button onClick={() => removePresente(p.miembro.id)}>
                <X className="w-4 h-4 text-gray-400 hover:text-red-500" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add manual button */}
      <button
        onClick={() => setShowManual(true)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-200 text-gray-500 font-medium text-sm hover:border-[#1E3A8A] hover:text-[#1E3A8A] transition-all"
      >
        <UserPlus className="w-4 h-4" /> Agregar Manual
      </button>

      {/* Finalizar button */}
      <button
        onClick={finalizar}
        disabled={saving || presentes.length === 0}
        className="w-full bg-[#1E3A8A] text-white py-3.5 rounded-xl font-semibold hover:bg-[#1e40af] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {saving ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <Check className="w-5 h-5" /> Finalizar Asistencia
          </>
        )}
      </button>

      {/* Manual search modal */}
      {showManual && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowManual(false)}>
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Agregar Miembro</h3>
              <button onClick={() => setShowManual(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={manualSearch}
                onChange={(e) => setManualSearch(e.target.value)}
                autoFocus
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900"
                placeholder="Buscar miembro..."
              />
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {manualResults.map((m) => (
                <button
                  key={m.id}
                  onClick={() => addManual(m)}
                  className="w-full flex items-center gap-3 p-2.5 hover:bg-gray-50 rounded-xl transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold text-sm">
                    {m.nombre.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-900">{m.nombre}</span>
                </button>
              ))}
              {manualSearch.trim() && manualResults.length === 0 && (
                <p className="text-center text-sm text-gray-400 py-4">Sin resultados</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
