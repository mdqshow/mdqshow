import React, { useState, useEffect, useRef, useCallback } from 'react';
import { isSponsorPaused } from '../utils/sponsorStatus';
import { Sponsor, Show } from '../types';
import { SponsorCard } from './SponsorCard';
import { ShowPopupCard } from './ShowPopupCard';
import { isShowPast } from '../utils/dateHelpers';
import { trackBannerImpression } from '../services/metricsService';
import { auth } from '../firebase';

interface AdPopupProps {
  sponsors?: Sponsor[];
  shows?: Show[];
  isAdmin?: boolean;
}

// Lo que puede mostrar el aviso de inicio: un sponsor o un recital marcado con POP UP
type PopupItem = { kind: 'sponsor'; sponsor: Sponsor } | { kind: 'show'; show: Show };

const itemKey = (item: PopupItem): string =>
  item.kind === 'show' ? `show:${item.show.id}` : `sponsor:${item.sponsor.id}`;

// Recitales con POP UP que todavía no pasaron
const popupShowsOf = (shows: Show[]): Show[] => shows.filter((s) => s.showInPopup === true && !isShowPast(s.dates));

const POPUP_DURATION_SECONDS = 5; // el aviso se cierra solo cuando el borde completa la vuelta
const OPEN_DELAY_MS = 1200; // deja que la cartelera cargue y que lleguen los sponsors de la nube
const CLOSE_ANIMATION_MS = 380;
const LAST_POPUP_KEY = 'mdqshow_last_popup_item';

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

function pickItem(sponsors: Sponsor[], shows: Show[]): PopupItem | null {
  // Los sponsors en pausa (sin ninguna ubicación elegida) no se muestran
  const active = sponsors.filter((s) => s.isActive !== false && !isSponsorPaused(s));
  const sponsorItems: PopupItem[] = active
    .filter((s) => s.showInPopup === true)
    .map((sponsor): PopupItem => ({ kind: 'sponsor', sponsor }));
  const showItems: PopupItem[] = popupShowsOf(shows).map((show): PopupItem => ({ kind: 'show', show }));

  let candidates: PopupItem[] = [...sponsorItems, ...showItems];
  // Si nada está marcado para el popup, se usa cualquier sponsor activo (como antes)
  if (candidates.length === 0) candidates = active.map((sponsor): PopupItem => ({ kind: 'sponsor', sponsor }));
  if (candidates.length === 0) return null;

  // Rotación: se alterna entre sponsors y recitales, y se evita repetir el mismo aviso de la última vez
  try {
    const lastKey = localStorage.getItem(LAST_POPUP_KEY);
    if (lastKey && candidates.length > 1) {
      const lastKind = lastKey.startsWith('show:') ? 'show' : 'sponsor';
      const otherKind = candidates.filter((c) => c.kind !== lastKind);
      if (otherKind.length > 0) candidates = otherKind;
      const others = candidates.filter((c) => itemKey(c) !== lastKey);
      if (others.length > 0) candidates = others;
    }
  } catch {
    // ignore
  }

  return candidates[Math.floor(Math.random() * candidates.length)] || candidates[0];
}

export const AdPopup: React.FC<AdPopupProps> = ({ sponsors = [], shows = [], isAdmin = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [adItem, setAdItem] = useState<PopupItem | null>(null);
  const [progress, setProgress] = useState(0); // 0 = recién abierto, 1 = el borde completó la vuelta
  const hasTriggeredRef = useRef(false);
  const openedManuallyRef = useRef(false); // true si lo abrió el botón de prueba del admin
  const testIndexRef = useRef(0); // para que el botón de prueba recorra los avisos uno por uno
  const latestRef = useRef({ sponsors, shows });
  latestRef.current = { sponsors, shows };

  const rememberItem = (item: PopupItem) => {
    try {
      localStorage.setItem(LAST_POPUP_KEY, itemKey(item));
    } catch {
      // ignore
    }
  };

  const closePopup = useCallback(() => {
    setIsClosing(true);
    window.setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
      // Avisa que el aviso ya se cerró (el panel de sponsors lo usa para volver a abrirse después de una prueba)
      window.dispatchEvent(new CustomEvent('mdq_ad_popup_closed'));
    }, CLOSE_ANIMATION_MS);
  }, []);

  // Selección automática al cargar la web (el administrador no ve este aviso).
  // La elección se hace recién cuando pasa la espera, con los datos que ya llegaron (sponsors y recitales).
  useEffect(() => {
    if (hasTriggeredRef.current) return;
    if (pickItem(sponsors || [], shows || []) === null) return;

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

      const chosen = pickItem(latestRef.current.sponsors || [], latestRef.current.shows || []);
      if (!chosen) return;

      hasTriggeredRef.current = true;
      openedManuallyRef.current = false;
      rememberItem(chosen);
      setAdItem(chosen);
      setProgress(0);
      setIsClosing(false);
      setIsOpen(true);
      if (chosen.kind === 'sponsor' && chosen.sponsor.id && chosen.sponsor.name) {
        trackBannerImpression(chosen.sponsor.id, chosen.sponsor.name, chosen.sponsor.address || 'Popup');
      }
    }, OPEN_DELAY_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(openTimer);
    };
  }, [sponsors, shows]);

  // Si el administrador inicia sesión mientras el aviso automático está abierto, se cierra
  useEffect(() => {
    if (isAdmin && isOpen && !openedManuallyRef.current) {
      closePopup();
    }
  }, [isAdmin, isOpen, closePopup]);

  // Disparo manual para pruebas desde el panel de administración
  useEffect(() => {
    const handleTrigger = (event: CustomEvent<{ sponsorId?: string; showId?: string }>) => {
      const sponsorPool = sponsors || [];
      const showPool = shows || [];

      let chosen: PopupItem | null = null;
      if (event.detail && event.detail.sponsorId) {
        const found = sponsorPool.find((s) => s.id === event.detail.sponsorId);
        if (found) chosen = { kind: 'sponsor', sponsor: found };
      } else if (event.detail && event.detail.showId) {
        const found = showPool.find((s) => s.id === event.detail.showId);
        if (found) chosen = { kind: 'show', show: found };
      }
      if (!chosen) {
        // Botón de prueba general: muestra los avisos de a uno, en orden, para poder ver todos
        const list: PopupItem[] = [
          ...sponsorPool.filter((s) => s.isActive !== false).map((sponsor): PopupItem => ({ kind: 'sponsor', sponsor })),
          ...popupShowsOf(showPool).map((show): PopupItem => ({ kind: 'show', show })),
        ];
        if (list.length === 0) return;
        chosen = list[testIndexRef.current % list.length];
        testIndexRef.current += 1;
      }

      openedManuallyRef.current = true;
      setAdItem(chosen);
      setProgress(0);
      setIsClosing(false);
      setIsOpen(true);
    };

    window.addEventListener('mdq_trigger_ad_popup' as any, handleTrigger);
    return () => window.removeEventListener('mdq_trigger_ad_popup' as any, handleTrigger);
  }, [sponsors, shows]);

  // Temporizador: el borde da una vuelta completa en 5 segundos y al terminar el aviso se cierra solo
  useEffect(() => {
    if (!isOpen || !adItem) return;

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
  }, [isOpen, adItem, closePopup]);

  // Bloquea el scroll de fondo mientras el aviso está abierto
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  if (!isOpen || !adItem) return null;

  const isShow = adItem.kind === 'show';

  // Borde que da la vuelta: el color recorre toda la rueda de colores (arranca en ámbar)
  const borderColor = `hsl(${(40 + progress * 360) % 360} 95% 60%)`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isShow ? 'Recital destacado' : 'Main sponsor'}
      className={`fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/75 backdrop-blur-md overflow-y-auto select-none ${
        isClosing ? 'mdq-popup-overlay-out' : 'mdq-popup-overlay-in'
      }`}
    >
      <style>{POPUP_STYLES}</style>

      <div
        className={`relative w-full ${isShow ? 'max-w-sm' : 'max-w-md'} my-auto ${isClosing ? 'mdq-popup-card-out' : 'mdq-popup-card-in'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Resplandor suave detrás del aviso */}
        <div className="mdq-popup-glow pointer-events-none absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-amber-500/40 via-rose-500/25 to-amber-300/30 blur-2xl" />

        {/* Aviso: un recital (foto con los datos) o un sponsor (texto, imagen o video) */}
        <div className="relative">
          {adItem.kind === 'show' ? (
            <ShowPopupCard show={adItem.show} onClick={closePopup} />
          ) : (
            <SponsorCard
              sponsor={adItem.sponsor}
              heightClass="h-64 sm:h-72"
              showBadge={false}
              variant="popup"
              onClick={closePopup}
            />
          )}

          {/* Borde de la tarjeta, en sentido antihorario: da una vuelta completa cambiando de color; al volver al inicio el aviso se cierra solo */}
          <div className="pointer-events-none absolute inset-0 z-20 rounded-2xl overflow-hidden" aria-hidden="true">
            <svg className="w-full h-full overflow-hidden" style={{ transform: 'scaleX(-1)' }}>
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
          {isShow ? 'MDQSHOW' : 'Main Sponsor'}
        </p>
      </div>
    </div>
  );
};
