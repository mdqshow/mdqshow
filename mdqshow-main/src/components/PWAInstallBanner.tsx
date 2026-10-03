import React, { useState } from 'react';
import { Smartphone, Download, Share, PlusSquare, X, CheckCircle2, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    return sessionStorage.getItem('mdqshow_pwa_dismissed') === 'true';
  });

  // If already running as installed PWA standalone or user dismissed in this session, don't show full banner
  if (isInstalled || dismissed) {
    return null;
  }

  // Only show if installable or on iOS Safari
  if (!isInstallable && !isIOS) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('mdqshow_pwa_dismissed', 'true');
  };

  const handleAction = () => {
    if (isIOS) {
      setShowIOSModal(true);
    } else {
      install();
    }
  };

  return (
    <>
      {/* Floating Modern Install Banner at bottom */}
      <aside aria-label="Instalar aplicación" className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-40 bg-slate-900/95 border border-rose-500/40 rounded-2xl p-4 shadow-2xl shadow-black/80 backdrop-blur-md">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center shrink-0 shadow-lg shadow-rose-950/50">
            <Smartphone className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400 uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Instalá MDQSHOW en tu cel</span>
            </div>
            <h4 className="text-sm font-bold text-white leading-tight mt-0.5">
              Tené la cartelera de La Feliz a mano
            </h4>
            <p className="text-xs text-slate-300 mt-1 line-clamp-2">
              Accedé en 1 toque desde tu pantalla de inicio, sin ocupar espacio y con carga instantánea.
            </p>

            <div className="flex items-center gap-2 mt-3">
              <button
                type="button"
                onClick={handleAction}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white text-xs font-bold shadow-md shadow-rose-900/50 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <Download className="w-3.5 h-3.5 shrink-0" />
                <span>{isIOS ? 'Cómo instalar en iPhone' : 'Descargar / Instalar'}</span>
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                title="Cerrar aviso"
              >
                Ahora no
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="text-slate-400 hover:text-white p-1 -mr-1 -mt-1 rounded-lg hover:bg-slate-800 transition-colors"
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Guided iOS Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-100 relative">
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mb-4 text-rose-400">
              <Smartphone className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-black text-white tracking-tight">
              Instalar en iPhone o iPad
            </h3>
            <p className="text-xs text-slate-400 mt-1 mb-5">
              En Safari para iOS se instala en 2 simples toques:
            </p>

            <div className="space-y-3.5">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Share className="w-4 h-4" />
                </div>
                <div className="text-xs text-slate-300">
                  <strong className="text-white block font-semibold mb-0.5">1. Tocá el botón Compartir</strong>
                  En la barra inferior de Safari, tocá el ícono de <strong>Compartir</strong> (el cuadrado con la flecha hacia arriba).
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                  <PlusSquare className="w-4 h-4" />
                </div>
                <div className="text-xs text-slate-300">
                  <strong className="text-white block font-semibold mb-0.5">2. &quot;Agregar a pantalla de inicio&quot;</strong>
                  Buscá y seleccioná la opción <span className="text-rose-400 font-semibold">&quot;Agregar a pantalla de inicio&quot;</span> o <span className="text-rose-400 font-semibold">&quot;Añadir a inicio&quot;</span>.
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="text-xs text-slate-300">
                  <strong className="text-white block font-semibold mb-0.5">3. ¡Listo!</strong>
                  Tocá <strong>&quot;Agregar&quot;</strong> arriba a la derecha. Vas a tener el ícono de MDQSHOW en tu pantalla principal como una app nativa.
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="mt-6 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const PWAInstallNavbarButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);

  // If already installed, hide
  if (isInstalled) {
    return null;
  }

  // If neither installable prompt nor iOS, still provide a clean guide button so users can know how to install
  const handleClick = () => {
    if (isIOS) {
      setShowIOSModal(true);
    } else if (isInstallable) {
      install();
    } else {
      // General prompt or alert dialog
      setShowIOSModal(true);
    }
  };

  return (
    <>
      <button
        type="button"
        id="navbar-install-app-btn"
        onClick={handleClick}
        className="flex items-center px-2.5 sm:px-3 py-2 rounded-xl text-xs font-bold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all cursor-pointer shadow-xs hover:scale-[1.02] active:scale-[0.98]"
        title="Instalar o descargar app de MDQSHOW en tu celular"
      >
        <Smartphone className="w-3.5 h-3.5 mr-1.5 text-rose-400 shrink-0" />
        <span className="hidden sm:inline">Instalar App</span>
        <span className="sm:hidden">App</span>
      </button>

      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-100 relative">
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mb-4 text-rose-400">
              <Smartphone className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-black text-white tracking-tight">
              Instalar MDQSHOW en el Celular
            </h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              ¡Es una PWA (Progressive Web App)! Se instala al instante sin pasar por tiendas ni descargas pesadas:
            </p>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                <strong className="text-rose-400 block font-bold mb-1">🤖 En Android (Chrome / Brave / Edge):</strong>
                Tocá los 3 puntitos de arriba a la derecha y elegí <strong>&quot;Instalar aplicación&quot;</strong> o <strong>&quot;Agregar a la pantalla principal&quot;</strong>.
              </div>

              <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                <strong className="text-rose-400 block font-bold mb-1">🍎 En iPhone / iPad (Safari):</strong>
                Tocá el botón de <strong>Compartir</strong> (cuadrado con flecha hacia arriba) y elegí <strong>&quot;Agregar a pantalla de inicio&quot;</strong>.
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              ¡Entendido!
            </button>
          </div>
        </div>
      )}
    </>
  );
};
