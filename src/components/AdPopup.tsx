import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  ExternalLink, 
  Ticket, 
  Calendar, 
  MapPin, 
  Flame, 
  Sparkles 
} from 'lucide-react';
import { Show } from '../types';
import { formatSingleDate, getDaysUntil } from '../utils/dateHelpers';
import { formatDisplayPrice } from '../utils/priceHelpers';
import { formatProperCase } from '../utils/textFormatting';

interface AdPopupProps {
  shows: Show[];
  onSelectShow?: (show: Show) => void;
  isAdmin?: boolean;
}

export const AdPopup: React.FC<AdPopupProps> = ({ shows, isAdmin }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [adShow, setAdShow] = useState<Show | null>(null);
  const [timeLeft, setTimeLeft] = useState(5);
  const [progress, setProgress] = useState(100);
  const hasTriggeredRef = useRef(false);

  // Trigger popup when page loads
  useEffect(() => {
    if (hasTriggeredRef.current) return;
    if (!shows || shows.length === 0) return;

    // Filter to upcoming shows or available shows
    const upcomingShows = shows.filter(s => 
      s.dates && s.dates.some(d => !getDaysUntil(d).isPast)
    );
    const validShows = upcomingShows.length > 0 ? upcomingShows : shows;

    // Pick a featured show or random show
    const featuredShows = validShows.filter(s => s.featured);
    const pool = featuredShows.length > 0 ? featuredShows : validShows;
    const randomIndex = Math.floor(Math.random() * pool.length);
    const chosenShow = pool[randomIndex] || shows[0];

    if (!chosenShow) return;

    hasTriggeredRef.current = true;
    setAdShow(chosenShow);

    // Open after a small initial entrance delay (600ms)
    const openTimer = setTimeout(() => {
      setIsOpen(true);
      setTimeLeft(5);
      setProgress(100);
    }, 600);

    return () => clearTimeout(openTimer);
  }, [shows]);

  // Allow manual trigger (e.g. from test button)
  useEffect(() => {
    const handleTrigger = () => {
      if (!shows || shows.length === 0) return;
      const featuredShows = shows.filter(s => s.featured);
      const pool = featuredShows.length > 0 ? featuredShows : shows;
      const chosen = pool[Math.floor(Math.random() * pool.length)] || shows[0];
      setAdShow(chosen);
      setTimeLeft(5);
      setProgress(100);
      setIsOpen(true);
    };

    window.addEventListener('mdq_trigger_ad_popup', handleTrigger);
    return () => window.removeEventListener('mdq_trigger_ad_popup', handleTrigger);
  }, [shows]);

  // Non-stop 5 seconds countdown (no pause)
  useEffect(() => {
    if (!isOpen || !adShow) return;

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
        setIsOpen(false);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [isOpen, adShow]);

  if (!isOpen || !adShow) return null;

  // Format price if available
  const getDisplayPrice = (raw?: string) => {
    if (!raw) return null;
    const trimmed = raw.trim();
    if (trimmed.toLowerCase().includes('gratis') || trimmed.toLowerCase().includes('libre')) {
      return 'Entrada gratuita';
    }
    const match = trimmed.match(/\$?\s*([0-9]{1,3}(?:\.[0-9]{3})+|[0-9]+)/);
    if (match) {
      const val = match[1].startsWith('$') ? match[1] : `$${match[1]}`;
      return `Entradas desde ${val}`;
    }
    return `Entradas: ${trimmed}`;
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto select-none"
    >
      <div 
        className="relative w-full max-w-md bg-slate-900 border-2 border-rose-500/60 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl shadow-rose-950/70 transform transition-all my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated Progress Bar pinned to top */}
        <div className="w-full bg-slate-950 h-1.5 overflow-hidden">
          <div 
            className="h-full bg-linear-to-r from-rose-500 via-amber-400 to-rose-600 transition-all ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Top Header Bar: Non-skippable mandatory indicator */}
        <div className="px-4 py-2.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-950/60 border border-rose-500/40 text-rose-300 text-[11px] font-bold">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="tracking-wider uppercase">NO TE PIERDAS ESTE SHOW</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-850 border border-amber-500/30 text-amber-300 text-[11px] font-bold shadow-xs">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>Continúa en {timeLeft}s</span>
          </div>
        </div>

        {/* Compact Ad Media Banner */}
        <div className="relative h-36 sm:h-44 w-full overflow-hidden bg-slate-950">
          <img 
            src={adShow.image} 
            alt={adShow.band}
            className="w-full h-full object-cover object-center"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-linear-to-t from-slate-900 via-slate-900/30 to-transparent pointer-events-none" />

          {/* Genre & Featured badges inside banner */}
          <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between">
            <span className="px-2 py-0.5 rounded-md bg-slate-950/90 backdrop-blur-md border border-white/10 text-[11px] font-semibold text-slate-200">
              {adShow.genre}
            </span>
            {adShow.featured && (
              <span className="flex items-center text-[11px] font-bold text-amber-300 bg-amber-950/90 border border-amber-500/50 px-2 py-0.5 rounded-md backdrop-blur-md">
                <Flame className="w-3 h-3 mr-1 text-amber-400" /> Show Estrella
              </span>
            )}
          </div>
        </div>

        {/* Compact Ad Body */}
        <div className="p-4 sm:p-5 space-y-3">
          <div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-tight">
              {adShow.band}
            </h3>
            {adShow.tourName && (
              <p className="text-xs font-semibold text-rose-400 mt-0.5 flex items-center">
                <Sparkles className="w-3 h-3 mr-1 shrink-0" />
                {adShow.tourName}
              </p>
            )}
          </div>

          {/* Venue & Location compact */}
          <div className="flex items-center text-xs text-slate-300 space-x-2 bg-slate-950/70 p-2 rounded-xl border border-slate-800">
            <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <div className="truncate">
              <span className="font-bold text-white">{formatProperCase(adShow.venue)}</span>
            </div>
          </div>

          {/* Date and Price line */}
          <div className="flex items-center justify-between text-xs pt-0.5">
            <div className="flex items-center space-x-1.5 text-slate-300 font-semibold truncate pr-2">
              <Calendar className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span className="truncate">
                {adShow.dates.map((d) => formatSingleDate(d)).join(' • ')}
              </span>
            </div>
            {adShow.ticketPriceRange ? (
              <span className="text-[11px] font-bold text-amber-300 whitespace-nowrap bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded-lg">
                {formatDisplayPrice(adShow.ticketPriceRange)}
              </span>
            ) : (
              <span className="text-slate-400 text-[11px]">{adShow.time}</span>
            )}
          </div>

          {/* Actions */}
          <div className="pt-1.5">
            <a
              id={`ad-buy-tickets-btn-${adShow.id}`}
              href={adShow.ticketUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center justify-center py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-rose-950/60 transition-all cursor-pointer"
            >
              <Ticket className="w-4 h-4 mr-2 shrink-0" />
              <span>Conseguir Entradas Oficiales ({formatProperCase(adShow.ticketPortalName)})</span>
              <ExternalLink className="w-3.5 h-3.5 ml-2 shrink-0 opacity-80" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
