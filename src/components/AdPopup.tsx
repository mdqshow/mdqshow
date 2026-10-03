import React, { useState, useEffect, useRef } from 'react';
import { 
  ExternalLink, 
  Sparkles, 
  MapPin, 
  Megaphone,
  CheckCircle2,
  X
} from 'lucide-react';
import { Sponsor } from '../types';
import { SponsorCard } from './SponsorCard';
import { trackBannerClick, trackBannerImpression } from '../services/metricsService';
import { INITIAL_SPONSORS } from '../data/mockSponsors';

interface AdPopupProps {
  sponsors?: Sponsor[];
  isAdmin?: boolean;
}

export const AdPopup: React.FC<AdPopupProps> = ({ sponsors = [], isAdmin }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [adSponsor, setAdSponsor] = useState<Sponsor | null>(null);
  const [timeLeft, setTimeLeft] = useState(5);
  const [progress, setProgress] = useState(100);
  const hasTriggeredRef = useRef(false);

  // Seleccionar sponsor para el popup de inicio
  useEffect(() => {
    if (hasTriggeredRef.current) return;
    const pool = (sponsors && sponsors.length > 0) ? sponsors : INITIAL_SPONSORS;
    if (pool.length === 0) return;

    // Filtrar los sponsors marcados específicamente para el popup de inicio
    const popupSponsors = pool.filter(s => s.isActive !== false && s.showInPopup === true);
    const validPool = popupSponsors.length > 0 ? popupSponsors : pool.filter(s => s.isActive !== false);

    const randomIndex = Math.floor(Math.random() * validPool.length);
    const chosen = validPool[randomIndex] || validPool[0] || pool[0];

    if (!chosen) return;

    // Abrir luego de un ligero delay de entrada al cargar la página (350ms)
    const openTimer = setTimeout(() => {
      if (hasTriggeredRef.current) return;
      hasTriggeredRef.current = true;
      setAdSponsor(chosen);
      setIsOpen(true);
      setTimeLeft(5);
      setProgress(100);
      if (chosen.id && chosen.name) {
        trackBannerImpression(chosen.id, chosen.name, chosen.address || 'Popup');
      }
    }, 350);

    return () => clearTimeout(openTimer);
  }, [sponsors]);

  // Permitir disparar manualmente para pruebas (botón en el footer o en el panel admin)
  useEffect(() => {
    const handleTrigger = (event: CustomEvent<{ sponsorId?: string }>) => {
      const pool = (sponsors && sponsors.length > 0) ? sponsors : INITIAL_SPONSORS;
      if (pool.length === 0) return;

      let chosen: Sponsor | undefined;
      if (event.detail && event.detail.sponsorId) {
        chosen = pool.find(s => s.id === event.detail.sponsorId);
      }
      if (!chosen) {
        const popupSponsors = pool.filter(s => s.isActive !== false && s.showInPopup === true);
        const validPool = popupSponsors.length > 0 ? popupSponsors : pool;
        chosen = validPool[Math.floor(Math.random() * validPool.length)] || pool[0];
      }

      setAdSponsor(chosen);
      setTimeLeft(5);
      setProgress(100);
      setIsOpen(true);
    };

    window.addEventListener('mdq_trigger_ad_popup' as any, handleTrigger);
    return () => window.removeEventListener('mdq_trigger_ad_popup' as any, handleTrigger);
  }, [sponsors]);

  // Cuenta regresiva obligatoria de 5 segundos no saltable
  useEffect(() => {
    if (!isOpen || !adSponsor) return;

    const startTime = Date.now();
    const durationMs = 5000;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remainingMs = Math.max(0, durationMs - elapsed);
      const remainingSec = Math.ceil(remainingMs / 1000);
      
      setTimeLeft(remainingSec);
      setProgress((remainingMs / durationMs) * 100);

      if (remainingMs <= 0) {
        clearInterval(interval);
        setTimeLeft(0);
        setProgress(0);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [isOpen, adSponsor]);

  if (!isOpen || !adSponsor) return null;

  const isImageSponsor = adSponsor.type === 'image' && Boolean(adSponsor.image);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto select-none"
    >
      <div 
        className="relative w-full max-w-md bg-slate-900 border-2 border-amber-500/70 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl shadow-amber-950/70 transform transition-all my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra de progreso de cuenta regresiva en la parte superior */}
        <div className="w-full bg-slate-950 h-1.5 overflow-hidden">
          <div 
            className="h-full bg-linear-to-r from-amber-500 via-rose-500 to-amber-400 transition-all ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Encabezado: Indicador de Sponsor Oficial y Segundero obligatorio */}
        <div className="px-4 py-2.5 bg-slate-950/95 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-950/60 border border-amber-500/40 text-amber-300 text-[11px] font-bold">
            <Megaphone className="w-3 h-3 text-amber-400 animate-pulse" />
            <span className="tracking-wider uppercase">SPONSOR OFICIAL • MDQSHOW</span>
          </div>

          {timeLeft > 0 ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-850 border border-amber-500/30 text-amber-300 text-[11px] font-bold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>Podés cerrar en {timeLeft}s</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-md cursor-pointer transition-all animate-pulse"
              title="Cerrar anuncio"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cerrar</span>
            </button>
          )}
        </div>

        {/* Contenido del Sponsor: Imagen o Texto con 2 renglones y transiciones dinámicas */}
        {isImageSponsor ? (
          <div className="p-4 sm:p-5 space-y-4">
            <div className="relative h-44 sm:h-52 w-full rounded-2xl overflow-hidden border border-amber-500/30 bg-black shadow-lg">
              <img 
                src={adSponsor.image} 
                alt={adSponsor.name}
                className="w-full h-full object-cover object-center"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />
              
              <div className="absolute bottom-3 left-3 right-3 text-left">
                <h3 className="text-xl sm:text-2xl font-black text-white uppercase drop-shadow-md tracking-wider">
                  {adSponsor.name}
                </h3>
                {adSponsor.address && (
                  <p className="text-xs sm:text-sm font-bold text-amber-300 uppercase tracking-wide drop-shadow-sm flex items-center mt-0.5">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-amber-400 shrink-0" />
                    <span>{adSponsor.address}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Botón de acción */}
            <div>
              {adSponsor.link ? (
                <a
                  href={adSponsor.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    trackBannerClick(adSponsor.id, adSponsor.name);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center justify-center py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 text-xs sm:text-sm font-black shadow-lg shadow-amber-950/60 transition-all cursor-pointer tracking-wider uppercase"
                >
                  <span>Conocer Más / Visitar Sponsor</span>
                  <ExternalLink className="w-4 h-4 ml-2 shrink-0 opacity-90" />
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
                >
                  Continuar a la Cartelera
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Publicidad de Solo Texto: 2 renglones con animación dinámica al azar */
          <div className="p-4 sm:p-5 space-y-4">
            <div className="overflow-hidden rounded-2xl">
              <SponsorCard 
                sponsor={adSponsor}
                heightClass="h-40 sm:h-44"
                showBadge={false}
                variant="popup"
              />
            </div>

            {/* Botón de acción */}
            <div>
              {adSponsor.link ? (
                <a
                  href={adSponsor.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    trackBannerClick(adSponsor.id, adSponsor.name);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center justify-center py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 text-xs sm:text-sm font-black shadow-lg shadow-amber-950/60 transition-all cursor-pointer tracking-wider uppercase"
                >
                  <span>Visitar Web / Instagram</span>
                  <ExternalLink className="w-4 h-4 ml-2 shrink-0 opacity-90" />
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
                >
                  Continuar a la Cartelera
                </button>
              )}
            </div>
          </div>
        )}

        {/* Pie informativo sutil */}
        <div className="px-4 py-2 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-center text-[10px] text-slate-400 gap-1.5">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>Apoyando a los espectáculos y cultura de Mar del Plata</span>
        </div>
      </div>
    </div>
  );
};
