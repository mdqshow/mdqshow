import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Sparkles } from 'lucide-react';
import { Show } from '../types';
import { formatSingleDate } from '../utils/dateHelpers';

interface HeroShowcaseProps {
  shows?: Show[];
  onSelectShow?: (show: Show) => void;
}

/**
 * Head Principal MDQSHOW:
 * Muestra las "NOVEDADES" (pasan solas automáticamente cada 7 segundos, sin flechitas).
 * - Arriba a la izquierda: Insignia NOVEDADES idéntica al botón no seleccionado (como el de "Cartelera" en la imagen del usuario):
 *   fondo oscuro azulado translúcido (bg-slate-900/90 border border-slate-800) con texto slate-400 suave e ícono a tono, con buen ancho.
 * - Abajo a la izquierda: Nombre de la Banda y Fecha del recital (destacados y prioritarios).
 * - Abajo a la derecha: Lugar / Teatro en tamaño compacto y balanceado para no competir con la fecha.
 */
export const HeroShowcase: React.FC<HeroShowcaseProps> = ({ shows = [], onSelectShow }) => {
  // Obtenemos los shows de NOVEDADES:
  // 1. Primero los marcados explícitamente como Novedad por el administrador (isNewBadge === true).
  // 2. Si no hay suficientes, completamos con los que tienen createdAt más reciente.
  // 3. Fallback: los shows más recientes de la cartelera (máximo 5).
  const displayShows = React.useMemo(() => {
    if (!shows || shows.length === 0) return [];
    
    // Shows con la tilde de Novedad
    const explicitlyMarked = shows.filter(s => s.isNewBadge === true);

    if (explicitlyMarked.length > 0) {
      return explicitlyMarked.slice(0, 5);
    }
    
    // Orden descendente por createdAt
    const sorted = [...shows].sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (timeA !== 0 && timeB !== 0) {
        return timeB - timeA;
      }
      return 0;
    });

    return sorted.slice(0, 5);
  }, [shows]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Si cambia la lista de shows y el índice queda fuera de rango, lo reseteamos
  useEffect(() => {
    if (currentIndex >= displayShows.length && displayShows.length > 0) {
      setCurrentIndex(0);
    }
  }, [displayShows.length, currentIndex]);

  // Rotación automática continua cada 7 segundos (pasan solas)
  useEffect(() => {
    if (isPaused || displayShows.length <= 1) return;

    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % displayShows.length);
        setIsFading(false);
      }, 400);
    }, 7000);

    return () => clearInterval(interval);
  }, [isPaused, displayShows.length, currentIndex]);

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

        {/* Tarjeta principal del show con transición suave */}
        <div 
          onClick={handleCardClick}
          className={`relative z-10 w-full sm:w-[94%] h-full rounded-3xl overflow-hidden cursor-pointer transition-all duration-700 ease-out shadow-2xl border border-white/15 hover:border-rose-500/60 group ${
            isFading ? 'opacity-20 scale-[0.98] blur-xs' : 'opacity-100 scale-100 blur-0'
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

          {/* Degradé superior para destacar la insignia de NOVEDADES */}
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-slate-950/90 via-slate-950/40 to-transparent pointer-events-none" />

          {/* Degradé lateral y degradé inferior para nombre, fecha y lugar */}
          <div className="absolute inset-y-0 left-0 w-32 sm:w-48 bg-gradient-to-r from-slate-950/90 via-slate-950/50 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent pointer-events-none" />

          {/* PARTE DE ARRIBA (IZQUIERDA): Insignia NOVEDADES tal como el botón no seleccionado (como en la foto de Cartelera) */}
          <div className="absolute top-4 left-4 sm:top-5 sm:left-5 z-20 pointer-events-none">
            <div className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-1.5 sm:py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 font-semibold text-xs sm:text-sm tracking-wide shadow-md backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Novedades</span>
            </div>
          </div>

          {/* PARTE DE ABAJO: Nombre de la Banda y Fecha a la IZQUIERDA | Lugar a la DERECHA */}
          <div className="absolute bottom-0 inset-x-0 p-5 sm:p-6 z-20 flex flex-col sm:flex-row sm:items-end justify-between gap-2.5 pointer-events-none">
            {/* LADO IZQUIERDO: Banda y Fecha */}
            <div className="space-y-1 min-w-0 flex-1">
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight drop-shadow-xl group-hover:text-rose-200 transition-colors line-clamp-1">
                {currentShow.band}
              </h3>

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

            {/* LADO DERECHO: Nombre del Lugar / Teatro */}
            <div className="shrink-0 sm:text-right">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] sm:text-xs font-medium text-slate-300 backdrop-blur-md shadow-sm">
                <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                <span className="truncate max-w-[170px] sm:max-w-[200px]">{currentShow.venue}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
