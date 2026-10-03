import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sponsor } from '../types';
import { SponsorCard } from './SponsorCard';
import { trackBannerImpression } from '../services/metricsService';
import { INITIAL_SPONSORS } from '../data/mockSponsors';
import { auth } from '../firebase';

interface AdPopupProps {
  sponsors?: Sponsor[];
  isAdmin?: boolean;
}

const POPUP_DURATION_SECONDS = 5; // el aviso se cierra solo cuando el borde completa la vuelta
const OPEN_DELAY_MS = 1200; // deja que la cartelera cargue y que lleguen los sponsors de la nube
const CLOSE_ANIMATION_MS = 380;
const LAST_POPUP_KEY = 'mdqshow_last_popup_sponsor';

const POPUP_STYLES = `
@keyframes mdqOverlayIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes mdqOverlayOut { from { opacity: 1; } to { opacity: 0; } }
@keyframes mdqCardIn {
  0%   { opacity: 0; transform: translateY(22px) scale(0.94); filter: blur(8px); }
  100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
}
@keyframes mdqCardOut {
  0%   { opacity: 1; transform: translateY(0) scale(1); }
  100% { opacity: 0; transform: translateY(12px) scale(0.97); }
}
@keyframes mdqGlow {
  0%, 100% { opacity: 0.35; transform: scale(1); }
  50%      { opacity: 0.65; transform: scale(1.03); }
}
@keyframes mdqFadeUp {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
.mdq-popup-overlay-in  { animation: mdqOverlayIn 0.55s ease-out both; }
.mdq-popup-overlay-out { animation: mdqOverlayOut 0.38s ease-in both; }
.mdq-popup-card-in     { animation: mdqCardIn 0.85s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both; }
.mdq-popup-card-out    { animation: mdqCardOut 0.38s ease-in both; }
.mdq-popup-glow        { animation: mdqGlow 3.6s ease-in-out infinite; }
.mdq-popup-fade-up     { animation: mdqFadeUp 0.6s ease-out both; }
@media (prefers-reduced-motion: reduce) {
  .mdq-popup-overlay-in, .mdq-popup-overlay-out,
  .mdq-popup-card-in, .mdq-popup-card-out,
  .mdq-popup-glow, .mdq-popup-fade-up { animation-duration: 0.01ms; animation-iteration-count: 1; }
}
`;

function pickSponsor(pool: Sponsor[]): Sponsor | null {
  const active = pool.filter((s) => s.isActive !== false);
  // Solo los marcados para el popup; si ninguno lo está, no se muestra nada raro: se usa cualquiera activo
  const forPopup = active.filter((s) => s.showInPopup === true);
  let candidates = forPopup.length > 0 ? forPopup : active;
  if (candidates.length === 0) return null;

  // Rotación: evita repetir el mismo aviso que se vio la última vez
  try {
    const lastId = localStorage.getItem(LAST_POPUP_KEY);
    if (lastId && candidates.length > 1) {
      const others = candidates.filter((s) => s.id !== lastId);
      if (others.length > 0) candidates = others;
    }
  } catch {
    // ignore
  }

  return candidates[Math.floor(Math.random() * candidates.length)] || candidates[0];
}

export const AdPopup: React.FC<AdPopupProps> = ({ sponsors = [], isAdmin = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [adSponsor, setAdSponsor] = useState<Sponsor | null>(null);
  const [progress, setProgress] = useState(0); // 0 = recién abierto, 1 = el borde completó la vuelta
  const hasTriggeredRef = useRef(false);
  const openedManuallyRef = useRef(false); // true si lo abrió el botón de prueba del admin
  const testIndexRef = useRef(0); // para que el botón de prueba recorra los sponsors uno por uno

  const rememberSponsor = (sponsor: Sponsor) => {
    try {
      localStorage.setItem(LAST_POPUP_KEY, sponsor.id);
    } catch {
      // ignore
    }
  };

  const closePopup = useCallback(() => {
    setIsClosing(true);
    window.setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, CLOSE_ANIMATION_MS);
  }, []);

  // Selección automática al cargar la web (el administrador no ve este aviso)
  useEffect(() => {
    if (hasTriggeredRef.current) return;
    const pool = sponsors && sponsors.length > 0 ? sponsors : INITIAL_SPONSORS;
    const chosen = pickSponsor(pool);
    if (!chosen) return;

    let cancelled = false;
    const openTimer = window.setTimeout(async () => {
      // Esperar a que Firebase termine de reconocer la sesión; si hay un administrador logueado, no se muestra
      try {
        await auth.authStateReady();
      } catch {
        // ignore
      }
      if (cancelled || hasTriggeredRef.current) return;
      if (auth.currentUser) return;

      hasTriggeredRef.current = true;
      openedManuallyRef.current = false;
      rememberSponsor(chosen);
      setAdSponsor(chosen);
      setProgress(0);
      setIsClosing(false);
      setIsOpen(true);
      if (chosen.id && chosen.name) {
        trackBannerImpression(chosen.id, chosen.name, chosen.address || 'Popup');
      }
    }, OPEN_DELAY_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(openTimer);
    };
  }, [sponsors]);

  // Si el administrador inicia sesión mientras el aviso automático está abierto, se cierra
  useEffect(() => {
    if (isAdmin && isOpen && !openedManuallyRef.current) {
      closePopup();
    }
  }, [isAdmin, isOpen, closePopup]);

  // Disparo manual para pruebas desde el panel de administración
  useEffect(() => {
    const handleTrigger = (event: CustomEvent<{ sponsorId?: string }>) => {
      const pool = sponsors && sponsors.length > 0 ? sponsors : INITIAL_SPONSORS;
      if (pool.length === 0) return;

      let chosen: Sponsor | null | undefined;
      if (event.detail && event.detail.sponsorId) {
        chosen = pool.find((s) => s.id === event.detail.sponsorId);
      }
      if (!chosen) {
        // Botón de prueba general: muestra los sponsors activos de a uno, en orden, para poder ver todos
        const active = pool.filter((s) => s.isActive !== false);
        if (active.length === 0) return;
        chosen = active[testIndexRef.current % active.length];
        testIndexRef.current += 1;
      }

      openedManuallyRef.current = true;
      setAdSponsor(chosen);
      setProgress(0);
      setIsClosing(false);
      setIsOpen(true);
    };

    window.addEventListener('mdq_trigger_ad_popup' as any, handleTrigger);
    return () => window.removeEventListener('mdq_trigger_ad_popup' as any, handleTrigger);
  }, [sponsors]);

  // Temporizador: el borde da una vuelta completa en 5 segundos y al terminar el aviso se cierra solo
  useEffect(() => {
    if (!isOpen || !adSponsor) return;

    const startTime = performance.now();
    const durationMs = POPUP_DURATION_SECONDS * 1000;
    let frameId = 0;

    const tick = (now: number) => {
      const elapsed = Math.min(1, (now - startTime) / durationMs);
      setProgress(elapsed);
      if (elapsed >= 1) {
        closePopup();
        return;
      }
      frameId = window.requestAnimationFrame(tick);
    };
    frameId = window.requestAnimationFrame(tick);

    return () => window.cancelAnimationFrame(frameId);
  }, [isOpen, adSponsor, closePopup]);

  // Bloquea el scroll de fondo mientras el aviso está abierto
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  if (!isOpen || !adSponsor) return null;

  // Borde que da la vuelta: el color recorre toda la rueda de colores (arranca en ámbar)
  const borderColor = `hsl(${(40 + progress * 360) % 360} 95% 60%)`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Main sponsor"
      className={`fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/75 backdrop-blur-md overflow-y-auto select-none ${
        isClosing ? 'mdq-popup-overlay-out' : 'mdq-popup-overlay-in'
      }`}
    >
      <style>{POPUP_STYLES}</style>

      <div
        className={`relative w-full max-w-md my-auto ${isClosing ? 'mdq-popup-card-out' : 'mdq-popup-card-in'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Resplandor suave detrás del aviso */}
        <div className="mdq-popup-glow pointer-events-none absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-amber-500/40 via-rose-500/25 to-amber-300/30 blur-2xl" />

        {/* Aviso: texto, imagen o video (el mismo diseño que en la cartelera, en tamaño grande) */}
        <div className="relative">
          <SponsorCard
            sponsor={adSponsor}
            heightClass="h-64 sm:h-72"
            showBadge={false}
            variant="popup"
            onClick={closePopup}
          />

          {/* Borde de la tarjeta: da una vuelta completa cambiando de color; al volver al inicio el aviso se cierra solo */}
          <div className="pointer-events-none absolute inset-0 z-20 rounded-2xl overflow-hidden" aria-hidden="true">
            <svg className="w-full h-full overflow-hidden">
              <rect
                x="0"
                y="0"
                width="100%"
                height="100%"
                rx="16"
                ry="16"
                fill="none"
                stroke={borderColor}
                strokeWidth="8"
                pathLength={1}
                strokeDasharray="1"
                strokeDashoffset={1 - progress}
              />
            </svg>
          </div>
        </div>

        <p className="relative mt-4 text-center text-[10px] font-semibold tracking-[0.3em] uppercase text-white/45">
          Main Sponsor
        </p>
      </div>
    </div>
  );
};
