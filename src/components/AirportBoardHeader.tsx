import React, { useState, useEffect } from 'react';
import { Show } from '../types';

interface AirportBoardHeaderProps {
  shows?: Show[];
  onSelectShow?: (show: Show) => void;
}

/**
 * Formateo de fecha sin espacio entre día y mes para que quepa en 5 casilleros exactos:
 * ej. "2026-11-20" -> "20NOV"
 */
function formatAirportDate(dateStr?: string): string {
  if (!dateStr) return 'PRÓX';
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr.toUpperCase().replace(/\s+/g, '');
  const day = parts[2];
  const monthNum = parseInt(parts[1], 10);
  const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'DIC'];
  const month = months[monthNum - 1] || '---';
  return `${day}${month}`;
}

/**
 * Fila de Cartelera de Aeropuerto:
 * - Color BLANCO en fecha y artista (#ffffff)
 * - Letras y casilleros de tamaño compacto original para que nunca aparezca scrollbar
 * - Fecha sin espacio intermedio (ej: "20NOV") en 5 casilleros
 * - Separador de 1 casillero
 * - Artista en hasta 14 casilleros
 */
const AirportBoardRow: React.FC<{
  dateStr: string;
  band: string;
  isFlapping: boolean;
}> = ({ dateStr, band, isFlapping }) => {
  // 5 casilleros para la fecha compacta (ej: "20NOV")
  const paddedDate = dateStr.padEnd(5, ' ').slice(0, 5).toUpperCase();
  // Limpiamos acentos para respetar el set de caracteres de la terminal de vuelo
  const cleanBand = band.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  // Hasta 14 casilleros para el nombre del artista/grupo
  const paddedBand = cleanBand.padEnd(14, ' ').slice(0, 14);

  return (
    <div className="flex items-center justify-between w-full bg-[#0e0e0e] font-airport-matrix select-none border-b border-[#1c1c1c] last:border-b-0 py-0.5 sm:py-1 px-1 sm:px-2">
      {/* Columna Fecha: 5 casilleros en BLANCO */}
      <div className="flex items-center gap-[2px] shrink-0">
        {paddedDate.split('').map((char, i) => (
          <div
            key={i}
            className={`w-[14px] sm:w-[17px] md:w-[19px] h-[22px] sm:h-[26px] md:h-[28px] bg-[#151515] border border-[#242424] rounded-[2px] flex items-center justify-center text-white text-xs sm:text-sm md:text-base font-bold shadow-inner shadow-black relative overflow-hidden transition-transform duration-300 ${
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

      {/* Casillero vacío de separación */}
      <div className="flex items-center gap-[2px] mx-0.5 sm:mx-1 shrink-0">
        <div className="w-[6px] sm:w-[9px] h-[22px] sm:h-[26px] md:h-[28px] bg-[#121212] border border-[#202020] rounded-[2px]" />
      </div>

      {/* Columna Artista / Grupo: casilleros en BLANCO */}
      <div className="flex items-center gap-[2px] shrink-0">
        {paddedBand.split('').map((char, i) => (
          <div
            key={i}
            className={`w-[13px] sm:w-[15px] md:w-[17px] h-[22px] sm:h-[26px] md:h-[28px] bg-[#151515] border border-[#242424] rounded-[2px] flex items-center justify-center text-white text-xs sm:text-sm md:text-base font-bold shadow-inner shadow-black relative overflow-hidden transition-transform duration-300 ${
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
 * Cartelera de Aeropuerto:
 * - Color BLANCO en fecha y artista
 * - "NOVEDADES" con el color amarillo/ámbar vintage anterior (#e2b740)
 * - Sin "Cartelera en vivo"
 * - Sin scrollbar horizontal (ancho justo y casilleros calibrados)
 * - 5 filas ordenadas cronológicamente
 */
export const AirportBoardHeader: React.FC<AirportBoardHeaderProps> = ({ shows = [] }) => {
  // Obtenemos los shows de novedades o los shows con fecha futura, ORDENADOS POR FECHA CRONOLÓGICA
  const displayShows = React.useMemo(() => {
    if (!shows || shows.length === 0) return [];
    
    // Shows marcados explícitamente con Novedad
    const explicitlyMarked = shows.filter(s => s.isNewBadge === true);
    const pool = explicitlyMarked.length >= 5 ? explicitlyMarked : shows;

    // Ordenar cronológicamente por la fecha del show (la más próxima primero)
    const sortedByDate = [...pool].sort((a, b) => {
      const dateA = a.dates && a.dates[0] ? a.dates[0] : '9999-99-99';
      const dateB = b.dates && b.dates[0] ? b.dates[0] : '9999-99-99';
      return dateA.localeCompare(dateB);
    });

    return sortedByDate;
  }, [shows]);

  // Exactamente 5 FILAS de shows
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
    <div className="relative w-full h-full min-h-[280px] sm:min-h-[310px] rounded-2xl bg-[#090a0c] border-2 border-[#202226] p-2 sm:p-3 shadow-2xl shadow-black overflow-hidden select-none flex flex-col justify-between">
      {/* Marco superior: solo "NOVEDADES" con el color ámbar vintage original */}
      <div className="flex items-center pb-1.5 mb-1 border-b border-[#1c1e22] px-1 text-zinc-400 font-airport-matrix">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#e2b740] animate-pulse" />
          <span className="text-[#e2b740] font-black tracking-[0.25em] text-xs sm:text-sm">
            NOVEDADES
          </span>
        </div>
      </div>

      {/* Contenedor principal con las 5 FILAS exactas, sin scroll horizontal */}
      <div className="bg-[#0b0c0e] border border-[#1a1c20] rounded-lg overflow-hidden shadow-inner flex-1 flex flex-col justify-around my-auto">
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
