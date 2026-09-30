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
 * Fila de Cartelera de Aeropuerto exactamente como en la foto de referencia:
 * - 6 casilleros de fecha/hora en color amarillo/ámbar vintage (ej: 09:45 o 20 NOV)
 * - Separador de casilleros vacíos
 * - Casilleros de destino/artista en amarillo/ámbar idéntico a la imagen
 * - Cuadrícula de módulos negros con borde sutil
 * - Efecto de cambio flip/matriz
 */
const AirportBoardRow: React.FC<{
  dateStr: string;
  band: string;
  isFlapping: boolean;
}> = ({ dateStr, band, isFlapping }) => {
  // 6 casilleros para la fecha (ej: "20 NOV")
  const paddedDate = dateStr.padEnd(6, ' ').slice(0, 6).toUpperCase();
  // Limpiamos acentos para respetar el set de caracteres de la terminal de vuelo
  const cleanBand = band.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  // Hasta 16 casilleros para el nombre del artista/grupo
  const paddedBand = cleanBand.padEnd(16, ' ').slice(0, 16);

  return (
    <div className="flex items-center bg-[#101010] font-airport-matrix select-none border-b border-[#1c1c1c] last:border-b-0 py-0.5 sm:py-1 px-1 sm:px-2">
      {/* Columna Fecha: 6 casilleros amarillos exactamente como en la foto */}
      <div className="flex items-center gap-[2px] sm:gap-[3px]">
        {paddedDate.split('').map((char, i) => (
          <div
            key={i}
            className={`w-[17px] sm:w-[22px] md:w-[24px] h-[24px] sm:h-[29px] md:h-[32px] bg-[#151515] border border-[#242424] rounded-[2px] flex items-center justify-center text-[#e2b740] text-sm sm:text-base md:text-lg font-bold shadow-inner shadow-black relative overflow-hidden transition-transform duration-300 ${
              isFlapping ? 'scale-y-0 opacity-40' : 'scale-y-100 opacity-100'
            }`}
          >
            {/* Ranura horizontal divisoria del split-flap */}
            <div className="absolute inset-x-0 top-1/2 h-[1px] bg-[#0c0c0c] z-10 pointer-events-none" />
            <span className="relative z-0 leading-none">
              {char === ' ' ? '\u00A0' : char}
            </span>
          </div>
        ))}
      </div>

      {/* Casilleros vacíos de separación entre Fecha y Artista (como en la foto de la terminal) */}
      <div className="flex items-center gap-[2px] sm:gap-[3px] mx-1 sm:mx-1.5">
        <div className="w-[8px] sm:w-[12px] h-[24px] sm:h-[29px] md:h-[32px] bg-[#121212] border border-[#202020] rounded-[2px]" />
      </div>

      {/* Columna Artista / Grupo: casilleros amarillos con la misma tipografía DotGothic16 / VT323 */}
      <div className="flex items-center gap-[2px] sm:gap-[3px] overflow-hidden">
        {paddedBand.split('').map((char, i) => (
          <div
            key={i}
            className={`w-[15px] sm:w-[20px] md:w-[22px] h-[24px] sm:h-[29px] md:h-[32px] bg-[#151515] border border-[#242424] rounded-[2px] flex items-center justify-center text-[#e2b740] text-sm sm:text-base md:text-lg font-bold shadow-inner shadow-black relative overflow-hidden transition-transform duration-300 ${
              isFlapping ? 'scale-y-0 opacity-40' : 'scale-y-100 opacity-100'
            }`}
            style={{ transitionDelay: `${i * 12}ms` }}
          >
            {/* Ranura horizontal divisoria del split-flap */}
            <div className="absolute inset-x-0 top-1/2 h-[1px] bg-[#0c0c0c] z-10 pointer-events-none" />
            <span className="relative z-0 leading-none">
              {char === ' ' ? '\u00A0' : char}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Cartelera de Aeropuerto idéntica a la foto:
 * - Sin la fila "FECHA ARTISTA STATUS"
 * - Exactamente 5 FILAS de shows
 * - Tipografía y cuadrícula de matriz de puntos idéntica a la imagen
 * - Fondo negro puro, casilleros individuales con borde gris grafito y letras amarillo-ámbar #e2b740
 */
export const AirportBoardHeader: React.FC<AirportBoardHeaderProps> = ({ shows = [] }) => {
  // Obtenemos los shows de novedades o los más recientes
  const displayShows = React.useMemo(() => {
    if (!shows || shows.length === 0) return [];
    
    const explicitlyMarked = shows.filter(s => s.isNewBadge === true);
    if (explicitlyMarked.length > 0) {
      return explicitlyMarked;
    }
    
    const sorted = [...shows].sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });
    return sorted.slice(0, 15);
  }, [shows]);

  // Exactamente 5 FILAS de shows como pidió el usuario
  const ROWS_TO_SHOW = 5;
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

  // Calculamos los 5 shows visibles
  const currentRows: Show[] = [];
  for (let i = 0; i < ROWS_TO_SHOW; i++) {
    if (displayShows.length > 0) {
      const index = (startIndex + i) % displayShows.length;
      currentRows.push(displayShows[index]);
    }
  }

  return (
    <div className="relative w-full rounded-2xl bg-[#0a0a0a] border-2 border-[#222222] p-2 sm:p-3 shadow-2xl shadow-black overflow-hidden select-none">
      {/* Marco superior sutil con indicador de novedades */}
      <div className="flex items-center justify-between pb-1.5 mb-1 border-b border-[#1f1f1f] px-1 text-zinc-400 font-airport-matrix text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#e2b740] animate-pulse" />
          <span className="text-[#e2b740] font-bold tracking-widest text-[11px] sm:text-xs">
            DEPARTURES • NOVEDADES
          </span>
        </div>
        <div className="text-[10px] text-zinc-500 tracking-wider">
          ROTACIÓN EN VIVO
        </div>
      </div>

      {/* Contenedor principal con las 5 FILAS exactas, sin filas de títulos de columnas */}
      <div className="bg-[#0e0e0e] border border-[#1e1e1e] rounded-lg overflow-x-auto overflow-y-hidden shadow-inner flex flex-col justify-center">
        {currentRows.map((show, idx) => (
          <AirportBoardRow
            key={`${show.id}-${idx}-${startIndex}`}
            dateStr={formatAirportDate(show.dates && show.dates[0])}
            band={show.band}
            isFlapping={isFlapping}
          />
        ))}
      </div>
    </div>
  );
};
