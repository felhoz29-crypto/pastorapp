import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Transaccion, Screen } from '@/types';
import {
  ArrowLeft, ArrowUpRight, ArrowDownRight, Plus, Wallet, Loader2, FileText,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Props {
  onNavigate: (s: Screen) => void;
}

export default function TransaccionesList({ onNavigate }: Props) {
  const { iglesia } = useAuth();
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<'todos' | 'ingreso' | 'gasto'>('todos');

  useEffect(() => {
    if (!iglesia) return;
    (async () => {
      const { data } = await supabase
        .from('transacciones')
        .select('*')
        .eq('iglesia_id', iglesia.id)
        .order('fecha', { ascending: false })
        .limit(100);
      setTransacciones((data || []) as Transaccion[]);
      setLoading(false);
    })();
  }, [iglesia]);

  const filtered = transacciones.filter((t) => filtro === 'todos' || t.tipo === filtro);
  const totalIngresos = transacciones.filter((t) => t.tipo === 'ingreso').reduce((s, t) => s + Number(t.monto), 0);
  const totalGastos = transacciones.filter((t) => t.tipo === 'gasto').reduce((s, t) => s + Number(t.monto), 0);

  const generatePDF = () => {
    const doc = new jsPDF();
    const now = new Date();
    const monthName = now.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });

    doc.setFontSize(18);
    doc.setTextColor(30, 58, 138);
    doc.text('Informe Mensual', 14, 22);
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`${iglesia?.nombre || ''} - ${monthName}`, 14, 30);
    doc.text(`Generado: ${now.toLocaleDateString('es-CO')}`, 14, 36);

    doc.setFontSize(14);
    doc.setTextColor(30, 58, 138);
    doc.text('Resumen', 14, 48);
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text(`Ingresos: $${totalIngresos.toLocaleString('es-CO')}`, 14, 56);
    doc.text(`Gastos: $${totalGastos.toLocaleString('es-CO')}`, 14, 62);
    doc.text(`Saldo: $${(totalIngresos - totalGastos).toLocaleString('es-CO')}`, 14, 68);

    autoTable(doc, {
      startY: 78,
      head: [['Fecha', 'Tipo', 'Categoría', 'Forma Pago', 'Monto']],
      body: filtered.map((t) => [
        new Date(t.fecha).toLocaleDateString('es-CO'),
        t.tipo,
        t.categoria,
        t.forma_pago,
        `$${Number(t.monto).toLocaleString('es-CO')}`,
      ]),
      headStyles: { fillColor: [30, 58, 138] },
      styles: { fontSize: 9 },
    });

    doc.save(`informe-${monthName.replace(/\s/g, '-')}.pdf`);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Finanzas</h1>
          <p className="text-gray-500 text-sm">{iglesia?.nombre}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={generatePDF}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-3 py-2.5 rounded-xl text-sm font-medium hover:shadow-sm transition-all"
          >
            <FileText className="w-4 h-4" /> PDF
          </button>
          <button
            onClick={() => onNavigate('registrar-ingreso')}
            className="flex items-center gap-2 bg-[#1E3A8A] text-white px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#1e40af] active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" /> Nuevo
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3">
          <p className="text-xs text-gray-400">Ingresos</p>
          <p className="text-sm font-bold text-emerald-600">${totalIngresos.toLocaleString('es-CO')}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3">
          <p className="text-xs text-gray-400">Gastos</p>
          <p className="text-sm font-bold text-red-600">${totalGastos.toLocaleString('es-CO')}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3">
          <p className="text-xs text-gray-400">Saldo</p>
          <p className="text-sm font-bold text-[#1E3A8A]">${(totalIngresos - totalGastos).toLocaleString('es-CO')}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(['todos', 'ingreso', 'gasto'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-4 py-2 rounded-full text-xs font-medium capitalize transition-all ${
              filtro === f ? 'bg-[#1E3A8A] text-white' : 'bg-white text-gray-500 border border-gray-200'
            }`}
          >
            {f === 'todos' ? 'Todos' : f + 's'}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 animate-spin text-[#1E3A8A]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No hay transacciones registradas</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => (
            <div key={t.id} className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                t.tipo === 'ingreso' ? 'bg-emerald-50' : 'bg-red-50'
              }`}>
                {t.tipo === 'ingreso' ? (
                  <ArrowUpRight className="w-5 h-5 text-emerald-600" />
                ) : (
                  <ArrowDownRight className="w-5 h-5 text-red-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{t.categoria}</p>
                <p className="text-xs text-gray-400">
                  {new Date(t.fecha).toLocaleDateString('es-CO')} - {t.forma_pago}
                </p>
              </div>
              <p className={`text-sm font-bold ${t.tipo === 'ingreso' ? 'text-emerald-600' : 'text-red-600'}`}>
                {t.tipo === 'ingreso' ? '+' : '-'}${Number(t.monto).toLocaleString('es-CO')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
