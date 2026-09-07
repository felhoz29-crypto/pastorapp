import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Miembro, Screen } from '@/types';
import { Search, Plus, ArrowLeft, Loader2, Users, Check, X } from 'lucide-react';

interface Props {
  onNavigate: (s: Screen) => void;
  onSelectMiembro?: (id: string) => void;
}

export default function MiembrosList({ onNavigate, onSelectMiembro }: Props) {
  const { iglesia } = useAuth();
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [filtered, setFiltered] = useState<Miembro[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!iglesia) return;
    (async () => {
      const { data } = await supabase
        .from('miembros')
        .select('*')
        .eq('iglesia_id', iglesia.id)
        .order('nombre', { ascending: true });
      setMiembros((data || []) as Miembro[]);
      setFiltered((data || []) as Miembro[]);
      setLoading(false);
    })();
  }, [iglesia]);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(miembros);
    } else {
      setFiltered(miembros.filter((m) => m.nombre.toLowerCase().includes(search.toLowerCase())));
    }
  }, [search, miembros]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Miembros</h1>
          <p className="text-gray-500 text-sm">{miembros.length} miembros registrados</p>
        </div>
        <button
          onClick={() => onNavigate('nuevo-miembro')}
          className="flex items-center gap-2 bg-[#1E3A8A] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#1e40af] active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" /> Nuevo
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900"
          placeholder="Buscar miembro..."
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 animate-spin text-[#1E3A8A]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No hay miembros registrados</p>
          <button
            onClick={() => onNavigate('nuevo-miembro')}
            className="mt-4 text-[#1E3A8A] text-sm font-medium"
          >
            Crear el primer miembro
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((m) => (
            <button
              key={m.id}
              onClick={() => onSelectMiembro?.(m.id)}
              className="w-full flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100 text-left"
            >
              <div className="w-11 h-11 rounded-full bg-[#1E3A8A] flex items-center justify-center text-white font-semibold shrink-0">
                {m.nombre.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{m.nombre}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${m.estado === 'activo' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                    {m.estado}
                  </span>
                  {m.bautizado && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">Bautizado</span>
                  )}
                  <span className="text-xs text-gray-400">N{m.nivel_discipulado}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-gray-400">Aportado</p>
                <p className="text-sm font-semibold text-gray-700">${Number(m.total_aportado).toLocaleString('es-CO')}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
