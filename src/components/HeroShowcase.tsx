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
 * Muestra las "NOVEDADES" (pasan solas automáticamente cada 7 segundos).
 * - Encabezado FIJO superior:
 *   * Nunca se difumina ni parpadea cuando cambia el recital de abajo.
 *   * Ocupa todo el ancho superior con esquinas redondeadas coincidentes (rounded-t-3xl) y overflow-hidden.
 *   * Solo dice "NOVEDADES" en fuente más grande, en tono sobrio slate-200/slate-300 y CENTRADA con icono Sparkles.
 *   * Sin texto "MDQSHOW" a la derecha.
 * - Abajo: La foto y datos del show rotan suavemente.
 */
export const HeroShowcase: React.FC<HeroShowcaseProps> = ({ shows = [], onSelectShow }) => {
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

  useEffect(() => {
    if (currentIndex >= displayShows.length && displayShows.length > 0) {
      setCurrentIndex(0);
    }
  }, [displayShows.length, currentIndex]);

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
        {/* Tarjeta decorativa de fondo (próximo recital que asoma sutilmente en perspectiva) */}
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

        {/* CONTENEDOR PRINCIPAL ESTABLE CON BORDES REDONDEADOS CURVOS PERFECTOS */}
        <div 
          onClick={handleCardClick}
          className="relative z-10 w-full sm:w-[94%] h-full rounded-3xl overflow-hidden cursor-pointer shadow-2xl border border-white/15 hover:border-rose-500/60 group bg-slate-950"
          title={`Ver cartelera de ${currentShow.band}`}
        >
          {/* FOTO Y CONTENIDO QUE CAMBIAN SUAVEMENTE (isFading afecta solo a este bloque, nunca al encabezado) */}
          <div className="absolute inset-0 w-full h-full">
            <img 
              src={currentShow.image} 
              alt={currentShow.band} 
              className={`w-full h-full object-cover object-center transform scale-105 group-hover:scale-110 transition-all duration-700 ${
                isFading ? 'opacity-20 scale-[0.98] blur-xs' : 'opacity-100 scale-105 blur-0'
              }`}
            />

            {/* Degradé lateral y degradé inferior para lectura óptima de nombre, fecha y lugar */}
            <div className="absolute inset-y-0 left-0 w-36 sm:w-52 bg-gradient-to-r from-slate-950/95 via-slate-950/60 to-transparent pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent pointer-events-none" />

            {/* PARTE DE ABAJO: Nombre de la Banda y Fecha a la IZQUIERDA | Lugar a la DERECHA */}
            <div className={`absolute bottom-0 inset-x-0 p-5 sm:p-6 z-20 flex flex-col sm:flex-row sm:items-end justify-between gap-2.5 pointer-events-none transition-opacity duration-500 ${
              isFading ? 'opacity-0' : 'opacity-100'
            }`}>
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

          {/* ENCABEZADO FIJO DE NOVEDADES (100% ESTABLE: NO SE DIFUMINA NUNCA, CENTRADO, FUENTE MÁS GRANDE Y CURVAS LIMPIAS) */}
          <div className="absolute top-0 inset-x-0 z-30 pointer-events-none">
            <div className="w-full py-2.5 px-4 bg-slate-900/90 backdrop-blur-md border-b border-slate-700/60 flex items-center justify-center gap-2 shadow-md rounded-t-3xl">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
              <span className="text-sm sm:text-base font-black tracking-widest text-slate-200 uppercase text-center">
                NOVEDADES
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
