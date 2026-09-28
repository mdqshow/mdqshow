import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { Show } from '../types';
import { formatSingleDate } from '../utils/dateHelpers';

interface HeroShowcaseProps {
  shows?: Show[];
  onSelectShow?: (show: Show) => void;
}

export const HeroShowcase: React.FC<HeroShowcaseProps> = ({ shows = [], onSelectShow }) => {
  // Filtramos los shows marcados por el usuario como "Destacar show en la parte superior" (featured === true)
  const featuredShows = shows.filter(s => s.featured === true);

  // Si no hay shows con featured o se están cargando, tomamos los primeros shows como fallback
  const displayShows = featuredShows.length > 0 ? featuredShows : shows.slice(0, 5);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Si cambia la lista de shows y el índice queda fuera de rango, lo reseteamos
  useEffect(() => {
    if (currentIndex >= displayShows.length && displayShows.length > 0) {
      setCurrentIndex(0);
    }
  }, [displayShows.length, currentIndex]);

  // Rotación automática suave cada 6 segundos si no tiene el mouse encima
  useEffect(() => {
    if (isPaused || displayShows.length <= 1) return;

    const interval = setInterval(() => {
      handleNext();
    }, 6000);

    return () => clearInterval(interval);
  }, [isPaused, displayShows.length, currentIndex]);

  const handleNext = () => {
    if (displayShows.length <= 1) return;
    setIsFading(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % displayShows.length);
      setIsFading(false);
    }, 300);
  };

  const handlePrev = () => {
    if (displayShows.length <= 1) return;
    setIsFading(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + displayShows.length) % displayShows.length);
      setIsFading(false);
    }, 300);
  };

  if (displayShows.length === 0) {
    return null;
  }

  const currentShow = displayShows[currentIndex];
  const nextShow = displayShows[(currentIndex + 1) % displayShows.length];

  const handleCardClick = () => {
    if (onSelectShow && currentShow) {
      onSelectShow(currentShow);
    }
  };

  return (
    <div 
      className="relative w-full h-72 sm:h-80 lg:h-84 flex items-center justify-center select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Resplandor ambiental de luz detrás de la imagen */}
      <div className="absolute inset-0 bg-gradient-to-tr from-rose-600/25 via-amber-500/15 to-transparent rounded-full blur-3xl pointer-events-none transform -rotate-3 scale-110" />

      <div className="relative w-full h-full flex items-center justify-end">
        {/* Tarjeta decorativa de fondo (próximo recital que asoma sutilmente en perspectiva si hay más de 1) */}
        {displayShows.length > 1 && nextShow && (
          <div className="hidden sm:block absolute right-2 top-2 w-[90%] h-[92%] rounded-3xl overflow-hidden opacity-25 transform rotate-3 scale-95 pointer-events-none blur-[0.5px]">
            <img 
              src={nextShow.image} 
              alt="" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/70 to-transparent" />
          </div>
        )}

        {/* Tarjeta principal del show destacado */}
        <div 
          onClick={handleCardClick}
          className={`relative z-10 w-full sm:w-[94%] h-full rounded-3xl overflow-hidden cursor-pointer transition-all duration-500 shadow-2xl border border-white/15 hover:border-rose-500/60 group ${
            isFading ? 'opacity-30 scale-[0.99] blur-xs' : 'opacity-100 scale-100 blur-0'
          }`}
          style={{
            background: 'linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,41,59,0.5))'
          }}
          title={`Ver cartelera de ${currentShow.band}`}
        >
          {/* Foto del Show */}
          <img 
            src={currentShow.image} 
            alt={currentShow.band} 
            className="w-full h-full object-cover object-center transform scale-105 group-hover:scale-110 transition-transform duration-700"
          />

          {/* Degradé superior para destacar el lugar/teatro */}
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-slate-950/90 via-slate-950/50 to-transparent pointer-events-none" />

          {/* Degradé lateral y degradé inferior para nombre y fecha */}
          <div className="absolute inset-y-0 left-0 w-28 sm:w-44 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-slate-950 via-slate-950/85 to-transparent pointer-events-none" />

          {/* PARTE DE ARRIBA: Nombre del lugar / teatro */}
          <div className="absolute top-4 left-4 sm:top-5 sm:left-5 z-20 pointer-events-none">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/80 border border-slate-700/80 backdrop-blur-md shadow-md text-xs sm:text-sm font-semibold text-rose-300">
              <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span className="truncate max-w-[240px] sm:max-w-none">{currentShow.venue}</span>
            </div>
          </div>

          {/* PARTE DE ABAJO: Nombre de la Banda y Fecha */}
          <div className="absolute bottom-0 inset-x-0 p-5 sm:p-6 z-20 space-y-1.5 pointer-events-none">
            {/* Nombre de la banda */}
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight drop-shadow-xl group-hover:text-rose-200 transition-colors line-clamp-1">
              {currentShow.band}
            </h3>

            {/* Fecha */}
            <div className="flex items-center gap-2 pt-0.5 text-xs sm:text-sm font-bold text-amber-300 drop-shadow">
              <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="capitalize">
                {currentShow.dates && currentShow.dates.length > 0 
                  ? formatSingleDate(currentShow.dates[0])
                  : 'Fecha a confirmar'}
              </span>
              {currentShow.time && (
                <span className="text-slate-300 text-xs font-normal">
                  • {currentShow.time}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Flechas de navegación discreta si hay más de 1 show destacado */}
        {displayShows.length > 1 && (
          <div className="absolute bottom-3 right-4 z-30 flex items-center gap-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="w-7 h-7 rounded-full bg-slate-950/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 flex items-center justify-center transition-all cursor-pointer backdrop-blur-xs"
              title="Anterior show destacado"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-mono text-slate-400 px-1 bg-slate-950/60 rounded-md py-0.5 border border-slate-800">
              {currentIndex + 1}/{displayShows.length}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="w-7 h-7 rounded-full bg-slate-950/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 flex items-center justify-center transition-all cursor-pointer backdrop-blur-xs"
              title="Siguiente show destacado"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
