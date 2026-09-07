import { Church, LayoutDashboard, Users, Wallet, ScanLine, FileText, LogOut, Menu, X } from 'lucide-react';
import type { Screen } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';

interface NavItem {
  id: Screen;
  label: string;
  icon: typeof LayoutDashboard;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
  { id: 'registrar-ingreso', label: 'Nuevo Ingreso', icon: Wallet },
  { id: 'asistencia', label: 'Asistencia', icon: ScanLine },
  { id: 'miembros', label: 'Miembros', icon: Users },
  { id: 'transacciones', label: 'Finanzas', icon: Wallet },
  { id: 'informe', label: 'Informe PDF', icon: FileText },
];

interface Props {
  current: Screen;
  onNavigate: (s: Screen) => void;
  children: React.ReactNode;
}

export default function AppShell({ current, onNavigate, children }: Props) {
  const { iglesia, usuario, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNav = (s: Screen) => {
    onNavigate(s);
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 bg-[#1E3A8A] flex-col fixed inset-y-0 left-0 z-30">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <Church className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">PASTORAPP</p>
            <p className="text-blue-200 text-xs truncate max-w-[140px]">{iglesia?.nombre}</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = current === item.id || (item.id === 'miembros' && current === 'ficha-miembro') || (item.id === 'transacciones' && (current === 'registrar-gasto' || current === 'registrar-ingreso'));
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-white/15 text-white'
                    : 'text-blue-100 hover:bg-white/5'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-white/10">
          <div className="px-3 py-2 mb-2">
            <p className="text-white text-sm font-medium truncate">{usuario?.nombre}</p>
            <p className="text-blue-200 text-xs truncate">{usuario?.email}</p>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-blue-100 hover:bg-white/5 transition-all"
          >
            <LogOut className="w-5 h-5" /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 inset-x-0 z-30 bg-[#1E3A8A] px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2">
          <Church className="w-6 h-6 text-white" />
          <span className="text-white font-bold text-sm">PASTORAPP</span>
        </div>
        <button onClick={() => setMenuOpen(!menuOpen)} className="text-white p-1">
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-20 bg-black/40" onClick={() => setMenuOpen(false)}>
          <div
            className="absolute top-[56px] inset-x-0 bg-[#1E3A8A] px-3 py-4 space-y-1 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = current === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                    active ? 'bg-white/15 text-white' : 'text-blue-100'
                  }`}
                >
                  <Icon className="w-5 h-5" /> {item.label}
                </button>
              );
            })}
            <div className="border-t border-white/10 mt-2 pt-2">
              <div className="px-3 py-2">
                <p className="text-white text-sm font-medium">{usuario?.nombre}</p>
                <p className="text-blue-200 text-xs">{usuario?.email}</p>
              </div>
              <button
                onClick={signOut}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-blue-100"
              >
                <LogOut className="w-5 h-5" /> Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-64 pt-14 md:pt-0 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 py-6 md:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
