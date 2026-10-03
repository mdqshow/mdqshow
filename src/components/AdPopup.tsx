import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { Sponsor } from '../types';
import { SponsorCard } from './SponsorCard';
import { trackBannerImpression } from '../services/metricsService';
import { INITIAL_SPONSORS } from '../data/mockSponsors';

interface AdPopupProps {
  sponsors?: Sponsor[];
  isAdmin?: boolean;
}

const COUNTDOWN_SECONDS = 5;
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

export const AdPopup: React.FC<AdPopupProps> = ({ sponsors = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [adSponsor, setAdSponsor] = useState<Sponsor | null>(null);
  const [timeLeft, setTimeLeft] = useState(COUNTDOWN_SECONDS);
  const [progress, setProgress] = useState(100);
  const hasTriggeredRef = useRef(false);

  const canClose = timeLeft <= 0;

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

  // Selección automática al cargar la web
  useEffect(() => {
    if (hasTriggeredRef.current) return;
    const pool = sponsors && sponsors.length > 0 ? sponsors : INITIAL_SPONSORS;
    const chosen = pickSponsor(pool);
    if (!chosen) return;

    const openTimer = window.setTimeout(() => {
      if (hasTriggeredRef.current) return;
      hasTriggeredRef.current = true;
      rememberSponsor(chosen);
      setAdSponsor(chosen);
      setTimeLeft(COUNTDOWN_SECONDS);
      setProgress(100);
      setIsClosing(false);
      setIsOpen(true);
      if (chosen.id && chosen.name) {
        trackBannerImpression(chosen.id, chosen.name, chosen.address || 'Popup');
      }
    }, OPEN_DELAY_MS);

    return () => window.clearTimeout(openTimer);
  }, [sponsors]);

  // Disparo manual para pruebas desde el panel de administración
  useEffect(() => {
    const handleTrigger = (event: CustomEvent<{ sponsorId?: string }>) => {
      const pool = sponsors && sponsors.length > 0 ? sponsors : INITIAL_SPONSORS;
      if (pool.length === 0) return;

      let chosen: Sponsor | null | undefined;
      if (event.detail && event.detail.sponsorId) {
        chosen = pool.find((s) => s.id === event.detail.sponsorId);
      }
      if (!chosen) chosen = pickSponsor(pool);
      if (!chosen) return;

      setAdSponsor(chosen);
      setTimeLeft(COUNTDOWN_SECONDS);
      setProgress(100);
      setIsClosing(false);
      setIsOpen(true);
    };

    window.addEventListener('mdq_trigger_ad_popup' as any, handleTrigger);
    return () => window.removeEventListener('mdq_trigger_ad_popup' as any, handleTrigger);
  }, [sponsors]);

  // Cuenta regresiva: el aviso se puede cerrar recién a los 5 segundos
  useEffect(() => {
    if (!isOpen || !adSponsor) return;

    const startTime = Date.now();
    const durationMs = COUNTDOWN_SECONDS * 1000;

    const interval = window.setInterval(() => {
      const remainingMs = Math.max(0, durationMs - (Date.now() - startTime));
      setTimeLeft(Math.ceil(remainingMs / 1000));
      setProgress((remainingMs / durationMs) * 100);
      if (remainingMs <= 0) window.clearInterval(interval);
    }, 40);

    return () => window.clearInterval(interval);
  }, [isOpen, adSponsor]);

  // Bloquea el scroll de fondo mientras el aviso está abierto
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  // Esc cierra el aviso (solo cuando ya terminó la cuenta regresiva)
  useEffect(() => {
    if (!isOpen || !canClose) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePopup();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, canClose, closePopup]);

  if (!isOpen || !adSponsor) return null;

  // Anillo de cuenta regresiva
  const RING_RADIUS = 16;
  const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Publicidad"
      className={`fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/75 backdrop-blur-md overflow-y-auto select-none ${
        isClosing ? 'mdq-popup-overlay-out' : 'mdq-popup-overlay-in'
      }`}
      onClick={() => {
        if (canClose) closePopup();
      }}
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

          {/* Cuenta regresiva que se convierte en botón de cerrar */}
          <div className="absolute -top-3 -right-3 z-20">
            {canClose ? (
              <button
                type="button"
                onClick={closePopup}
                aria-label="Cerrar publicidad"
                className="mdq-popup-fade-up w-10 h-10 rounded-full bg-white text-slate-900 shadow-lg shadow-black/50 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer"
              >
                <X className="w-5 h-5" strokeWidth={2.5} />
              </button>
            ) : (
              <div className="relative w-10 h-10 rounded-full bg-slate-950/90 backdrop-blur shadow-lg shadow-black/50 flex items-center justify-center">
                <svg className="absolute inset-0 -rotate-90" viewBox="0 0 40 40" aria-hidden="true">
                  <circle cx="20" cy="20" r={RING_RADIUS} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2.5" />
                  <circle
                    cx="20"
                    cy="20"
                    r={RING_RADIUS}
                    fill="none"
                    stroke="rgb(251 191 36)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray={RING_LENGTH}
                    strokeDashoffset={RING_LENGTH * (1 - progress / 100)}
                  />
                </svg>
                <span className="relative text-xs font-black text-amber-300">{timeLeft}</span>
              </div>
            )}
          </div>
        </div>

        <p className="relative mt-4 text-center text-[10px] font-semibold tracking-[0.3em] uppercase text-white/45">
          Publicidad
        </p>
      </div>
    </div>
  );
};
