import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Transaccion, Screen } from '@/types';
import { Loader2, FileText, Download, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Props {
  onNavigate: (s: Screen) => void;
}

export default function InformeMensual({ onNavigate }: Props) {
  const { iglesia } = useAuth();
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [mes, setMes] = useState(new Date().getMonth());
  const [ano, setAno] = useState(new Date().getFullYear());

  useEffect(() => {
    if (!iglesia) return;
    (async () => {
      setLoading(true);
      const firstDay = new Date(ano, mes, 1).toISOString().split('T')[0];
      const lastDay = new Date(ano, mes + 1, 0).toISOString().split('T')[0];
      const { data } = await supabase
        .from('transacciones')
        .select('*')
        .eq('iglesia_id', iglesia.id)
        .gte('fecha', firstDay)
        .lte('fecha', lastDay)
        .order('fecha', { ascending: true });
      setTransacciones((data || []) as Transaccion[]);
      setLoading(false);
    })();
  }, [iglesia, mes, ano]);

  const ingresos = transacciones.filter((t) => t.tipo === 'ingreso');
  const gastos = transacciones.filter((t) => t.tipo === 'gasto');
  const totalIngresos = ingresos.reduce((s, t) => s + Number(t.monto), 0);
  const totalGastos = gastos.reduce((s, t) => s + Number(t.monto), 0);
  const saldo = totalIngresos - totalGastos;

  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  const generatePDF = () => {
    const doc = new jsPDF();
    const monthName = meses[mes];

    // Header
    doc.setFontSize(20);
    doc.setTextColor(30, 58, 138);
    doc.text('PASTORAPP - Informe Mensual', 14, 22);
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`${iglesia?.nombre || ''}`, 14, 30);
    doc.text(`Pastor: ${iglesia?.pastor_nombre || ''} - ${iglesia?.ciudad || ''}`, 14, 36);
    doc.text(`Periodo: ${monthName} ${ano}`, 14, 42);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-CO')}`, 14, 48);

    // Summary
    doc.setFontSize(14);
    doc.setTextColor(30, 58, 138);
    doc.text('Resumen Financiero', 14, 60);
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text(`Total Ingresos: $${totalIngresos.toLocaleString('es-CO')}`, 14, 68);
    doc.text(`Total Gastos: $${totalGastos.toLocaleString('es-CO')}`, 14, 74);
    doc.text(`Saldo: $${saldo.toLocaleString('es-CO')}`, 14, 80);

    // Ingresos table
    autoTable(doc, {
      startY: 90,
      head: [['Ingresos', 'Fecha', 'Categoría', 'Forma Pago', 'Monto']],
      body: ingresos.map((t) => [
        t.observacion || t.categoria,
        new Date(t.fecha).toLocaleDateString('es-CO'),
        t.categoria,
        t.forma_pago,
        `$${Number(t.monto).toLocaleString('es-CO')}`,
      ]),
      headStyles: { fillColor: [16, 185, 129] },
      styles: { fontSize: 9 },
    });

    // Gastos table
    autoTable(doc, {
      startY: (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10,
      head: [['Gastos', 'Fecha', 'Categoría', 'Forma Pago', 'Monto']],
      body: gastos.map((t) => [
        t.observacion || t.categoria,
        new Date(t.fecha).toLocaleDateString('es-CO'),
        t.categoria,
        t.forma_pago,
        `$${Number(t.monto).toLocaleString('es-CO')}`,
      ]),
      headStyles: { fillColor: [239, 68, 68] },
      styles: { fontSize: 9 },
    });

    doc.save(`informe-${monthName}-${ano}.pdf`);
  };

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Informe Mensual</h1>
        <p className="text-gray-500 text-sm mt-0.5">{iglesia?.nombre}</p>
      </div>

      {/* Period selector */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mes</label>
            <select
              value={mes}
              onChange={(e) => setMes(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900 bg-white"
            >
              {meses.map((m, i) => (
                <option key={i} value={i}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Año</label>
            <select
              value={ano}
              onChange={(e) => setAno(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900 bg-white"
            >
              {[new Date().getFullYear(), new Date().getFullYear() - 1].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 animate-spin text-[#1E3A8A]" />
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span className="text-xs text-gray-400">Ingresos</span>
              </div>
              <p className="text-sm font-bold text-emerald-600">${totalIngresos.toLocaleString('es-CO')}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-red-600" />
                <span className="text-xs text-gray-400">Gastos</span>
              </div>
              <p className="text-sm font-bold text-red-600">${totalGastos.toLocaleString('es-CO')}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="w-4 h-4 text-[#1E3A8A]" />
                <span className="text-xs text-gray-400">Saldo</span>
              </div>
              <p className="text-sm font-bold text-[#1E3A8A]">${saldo.toLocaleString('es-CO')}</p>
            </div>
          </div>

          {/* Transaction count */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">
                {transacciones.length} transacciones en {meses[mes]} {ano}
              </span>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Ingresos</span>
                <span className="text-emerald-600 font-medium">{ingresos.length} registros</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Gastos</span>
                <span className="text-red-600 font-medium">{gastos.length} registros</span>
              </div>
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={generatePDF}
            disabled={transacciones.length === 0}
            className="w-full bg-[#1E3A8A] text-white py-3.5 rounded-xl font-semibold hover:bg-[#1e40af] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" /> Descargar PDF
          </button>

          {transacciones.length === 0 && (
            <p className="text-center text-sm text-gray-400">
              No hay transacciones en este periodo
            </p>
          )}
        </>
      )}
    </div>
  );
}
