import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Screen, Miembro } from '@/types';
import QRCode from 'qrcode';
import { ArrowLeft, Loader2, Check, User } from 'lucide-react';

interface Props {
  onNavigate: (s: Screen) => void;
}

export default function NuevoMiembro({ onNavigate }: Props) {
  const { iglesia } = useAuth();
  const [nombre, setNombre] = useState('');
  const [celular, setCelular] = useState('');
  const [email, setEmail] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [direccion, setDireccion] = useState('');
  const [estado, setEstado] = useState<'activo' | 'inactivo'>('activo');
  const [bautizado, setBautizado] = useState(false);
  const [nivelDiscipulado, setNivelDiscipulado] = useState<1 | 2 | 3>(1);
  const [celula, setCelula] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!iglesia) return;
    if (!nombre.trim()) return;
    setSaving(true);

    try {
      const qrCode = `PASTORAPP-${iglesia.id.slice(0, 8)}-${Date.now().toString(36).toUpperCase()}`;

      const { data, error } = await supabase
        .from('miembros')
        .insert({
          iglesia_id: iglesia.id,
          nombre,
          celular,
          email,
          fecha_nacimiento: fechaNacimiento || null,
          direccion,
          estado,
          bautizado,
          nivel_discipulado: nivelDiscipulado,
          celula,
          qr_code: qrCode,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const qrDataUrl = await QRCode.toDataURL(qrCode, { width: 256, margin: 1 });
        await supabase
          .from('miembros')
          .update({ qr_code: qrCode })
          .eq('id', data.id);
      }

      onNavigate('miembros');
    } catch (err) {
      console.error('Error creando miembro:', err);
      alert('Error al crear miembro. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <button
        onClick={() => onNavigate('miembros')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="w-4 h-4" /> Volver a Miembros
      </button>

      <div>
        <h1 className="text-xl font-bold text-gray-900">Nuevo Miembro</h1>
        <p className="text-gray-500 text-sm mt-0.5">{iglesia?.nombre}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre completo *</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900"
            placeholder="Juan Pérez"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Celular</label>
            <input
              type="tel"
              value={celular}
              onChange={(e) => setCelular(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900"
              placeholder="3001234567"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900"
              placeholder="juan@email.com"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha nacimiento</label>
            <input
              type="date"
              value={fechaNacimiento}
              onChange={(e) => setFechaNacimiento(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Célula</label>
            <input
              type="text"
              value={celula}
              onChange={(e) => setCelula(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900"
              placeholder="Célula 1"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Dirección</label>
          <input
            type="text"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900"
            placeholder="Calle 123 #45-67"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Estado</label>
            <div className="flex gap-2">
              {(['activo', 'inactivo'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setEstado(s)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium capitalize transition-all ${
                    estado === s
                      ? 'bg-[#1E3A8A] text-white'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nivel Discipulado</label>
            <div className="flex gap-2">
              {[1, 2, 3].map((n) => (
                <button
                  key={n}
                  onClick={() => setNivelDiscipulado(n as 1 | 2 | 3)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    nivelDiscipulado === n
                      ? 'bg-[#1E3A8A] text-white'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  N{n}
                </button>
              ))}
            </div>
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={bautizado}
            onChange={(e) => setBautizado(e.target.checked)}
            className="w-5 h-5 rounded accent-[#1E3A8A]"
          />
          <span className="text-sm text-gray-700 font-medium">Bautizado</span>
        </label>
      </div>

      <button
        onClick={handleSave}
        disabled={saving || !nombre.trim()}
        className="w-full bg-[#1E3A8A] text-white py-3.5 rounded-xl font-semibold hover:bg-[#1e40af] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {saving ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <Check className="w-5 h-5" /> Crear Miembro
          </>
        )}
      </button>
    </div>
  );
}
