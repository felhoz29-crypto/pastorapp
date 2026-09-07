import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Miembro, Transaccion, Asistencia } from '@/types';
import type { Screen } from '@/types';
import {
  TrendingUp, TrendingDown, Wallet, Users, AlertTriangle,
  Plus, ScanLine, FileText, ArrowUpRight, ArrowDownRight, Download,
} from 'lucide-react';

interface Props {
  onNavigate: (s: Screen) => void;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Dashboard({ onNavigate }: Props) {
  const { iglesia } = useAuth();
  const [loading, setLoading] = useState(true);
  const [ingresos, setIngresos] = useState(0);
  const [gastos, setGastos] = useState(0);
  const [asistenciaUltima, setAsistenciaUltima] = useState<Asistencia | null>(null);
  const [alertas, setAlertas] = useState<Miembro[]>([]);
  const [totalMiembros, setTotalMiembros] = useState(0);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsInstalled(standalone);

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const handleAppInstalled = () => {
      setInstallPrompt(null);
      setIsInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    if (!iglesia) return;
    (async () => {
      setLoading(true);
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const today = now.toISOString().split('T')[0];

      const [transRes, asisRes, miembrosRes] = await Promise.all([
        supabase
          .from('transacciones')
          .select('tipo, monto')
          .eq('iglesia_id', iglesia.id)
          .gte('fecha', firstDay)
          .lte('fecha', today),
        supabase
          .from('asistencias')
          .select('*')
          .eq('iglesia_id', iglesia.id)
          .order('fecha_servicio', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('miembros')
          .select('id, nombre, fecha_ultima_asistencia')
          .eq('iglesia_id', iglesia.id)
          .eq('estado', 'activo'),
      ]);

      let ing = 0;
      let gas = 0;
      for (const t of (transRes.data || [])) {
        if (t.tipo === 'ingreso') ing += Number(t.monto);
        else gas += Number(t.monto);
      }
      setIngresos(ing);
      setGastos(gas);
      setAsistenciaUltima(asisRes.data as Asistencia | null);
      setTotalMiembros((miembrosRes.data || []).length);

      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const ausentes = (miembrosRes.data || []).filter((m) => {
        if (!m.fecha_ultima_asistencia) return true;
        return m.fecha_ultima_asistencia < twoWeeksAgo;
      });
      setAlertas(ausentes as Miembro[]);

      setLoading(false);
    })();
  }, [iglesia]);

  const saldo = ingresos - gastos;

  const handleInstall = async () => {
    if (!installPrompt) {
      window.alert('Para instalar PASTORAPP, abre el menú del navegador y selecciona “Agregar a pantalla de inicio”.');
      return;
    }
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  const cards = [
    { label: 'Saldo del Mes', value: `$${saldo.toLocaleString('es-CO')}`, icon: Wallet, color: 'bg-[#1E3A8A]', text: 'text-white' },
    { label: 'Ingresos', value: `$${ingresos.toLocaleString('es-CO')}`, icon: TrendingUp, color: 'bg-emerald-50', text: 'text-emerald-700' },
    { label: 'Gastos', value: `$${gastos.toLocaleString('es-CO')}`, icon: TrendingDown, color: 'bg-red-50', text: 'text-red-700' },
    { label: 'Asistencia', value: asistenciaUltima ? `${asistenciaUltima.total}` : '—', icon: Users, color: 'bg-amber-50', text: 'text-amber-700' },
  ];

  const quickActions = [
    { label: 'Registrar Diezmo', icon: ArrowUpRight, screen: 'registrar-ingreso' as Screen, color: 'bg-emerald-500' },
    { label: 'Registrar Gasto', icon: ArrowDownRight, screen: 'registrar-gasto' as Screen, color: 'bg-red-500' },
    { label: 'Tomar Asistencia', icon: ScanLine, screen: 'asistencia' as Screen, color: 'bg-[#1E3A8A]' },
    { label: 'Nuevo Miembro', icon: Plus, screen: 'nuevo-miembro' as Screen, color: 'bg-indigo-500' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-[#1E3A8A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hola, {iglesia?.pastor_nombre || 'Pastor'}</h1>
          <p className="text-gray-500 text-sm mt-1">{iglesia?.nombre} - {iglesia?.ciudad}</p>
        </div>
        {!isInstalled && (
          <button
            onClick={handleInstall}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#1e40af] active:scale-95"
          >
            <Download className="h-4 w-4" />
            Instalar App
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className={`rounded-2xl p-4 ${c.color} shadow-sm`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-medium ${c.text} opacity-80`}>{c.label}</span>
                <Icon className={`w-4 h-4 ${c.text} opacity-80`} />
              </div>
              <p className={`text-xl font-bold ${c.text}`}>{c.value}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Acciones Rápidas</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.label}
                onClick={() => onNavigate(a.screen)}
                className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-[0.97] border border-gray-100"
              >
                <div className={`w-10 h-10 rounded-xl ${a.color} flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-medium text-gray-700 text-center">{a.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Alerts */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <h2 className="text-sm font-semibold text-gray-700">Alertas de Asistencia</h2>
          <span className="ml-auto text-xs text-gray-400">{alertas.length} miembros</span>
        </div>

        {alertas.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">
            Todos los miembros han asistido recientemente
          </p>
        ) : (
          <div className="space-y-2">
            {alertas.slice(0, 5).map((m) => (
              <div key={m.id} className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl">
                <div className="w-9 h-9 rounded-full bg-amber-200 flex items-center justify-center text-amber-800 font-semibold text-sm">
                  {m.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{m.nombre}</p>
                  <p className="text-xs text-gray-500">
                    {m.fecha_ultima_asistencia
                      ? `Última asistencia: ${new Date(m.fecha_ultima_asistencia).toLocaleDateString('es-CO')}`
                      : 'Sin registros de asistencia'}
                  </p>
                </div>
              </div>
            ))}
            {alertas.length > 5 && (
              <button
                onClick={() => onNavigate('miembros')}
                className="w-full text-center text-sm text-[#1E3A8A] font-medium py-2"
              >
                Ver todos los miembros
              </button>
            )}
          </div>
        )}
      </div>

      {/* Stats Footer */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <Users className="w-5 h-5 text-[#1E3A8A]" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Total Miembros</p>
            <p className="text-lg font-bold text-gray-900">{totalMiembros}</p>
          </div>
        </div>
        <button
          onClick={() => onNavigate('informe')}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3 hover:shadow-md transition-all text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <FileText className="w-5 h-5 text-[#1E3A8A]" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Informe Mensual</p>
            <p className="text-sm font-semibold text-[#1E3A8A]">Generar PDF</p>
          </div>
        </button>
      </div>
    </div>
  );
}
