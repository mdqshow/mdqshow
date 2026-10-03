import React, { useState, useEffect } from 'react';
import { X, Smartphone, Download, Share, PlusSquare, CheckCircle2, Zap, WifiOff, BellRing } from 'lucide-react';
import { MdqBrandIcon } from './MdqBrandIcon';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  useEffect(() => {
    // Check if already running in standalone (installed app) mode
    const isApp = window.matchMedia('(display-mode: standalone)').matches || 
                  (window.navigator as any).standalone === true;
    setIsStandalone(isApp);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Capture beforeinstallprompt for Android / Chrome / Edge
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === 'accepted') {
      setInstallSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2500);
    }
    setDeferredPrompt(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Glow */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-full transition-colors cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with App Icon */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-rose-500/40 flex items-center justify-center shadow-lg p-2 shrink-0">
            <MdqBrandIcon className="w-full h-full" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20 inline-block mb-1">
              App Oficial MDQSHOW
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Instalá la app en tu celular
            </h3>
            <p className="text-xs text-slate-400">
              Llevá la cartelera de recitales de Mar del Plata siempre con vos
            </p>
          </div>
        </div>

        {/* Benefits Cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 text-center">
            <Zap className="w-5 h-5 text-amber-400 mx-auto mb-1.5" />
            <div className="text-xs font-bold text-white">Rápida</div>
            <div className="text-[10px] text-slate-400 leading-tight mt-0.5">Menos de 2 MB</div>
          </div>
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 text-center">
            <Smartphone className="w-5 h-5 text-rose-400 mx-auto mb-1.5" />
            <div className="text-xs font-bold text-white">Pantalla Completa</div>
            <div className="text-[10px] text-slate-400 leading-tight mt-0.5">Sin barras de navegador</div>
          </div>
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 text-center">
            <WifiOff className="w-5 h-5 text-cyan-400 mx-auto mb-1.5" />
            <div className="text-xs font-bold text-white">Modo Offline</div>
            <div className="text-[10px] text-slate-400 leading-tight mt-0.5">Funciona sin señal</div>
          </div>
        </div>

        {/* Status / Instructions based on OS */}
        {isStandalone ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-emerald-300">¡Ya estás usando la App instalada de MDQSHOW!</p>
            <p className="text-xs text-slate-400 mt-1">Podés acceder a ella directamente desde tu pantalla de inicio.</p>
          </div>
        ) : installSuccess ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-emerald-300">¡MDQSHOW instalada con éxito!</p>
            <p className="text-xs text-slate-400 mt-1">Buscá el ícono de MDQSHOW en tu menú de aplicaciones.</p>
          </div>
        ) : deferredPrompt ? (
          /* Android 1-Click Install */
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleInstallClick}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-rose-900/40 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
            >
              <Download className="w-5 h-5" />
              <span>Instalar MDQSHOW Ahora (Gratis)</span>
            </button>
            <p className="text-[11px] text-center text-slate-400">
              No requiere descargar nada de tiendas pesadas. Se instala directo en tu pantalla de inicio.
            </p>
          </div>
        ) : isIOS ? (
          /* iPhone / iOS Instructions */
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 space-y-3">
            <div className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>Instalación en iPhone (Safari):</span>
            </div>
            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center shrink-0 text-white font-bold">1</div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span>Tocá el botón</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-700 font-semibold text-white">
                    <Share className="w-3.5 h-3.5 text-blue-400" /> Compartir
                  </span>
                  <span>al pie de Safari.</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center shrink-0 text-white font-bold">2</div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span>Deslizá hacia abajo y seleccioná</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-700 font-semibold text-white">
                    <PlusSquare className="w-3.5 h-3.5 text-amber-400" /> Agregar al inicio
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center shrink-0 text-white font-bold">3</div>
                <span>¡Listo! Ya tenés el acceso directo con ícono propio en tu pantalla de inicio.</span>
              </div>
            </div>
          </div>
        ) : (
          /* Android / Chrome manual fallback if deferredPrompt is not yet triggered */
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 space-y-3">
            <div className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>Cómo instalar desde tu navegador:</span>
            </div>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center shrink-0 text-white font-bold">1</div>
                <span>Tocá el menú de los <strong>3 puntos</strong> en la esquina superior derecha del navegador (Chrome, Edge o Brave).</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center shrink-0 text-white font-bold">2</div>
                <span>Seleccioná <strong>"Instalar aplicación"</strong> o <strong>"Agregar a la pantalla principal"</strong>.</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center shrink-0 text-white font-bold">3</div>
                <span>Confirmá y tendrás el ícono de MDQSHOW instalado en tu celular como app nativa.</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-500">
            Tecnología Progressive Web App (PWA) compatible con Android, iPhone, Windows y Mac.
          </p>
        </div>
      </div>
    </div>
  );
};
