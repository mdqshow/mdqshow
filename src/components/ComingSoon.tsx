import React, { useState } from 'react';
import { Sparkles, Lock } from 'lucide-react';
import faroLogo from '../assets/images/faro_rocker_mascot_1790285020797.jpg';

interface ComingSoonProps {
  onUnlockAdmin: () => void;
}

export const ComingSoon: React.FC<ComingSoonProps> = ({ onUnlockAdmin }) => {
  const [showSecretPrompt, setShowSecretPrompt] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Clave solicitada por Christian
    if (password === 'MDQ2026mdq') {
      localStorage.setItem('mdqshow_preview_access', 'true');
      onUnlockAdmin();
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-100 flex flex-col justify-between selection:bg-rose-500 selection:text-white relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-10 left-10 w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Header */}
      <header className="max-w-6xl w-full mx-auto px-6 py-8 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img 
              src={faroLogo} 
              alt="MDQSHOW Faro Logo" 
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl object-cover border-2 border-rose-500/40 shadow-lg shadow-rose-950/50"
            />
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#0a0d14] rounded-full animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-white">MDQ<span className="text-rose-500">SHOW</span></span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">Mar del Plata • Cartelera Oficial</p>
          </div>
        </div>

        {/* Botón discreto de acceso privado */}
        <button
          onClick={() => setShowSecretPrompt(true)}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 px-3 py-1.5 rounded-full transition-all duration-200"
          title="Acceso exclusivo para administradores y anunciantes"
        >
          <Lock className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Acceso privado</span>
        </button>
      </header>

      {/* Hero Central Limpio y Minimalista */}
      <main className="max-w-4xl w-full mx-auto px-6 py-16 sm:py-24 flex flex-col items-center text-center relative z-10 space-y-8 my-auto">
        {/* Badge Próximamente */}
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-rose-500/15 via-amber-500/15 to-rose-500/15 border border-rose-500/30 text-rose-300 text-xs sm:text-sm font-semibold tracking-wide shadow-lg shadow-rose-950/30 animate-pulse">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>MUY PRONTO EN MAR DEL PLATA</span>
        </div>

        {/* Titular Impactante */}
        <div className="space-y-5 max-w-2xl">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight leading-[1.08]">
            Todos los recitales en un solo lugar.
          </h1>
          <p className="text-base sm:text-xl text-slate-300 font-normal leading-relaxed">
            Estamos preparando la plataforma definitiva de shows y recitales en vivo de <span className="text-white font-semibold underline decoration-rose-500 decoration-2 underline-offset-4">Mar del Plata</span>. Cartelera al día, venta oficial de entradas y agenda cultural.
          </p>
        </div>
      </main>

      {/* Footer Minimalista */}
      <footer className="max-w-6xl w-full mx-auto px-6 py-6 text-center text-xs text-slate-600 border-t border-slate-900/80 relative z-10">
        <p>© 2025 MDQSHOW • Mar del Plata, Buenos Aires, Argentina</p>
      </footer>

      {/* Modal Acceso Privado para vos y anunciantes */}
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
