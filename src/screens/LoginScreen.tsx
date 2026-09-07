import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Church, Loader2, AlertCircle, UserPlus, LogIn } from 'lucide-react';

export default function LoginScreen() {
  const { refreshProfile } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [iglesiaNombre, setIglesiaNombre] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await refreshProfile();
      } else {
        if (!iglesiaNombre.trim()) throw new Error('Ingresa el nombre de tu iglesia');
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (!data.user) throw new Error('No se pudo crear el usuario');

        const { data: iglesiaData, error: igError } = await supabase
          .from('iglesias')
          .insert({
            nombre: iglesiaNombre,
            pastor_nombre: nombre,
            ciudad,
            plan: 'trial',
            fecha_vencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            created_by: data.user.id,
          })
          .select()
          .single();

        if (igError) throw igError;

        const { error: usrError } = await supabase
          .from('usuarios')
          .insert({
            id: data.user.id,
            email,
            iglesia_id: iglesiaData.id,
            rol: 'pastor',
            nombre,
          });

        if (usrError) throw usrError;
        await refreshProfile();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setError(msg === 'User already registered' ? 'Este email ya está registrado. Inicia sesión.' : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E3A8A] via-[#1e40af] to-[#172554] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm mb-4 border border-white/20">
            <Church className="w-8 h-8 text-white" strokeWidth={2} />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">PASTORAPP</h1>
          <p className="text-blue-200 text-sm mt-1">Gestión pastoral para Colombia</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <div className="flex gap-2 mb-6 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                mode === 'login' ? 'bg-white text-[#1E3A8A] shadow-sm' : 'text-gray-500'
              }`}
            >
              <LogIn className="w-4 h-4" /> Iniciar Sesión
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                mode === 'register' ? 'bg-white text-[#1E3A8A] shadow-sm' : 'text-gray-500'
              }`}
            >
              <UserPlus className="w-4 h-4" /> Crear Iglesia
            </button>
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 text-red-700 text-sm rounded-xl p-3 mb-4">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Tu nombre</label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900"
                    placeholder="Pastor Juan Pérez"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre de la iglesia</label>
                  <input
                    type="text"
                    value={iglesiaNombre}
                    onChange={(e) => setIglesiaNombre(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900"
                    placeholder="Iglesia Centro Fe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Ciudad</label>
                  <input
                    type="text"
                    value={ciudad}
                    onChange={(e) => setCiudad(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900"
                    placeholder="Bogotá"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900"
                placeholder="pastor@iglesia.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1E3A8A] text-white py-3.5 rounded-xl font-semibold hover:bg-[#1e40af] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : mode === 'login' ? (
                'Iniciar Sesión'
              ) : (
                'Crear mi Iglesia'
              )}
            </button>
          </form>

          {mode === 'register' && (
            <p className="text-center text-xs text-gray-400 mt-4">
              Tu iglesia inicia con plan Trial (30 días gratis)
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
