import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Miembro } from '@/types';
import type { Screen } from '@/types';
import {
  Search, Loader2, Check, X, Banknote, Smartphone, Building2,
  Upload, MessageCircle, ArrowLeft, Wallet,
} from 'lucide-react';

interface Props {
  onNavigate: (s: Screen) => void;
  tipoInicial?: 'ingreso' | 'gasto';
}

export default function RegistrarTransaccion({ onNavigate, tipoInicial = 'ingreso' }: Props) {
  const { iglesia } = useAuth();
  const [tipo, setTipo] = useState<'ingreso' | 'gasto'>(tipoInicial);
  const [categoria, setCategoria] = useState('Diezmo');
  const [miembroSearch, setMiembroSearch] = useState('');
  const [miembroSeleccionado, setMiembroSeleccionado] = useState<Miembro | null>(null);
  const [miembrosResults, setMiembrosResults] = useState<Miembro[]>([]);
  const [monto, setMonto] = useState('');
  const [formaPago, setFormaPago] = useState<'Efectivo' | 'Nequi' | 'Transferencia'>('Efectivo');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [enviarWhatsApp, setEnviarWhatsApp] = useState(false);
  const [comprobante, setComprobante] = useState<File | null>(null);
  const [observacion, setObservacion] = useState('');
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);

  const categoriasIngreso = ['Diezmo', 'Ofrenda', 'Primicia'];
  const categoriasGasto = ['Arriendo', 'Servicios', 'Otros'];

  useEffect(() => {
    if (tipo === 'ingreso') {
      setCategoria('Diezmo');
    } else {
      setCategoria('Arriendo');
    }
  }, [tipo]);

  useEffect(() => {
    if (!miembroSearch.trim() || miembroSeleccionado) {
      setMiembrosResults([]);
      return;
    }
    setSearching(true);
    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .from('miembros')
        .select('*')
        .eq('iglesia_id', iglesia!.id)
        .ilike('nombre', `%${miembroSearch}%`)
        .limit(5);
      setMiembrosResults((data || []) as Miembro[]);
      setSearching(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [miembroSearch, miembroSeleccionado, iglesia]);

  const formasPago = [
    { value: 'Efectivo', icon: Banknote },
    { value: 'Nequi', icon: Smartphone },
    { value: 'Transferencia', icon: Building2 },
  ] as const;

  const handleSave = async () => {
    if (!iglesia) return;
    if (!monto || Number(monto) <= 0) return;
    setSaving(true);

    try {
      let comprobanteUrl: string | null = null;

      if (comprobante) {
        const ext = comprobante.name.split('.').pop();
        const path = `${iglesia.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('comprobantes')
          .upload(path, comprobante);
        if (!upErr) {
          const { data: pub } = supabase.storage.from('comprobantes').getPublicUrl(path);
          comprobanteUrl = pub.publicUrl;
        }
      }

      const { error } = await supabase.from('transacciones').insert({
        iglesia_id: iglesia.id,
        tipo,
        categoria,
        monto: Number(monto),
        miembro_id: miembroSeleccionado?.id || null,
        fecha,
        forma_pago: formaPago,
        comprobante_url: comprobanteUrl,
        observacion,
      });

      if (error) throw error;

      if (tipo === 'ingreso' && miembroSeleccionado) {
        const nuevoTotal = Number(miembroSeleccionado.total_aportado) + Number(monto);
        await supabase
          .from('miembros')
          .update({ total_aportado: nuevoTotal })
          .eq('id', miembroSeleccionado.id);
      }

      if (enviarWhatsApp && tipo === 'ingreso' && miembroSeleccionado) {
        const msg = encodeURIComponent(
          `Hola ${miembroSeleccionado.nombre}, recibimos tu ${categoria.toLowerCase()} de $${Number(monto).toLocaleString('es-CO')} - ${iglesia.nombre}`
        );
        const phone = miembroSeleccionado.celular.replace(/\D/g, '');
        window.open(`https://wa.me/57${phone}?text=${msg}`, '_blank');
      }

      onNavigate('dashboard');
    } catch (err) {
      console.error('Error guardando transacción:', err);
      alert('Error al guardar. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const categorias = tipo === 'ingreso' ? categoriasIngreso : categoriasGasto;

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <button
        onClick={() => onNavigate('dashboard')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="w-4 h-4" /> Volver
      </button>

      <div>
        <h1 className="text-xl font-bold text-gray-900">
          {tipo === 'ingreso' ? 'Registrar Ingreso' : 'Registrar Gasto'}
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">{iglesia?.nombre}</p>
      </div>

      {/* Tipo toggle */}
      <div className="flex gap-2 bg-gray-100 rounded-xl p-1">
        <button
          onClick={() => setTipo('ingreso')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            tipo === 'ingreso' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500'
          }`}
        >
          <ArrowLeft className="w-4 h-4 rotate-90" /> Ingreso
        </button>
        <button
          onClick={() => setTipo('gasto')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            tipo === 'gasto' ? 'bg-white text-red-700 shadow-sm' : 'text-gray-500'
          }`}
        >
          <ArrowLeft className="w-4 h-4 -rotate-90" /> Gasto
        </button>
      </div>

      {/* Categoría chips */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
        <div className="flex flex-wrap gap-2">
          {categorias.map((c) => (
            <button
              key={c}
              onClick={() => setCategoria(c)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                categoria === c
                  ? 'bg-[#1E3A8A] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Miembro search - only for ingresos */}
      {tipo === 'ingreso' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Miembro (opcional)</label>
          {miembroSeleccionado ? (
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-[#1E3A8A] flex items-center justify-center text-white font-semibold">
                {miembroSeleccionado.nombre.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{miembroSeleccionado.nombre}</p>
                <p className="text-xs text-gray-500">{miembroSeleccionado.celular || 'Sin celular'}</p>
              </div>
              <button onClick={() => { setMiembroSeleccionado(null); setMiembroSearch(''); }}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={miembroSearch}
                  onChange={(e) => setMiembroSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900"
                  placeholder="Buscar miembro por nombre..."
                />
                {searching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                )}
              </div>
              {miembrosResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white rounded-xl shadow-lg border border-gray-100 max-h-60 overflow-y-auto">
                  {miembrosResults.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => { setMiembroSeleccionado(m); setMiembroSearch(''); setMiembrosResults([]); }}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0"
                    >
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold text-sm">
                        {m.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{m.nombre}</p>
                        <p className="text-xs text-gray-400">{m.celular || 'Sin celular'}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Monto */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Monto (COP)</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
          <input
            type="number"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900 text-lg font-semibold"
            placeholder="0"
            min="0"
          />
        </div>
      </div>

      {/* Forma de pago */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Forma de Pago</label>
        <div className="grid grid-cols-3 gap-2">
          {formasPago.map((f) => {
            const Icon = f.icon;
            return (
              <button
                key={f.value}
                onClick={() => setFormaPago(f.value)}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all ${
                  formaPago === f.value
                    ? 'border-[#1E3A8A] bg-blue-50 text-[#1E3A8A]'
                    : 'border-gray-200 text-gray-500'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{f.value}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Fecha */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900"
        />
      </div>

      {/* Comprobante */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Comprobante (opcional)</label>
        <label className="flex items-center gap-3 p-3 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-[#1E3A8A] transition-colors">
          <Upload className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-500">
            {comprobante ? comprobante.name : 'Subir imagen o PDF'}
          </span>
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => setComprobante(e.target.files?.[0] || null)}
            className="hidden"
          />
        </label>
      </div>

      {/* Observación */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Observación (opcional)</label>
        <textarea
          value={observacion}
          onChange={(e) => setObservacion(e.target.value)}
          rows={2}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900 resize-none"
          placeholder="Notas adicionales..."
        />
      </div>

      {/* WhatsApp checkbox - only for ingresos */}
      {tipo === 'ingreso' && miembroSeleccionado && (
        <label className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl cursor-pointer">
          <input
            type="checkbox"
            checked={enviarWhatsApp}
            onChange={(e) => setEnviarWhatsApp(e.target.checked)}
            className="w-5 h-5 rounded accent-emerald-600"
          />
          <MessageCircle className="w-5 h-5 text-emerald-600" />
          <span className="text-sm text-emerald-800 font-medium">Enviar recibo por WhatsApp</span>
        </label>
      )}

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving || !monto}
        className="w-full bg-[#1E3A8A] text-white py-3.5 rounded-xl font-semibold hover:bg-[#1e40af] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {saving ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <Check className="w-5 h-5" /> Guardar {tipo === 'ingreso' ? 'Ingreso' : 'Gasto'}
          </>
        )}
      </button>
    </div>
  );
}
