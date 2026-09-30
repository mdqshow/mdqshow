import React, { useState, useEffect } from 'react';
import { Show } from '../types';

interface AirportBoardHeaderProps {
  shows?: Show[];
  onSelectShow?: (show: Show) => void;
}

/**
 * Función para formatear fecha estilo cartel de aeropuerto:
 * ej. "2026-11-20" -> "20 NOV"
 */
function formatAirportDate(dateStr?: string): string {
  if (!dateStr) return 'PRÓX';
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr.toUpperCase();
  const day = parts[2];
  const monthNum = parseInt(parts[1], 10);
  const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
  const month = months[monthNum - 1] || '---';
  return `${day} ${month}`;
}

/**
 * Fila individual estilo Split-Flap de Aeropuerto
 */
const SplitFlapRow: React.FC<{
  dateStr: string;
  band: string;
  isFlapping: boolean;
  rowNumber: number;
}> = ({ dateStr, band, isFlapping }) => {
  // Limpiamos y preparamos caracteres fijos
  const paddedDate = dateStr.padEnd(6, ' ').slice(0, 6).toUpperCase();
  const cleanBand = band.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  // Mostramos hasta 18 caracteres de la banda en casilleros
  const bandChars = cleanBand.padEnd(16, ' ').slice(0, 16);

  return (
    <div className="flex items-center justify-between gap-1.5 sm:gap-2 py-1.5 px-2.5 sm:px-3 bg-black/90 border-b border-zinc-800/80 font-mono text-xs sm:text-sm select-none">
      {/* Columna Fecha (ej. 20 NOV) en casilleros color ámbar aeroportuario */}
      <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
        {paddedDate.split('').map((char, i) => (
          <span
            key={i}
            className={`inline-flex items-center justify-center w-5 sm:w-6 h-6 sm:h-7 rounded-[3px] bg-[#141517] border-t border-b border-zinc-700/80 text-amber-400 font-black shadow-inner shadow-black relative overflow-hidden text-center leading-none transition-all duration-300 ${
              isFlapping ? 'rotate-x-90 opacity-70 bg-zinc-900' : 'rotate-x-0 opacity-100'
            }`}
          >
            {/* Ranura divisoria horizontal típica del mecanismo de split-flap */}
            <span className="absolute inset-x-0 top-1/2 h-[1px] bg-black/80 pointer-events-none" />
            <span className="relative z-10 text-[11px] sm:text-xs font-bold tracking-wider">
              {char === ' ' ? '\u00A0' : char}
            </span>
          </span>
        ))}
      </div>

      {/* Separador sutil */}
      <span className="text-zinc-600 font-bold hidden xs:inline">•</span>

      {/* Columna Artista / Grupo en casilleros blancos de terminal LED/Flap */}
      <div className="flex items-center gap-0.5 shrink-0 overflow-hidden">
        {bandChars.split('').map((char, i) => (
          <span
            key={i}
            className={`inline-flex items-center justify-center w-4 sm:w-4.5 lg:w-5 h-6 sm:h-7 rounded-[3px] bg-[#18191c] border-t border-b border-zinc-700/80 text-zinc-100 font-bold shadow-inner shadow-black relative overflow-hidden text-center leading-none transition-all duration-300 ${
              isFlapping ? 'rotate-x-90 opacity-60 bg-zinc-900' : 'rotate-x-0 opacity-100'
            }`}
            style={{ transitionDelay: `${i * 15}ms` }}
          >
            {/* Ranura horizontal mecánica */}
            <span className="absolute inset-x-0 top-1/2 h-[1px] bg-black/90 pointer-events-none" />
            <span className="relative z-10 text-[10px] sm:text-xs font-semibold tracking-wider">
              {char === ' ' ? '\u00A0' : char}
            </span>
          </span>
        ))}
      </div>

      {/* Indicador LED de Estado ("ON TIME" / "CONFIRMADO") */}
      <div className="hidden md:flex items-center gap-1 pl-1 shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400" />
        <span className="text-[10px] font-bold text-emerald-400 tracking-wider">OK</span>
      </div>
    </div>
  );
};

/**
 * Cartelera estilo Aeropuerto (Departures / Split-Flap Board)
 * Diseñada para el Head de Novedades.
 * Muestra varias filas a la vez simulando el panel de vuelos del aeropuerto,
 * alternando suavemente cada 6 segundos las novedades cargadas.
 */
export const AirportBoardHeader: React.FC<AirportBoardHeaderProps> = ({ shows = [] }) => {
  // Obtenemos los shows marcados con Novedad o los más recientes
  const displayShows = React.useMemo(() => {
    if (!shows || shows.length === 0) return [];
    
    // Shows marcados explícitamente como novedad
    const explicitlyMarked = shows.filter(s => s.isNewBadge === true);
    if (explicitlyMarked.length > 0) {
      return explicitlyMarked;
    }
    
    // Fallback: ordenar por fecha de creación
    const sorted = [...shows].sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });
    return sorted.slice(0, 10);
  }, [shows]);

  // Manejo de paginación de filas (mostramos 4 filas a la vez como en un panel real)
  const ROWS_TO_SHOW = 4;
  const [startIndex, setStartIndex] = useState(0);
  const [isFlapping, setIsFlapping] = useState(false);

  useEffect(() => {
    if (displayShows.length <= ROWS_TO_SHOW) return;

    const interval = setInterval(() => {
      setIsFlapping(true);
      setTimeout(() => {
        setStartIndex((prev) => (prev + ROWS_TO_SHOW) % displayShows.length);
        setIsFlapping(false);
      }, 350);
    }, 6000);

    return () => clearInterval(interval);
  }, [displayShows.length]);

  if (displayShows.length === 0) return null;

  // Calculamos los 4 shows visibles en este ciclo
  const currentRows: Show[] = [];
  for (let i = 0; i < ROWS_TO_SHOW; i++) {
    if (displayShows.length > 0) {
      const index = (startIndex + i) % displayShows.length;
      currentRows.push(displayShows[index]);
    }
  }

  return (
    <div className="relative w-full rounded-2xl sm:rounded-3xl bg-[#090a0c] border-2 border-zinc-800 p-2 sm:p-3.5 shadow-2xl shadow-black overflow-hidden select-none">
      {/* Marco superior con tornillos y estilo industrial de terminal de aeropuerto */}
      <div className="flex items-center justify-between pb-2 mb-1 border-b border-zinc-800 px-2 text-zinc-400">
        <div className="flex items-center gap-2">
          {/* Luz piloto verde parpadeante de terminal activa */}
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping opacity-75" />
          <span className="text-[11px] sm:text-xs font-mono font-bold tracking-[0.25em] text-amber-400 uppercase">
            NOVEDADES • CARTELERA EN VIVO
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-zinc-600" />
          <span>MDQ AIR-TERMINAL</span>
        </div>
      </div>

      {/* Encabezado de columnas estilo panel de vuelos: FECHA / ARTISTA / ESTADO */}
      <div className="flex items-center justify-between px-3 py-1 bg-zinc-950/90 text-[10px] sm:text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-800/80">
        <span className="w-24 sm:w-28 text-amber-400/90">FECHA</span>
        <span className="flex-1 text-center">ARTISTA / GRUPO</span>
        <span className="hidden md:inline-block w-12 text-right text-emerald-400/90">STATUS</span>
      </div>

      {/* Contenedor de las filas tipo Split-Flap mecánico */}
      <div className="divide-y divide-zinc-900 bg-black/95 rounded-lg overflow-hidden border border-zinc-900 mt-1">
        {currentRows.map((show, idx) => (
          <SplitFlapRow
            key={`${show.id}-${idx}-${startIndex}`}
            dateStr={formatAirportDate(show.dates && show.dates[0])}
            band={show.band}
            isFlapping={isFlapping}
            rowNumber={idx + 1}
          />
        ))}
      </div>

      {/* Pie de la cartelera con detalle estético sutil */}
      <div className="flex items-center justify-between pt-2 px-2 text-[10px] font-mono text-zinc-500">
        <span className="flex items-center gap-1">
          <span className="text-amber-400 font-bold">●</span> ROTACIÓN AUTOMÁTICA
        </span>
        <span className="text-zinc-600 tracking-wider">
          {displayShows.length} SHOWS PROGRAMADOS
        </span>
      </div>
    </div>
  );
};
