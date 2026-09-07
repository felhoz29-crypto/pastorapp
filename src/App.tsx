import { useState } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import LoginScreen from '@/screens/LoginScreen';
import AppShell from '@/components/AppShell';
import Dashboard from '@/screens/Dashboard';
import RegistrarTransaccion from '@/screens/RegistrarTransaccion';
import MiembrosList from '@/screens/MiembrosList';
import NuevoMiembro from '@/screens/NuevoMiembro';
import FichaMiembro from '@/screens/FichaMiembro';
import AsistenciaQR from '@/screens/AsistenciaQR';
import TransaccionesList from '@/screens/TransaccionesList';
import InformeMensual from '@/screens/InformeMensual';
import type { Screen } from '@/types';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { session, usuario, loading } = useAuth();
  const [screen, setScreen] = useState<Screen>('dashboard');
  const [selectedMiembroId, setSelectedMiembroId] = useState<string>('');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1E3A8A]" />
      </div>
    );
  }

  if (!session || !usuario) {
    return <LoginScreen />;
  }

  const navigate = (s: Screen) => {
    setScreen(s);
    if (s === 'ficha-miembro' && !selectedMiembroId) {
      return;
    }
  };

  const openFicha = (id: string) => {
    setSelectedMiembroId(id);
    setScreen('ficha-miembro');
  };

  const renderScreen = () => {
    switch (screen) {
      case 'dashboard':
        return <Dashboard onNavigate={navigate} />;
      case 'registrar-ingreso':
        return <RegistrarTransaccion onNavigate={navigate} tipoInicial="ingreso" />;
      case 'registrar-gasto':
        return <RegistrarTransaccion onNavigate={navigate} tipoInicial="gasto" />;
      case 'miembros':
        return <MiembrosList onNavigate={navigate} onSelectMiembro={openFicha} />;
      case 'nuevo-miembro':
        return <NuevoMiembro onNavigate={navigate} />;
      case 'ficha-miembro':
        return selectedMiembroId ? (
          <FichaMiembro onNavigate={navigate} miembroId={selectedMiembroId} />
        ) : (
          <MiembrosList onNavigate={navigate} onSelectMiembro={openFicha} />
        );
      case 'asistencia':
        return <AsistenciaQR onNavigate={navigate} />;
      case 'transacciones':
        return <TransaccionesList onNavigate={navigate} />;
      case 'informe':
        return <InformeMensual onNavigate={navigate} />;
      default:
        return <Dashboard onNavigate={navigate} />;
    }
  };

  return <AppShell current={screen} onNavigate={navigate}>{renderScreen()}</AppShell>;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
