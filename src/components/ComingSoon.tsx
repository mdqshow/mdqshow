import React, { useState } from 'react';
import { Lock, MapPin } from 'lucide-react';
import { MdqBrandIcon } from './MdqBrandIcon';

interface ComingSoonProps {
  onUnlockAdmin: () => void;
}

export const ComingSoon: React.FC<ComingSoonProps> = ({ onUnlockAdmin }) => {
  const [showSecretPrompt, setShowSecretPrompt] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'MDQ2026mdq') {
      sessionStorage.setItem('mdqshow_preview_access', 'true');
      onUnlockAdmin();
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#0e1117] text-slate-100 flex flex-col justify-between selection:bg-rose-500 selection:text-white relative overflow-hidden">
      {/* Glow ambiental de fondo */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-rose-600/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[130px] pointer-events-none" />

      {/* Top Header - Exacto idéntico al Navbar original */}
      <header className="sticky top-0 z-40 bg-[#0e1117]/90 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo & Brand Oficial idéntico al Navbar */}
            <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-slate-950 border border-rose-500/50 flex items-center justify-center shadow-xl shadow-rose-950/60 p-1 hover:scale-105 transition-transform overflow-hidden relative group shrink-0">
                <div className="absolute inset-0 bg-gradient-to-tr from-rose-600/25 via-rose-500/10 to-amber-500/20 pointer-events-none" />
                <MdqBrandIcon className="w-full h-full relative z-10" />
              </div>

              <div>
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  <span className="font-black text-xl sm:text-3xl tracking-tight text-white font-mono leading-none">
                    MDQ<span className="text-rose-500">SHOW</span>
                  </span>
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    <MapPin className="w-3 h-3 mr-1 text-rose-400" />
                    <span>Mar del Plata</span>
                  </span>
                </div>
                {/* Mar del Plata en mobile */}
                <div className="flex items-center text-[10px] text-rose-400/90 font-medium sm:hidden mt-0.5">
                  <MapPin className="w-2.5 h-2.5 mr-1 text-rose-400 shrink-0" />
                  <span>Mar del Plata</span>
                </div>
                <p className="text-xs text-slate-400 hidden sm:block">
                  Cartelera de recitales y shows en Mar del Plata
                </p>
              </div>
            </div>

            {/* Botón discreto de acceso privado */}
            <button
              onClick={() => setShowSecretPrompt(true)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800 px-3.5 py-2 rounded-xl transition-all duration-200 shadow-sm"
              title="Acceso privado con clave"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Acceso privado</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Central Limpio con la tipografía y faro con luz */}
      <main className="max-w-4xl w-full mx-auto px-6 py-16 sm:py-24 flex flex-col items-center text-center relative z-10 space-y-8 my-auto">
        {/* Faro animado con el haz de luz giratorio */}
        <div className="relative">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-slate-950 border-2 border-rose-500/50 flex items-center justify-center shadow-2xl shadow-rose-950/80 p-2 relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-rose-600/30 via-rose-500/15 to-amber-500/25 pointer-events-none" />
            <MdqBrandIcon className="w-full h-full relative z-10" />
          </div>
          <div className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full bg-rose-600 text-[10px] font-black tracking-wider text-white shadow-lg uppercase border border-rose-400/40 animate-pulse">
            Próximamente
          </div>
        </div>

        {/* Marca con su tipografía exacta */}
        <div className="space-y-4 max-w-2xl">
          <h1 className="font-mono font-black text-4xl sm:text-6xl md:text-7xl tracking-tight text-white leading-none">
            MDQ<span className="text-rose-500">SHOW</span>
          </h1>
          <p className="text-sm sm:text-lg text-slate-400 font-medium tracking-wide">
            Cartelera de recitales y shows en Mar del Plata
          </p>
          <div className="pt-2">
            <p className="text-base sm:text-xl text-slate-300 font-normal leading-relaxed max-w-xl mx-auto">
              Muy pronto vas a poder consultar todos los recitales, fechas oficiales, lugares y venta de entradas en un solo lugar.
            </p>
          </div>
        </div>
      </main>

      {/* Footer Minimalista Original */}
      <footer className="max-w-7xl w-full mx-auto px-6 py-6 text-center text-xs text-slate-500 border-t border-slate-800/80 relative z-10">
        <p>© {new Date().getFullYear()} MDQSHOW • Cartelera de recitales y shows en Mar del Plata</p>
      </footer>

      {/* Modal Acceso Privado */}
      {showSecretPrompt && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mx-auto mb-4 text-rose-400">
              <Lock className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-white text-center mb-1">Acceso a Cartelera Completa</h3>
            <p className="text-xs text-slate-400 text-center mb-6">
              Ingresá tu clave de administración para visualizar la plataforma completa.
            </p>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <input
                  type="password"
                  autoFocus
                  placeholder="Ingresá la clave..."
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(false);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
                {error && (
                  <p className="text-xs text-rose-400 mt-1.5 pl-1 font-medium">Clave incorrecta.</p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowSecretPrompt(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-800 text-xs font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-950/40 transition-colors"
                >
                  Entrar a la Web
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
