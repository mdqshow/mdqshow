import React, { useState, useEffect } from 'react';
import { Show } from '../types';

interface AirportBoardHeaderProps {
  shows?: Show[];
  onSelectShow?: (show: Show) => void;
}

const MONTH_NAMES = [
  'ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN',
  'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'
];

/**
 * Función robusta para formatear cualquier fecha en 6 casilleros de aeropuerto:
 * 2 dígitos de DÍA + 1 espacio + 3 letras de MES (ej: "20 NOV", "07 NOV", "15 ENE").
 */
function formatAirportDate(dateInput?: string | string[]): string {
  if (!dateInput) return 'PRÓX';
  const rawStr = Array.isArray(dateInput) ? dateInput[0] : dateInput;
  if (!rawStr || typeof rawStr !== 'string') return 'PRÓX';

  const clean = rawStr.trim();

  // Caso 1: Formato ISO YYYY-MM-DD o YYYY/MM/DD (ej: "2026-11-20")
  const isoMatch = clean.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) {
    const monthNum = parseInt(isoMatch[2], 10);
    const day = isoMatch[3].padStart(2, '0');
    const month = MONTH_NAMES[monthNum - 1] || '---';
    return `${day} ${month}`;
  }

  // Caso 2: Formato latino DD/MM/YYYY o DD-MM-YYYY (ej: "20/11/2026")
  const latamMatch = clean.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (latamMatch) {
    const day = latamMatch[1].padStart(2, '0');
    const monthNum = parseInt(latamMatch[2], 10);
    const month = MONTH_NAMES[monthNum - 1] || '---';
    return `${day} ${month}`;
  }

  // Caso 3: Fallback con objeto Date
  const parsedTimestamp = Date.parse(clean);
  if (!isNaN(parsedTimestamp)) {
    const d = new Date(parsedTimestamp);
    const day = String(d.getUTCDate()).padStart(2, '0');
    const month = MONTH_NAMES[d.getUTCMonth()] || '---';
    return `${day} ${month}`;
  }

  return clean.toUpperCase().replace(/\s+/g, ' ').padEnd(6, ' ').slice(0, 6);
}

/**
 * Fila de Cartelera de Aeropuerto:
 * - Color BLANCO en fecha y artista (#ffffff)
 * - Giro lento individual y progresivo de aleta mecánica (Split-Flap)
 * - Cada casilla rota con un leve retardo escalonado característico de las terminales de Solari / Aeropuerto
 */
const AirportBoardRow: React.FC<{
  dateStr: string;
  band: string;
  isFlapping: boolean;
}> = ({ dateStr, band, isFlapping }) => {
  const paddedDate = dateStr.padEnd(6, ' ').slice(0, 6).toUpperCase();
  const cleanBand = band.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  const paddedBand = cleanBand.padEnd(15, ' ').slice(0, 15);

  return (
    <div className="flex items-center justify-between w-full bg-[#0e0e0e] font-airport-matrix select-none border-b border-[#1c1c1c] last:border-b-0 py-0.5 sm:py-1 px-1 sm:px-2">
      {/* Columna Fecha: 6 casilleros en BLANCO (ej: "20 NOV") con giro individual lento */}
      <div className="flex items-center gap-[2px] shrink-0">
        {paddedDate.split('').map((char, i) => (
          <div
            key={i}
            className={`w-[13px] sm:w-[16px] md:w-[18px] h-[22px] sm:h-[26px] md:h-[28px] bg-[#151515] border border-[#242424] rounded-[2px] flex items-center justify-center text-white text-xs sm:text-sm md:text-base font-bold shadow-inner shadow-black relative overflow-hidden transition-all duration-500 ease-in-out ${
              isFlapping 
                ? 'rotate-x-90 scale-y-0 opacity-30 shadow-none' 
                : 'rotate-x-0 scale-y-100 opacity-100 shadow-inner'
            }`}
            style={{ 
              transitionDelay: `${i * 35}ms`,
              transformOrigin: 'center center'
            }}
          >
            {/* Ranura horizontal divisoria del split-flap */}
            <div className="absolute inset-x-0 top-1/2 h-[1px] bg-[#090909] z-10 pointer-events-none" />
            <span className="relative z-0 leading-none">
              {char === ' ' ? '\u00A0' : char}
            </span>
          </div>
        ))}
      </div>

      {/* Casillero vacío de separación */}
      <div className="flex items-center gap-[2px] mx-0.5 sm:mx-1 shrink-0">
        <div className="w-[6px] sm:w-[8px] h-[22px] sm:h-[26px] md:h-[28px] bg-[#121212] border border-[#202020] rounded-[2px]" />
      </div>

      {/* Columna Artista / Grupo: casilleros en BLANCO con giro lento escalonado de izquierda a derecha */}
      <div className="flex items-center gap-[2px] shrink-0">
        {paddedBand.split('').map((char, i) => (
          <div
            key={i}
            className={`w-[12px] sm:w-[15px] md:w-[17px] h-[22px] sm:h-[26px] md:h-[28px] bg-[#151515] border border-[#242424] rounded-[2px] flex items-center justify-center text-white text-xs sm:text-sm md:text-base font-bold shadow-inner shadow-black relative overflow-hidden transition-all duration-500 ease-in-out ${
              isFlapping 
                ? 'rotate-x-90 scale-y-0 opacity-30 shadow-none' 
                : 'rotate-x-0 scale-y-100 opacity-100 shadow-inner'
            }`}
            style={{ 
              transitionDelay: `${150 + i * 25}ms`,
              transformOrigin: 'center center'
            }}
          >
            {/* Ranura horizontal divisoria del split-flap */}
            <div className="absolute inset-x-0 top-1/2 h-[1px] bg-[#090909] z-10 pointer-events-none" />
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
 * - Rotación cada 15 SEGUNDOS
 * - Los renglones cambian DE A UNO en cascada secuencial (renglón 1, luego 2, 3, 4 y 5)
 * - Giro lento individual y progresivo de las aletas de cada renglón
 * - Color BLANCO en fecha y artista
 * - "NOVEDADES" con color ámbar (#e2b740)
 */
export const AirportBoardHeader: React.FC<AirportBoardHeaderProps> = ({ shows = [] }) => {
  const displayShows = React.useMemo(() => {
    if (!shows || shows.length === 0) return [];
    
    const explicitlyMarked = shows.filter(s => s.isNewBadge === true);
    const pool = explicitlyMarked.length >= 5 ? explicitlyMarked : shows;

    const getShowEarliestDate = (s: Show): string => {
      if (Array.isArray(s.dates) && s.dates.length > 0) {
        return [...s.dates].sort()[0];
      }
      return '9999-99-99';
    };

    const sortedByDate = [...pool].sort((a, b) => {
      const dateA = getShowEarliestDate(a);
      const dateB = getShowEarliestDate(b);
      return dateA.localeCompare(dateB);
    });

    return sortedByDate;
  }, [shows]);

  const ROWS_TO_SHOW = 5;
  const [startIndex, setStartIndex] = useState(0);

  // Estado de giro independiente para cada uno de los 5 renglones
  const [rowFlapping, setRowFlapping] = useState<boolean[]>([false, false, false, false, false]);

  useEffect(() => {
    if (displayShows.length <= ROWS_TO_SHOW) return;

    // Rotación principal cada 15 segundos
    const interval = setInterval(() => {
      // Secuencia en cascada renglón por renglón con giro lento individual:
      // Fila 0 gira en t = 0ms
      // Fila 1 gira en t = 220ms
      // Fila 2 gira en t = 440ms
      // Fila 3 gira en t = 660ms
      // Fila 4 gira en t = 880ms
      const ROW_STEP_DELAY = 220;
      const FLAP_DURATION = 550;

      for (let r = 0; r < ROWS_TO_SHOW; r++) {
        setTimeout(() => {
          setRowFlapping((prev) => {
            const next = [...prev];
            next[r] = true;
            return next;
          });
        }, r * ROW_STEP_DELAY);
      }

      // En la mitad del giro de la última fila, actualizamos el índice de datos
      const switchTime = (ROWS_TO_SHOW * ROW_STEP_DELAY) + (FLAP_DURATION / 2);
      setTimeout(() => {
        setStartIndex((prev) => (prev + ROWS_TO_SHOW) % displayShows.length);
      }, switchTime);

      // Desactivamos el flapping progresivamente a medida que cada renglón revela su nuevo texto
      for (let r = 0; r < ROWS_TO_SHOW; r++) {
        setTimeout(() => {
          setRowFlapping((prev) => {
            const next = [...prev];
            next[r] = false;
            return next;
          });
        }, switchTime + (r * ROW_STEP_DELAY));
      }
    }, 15000); // 15 SEGUNDOS exactos

    return () => clearInterval(interval);
  }, [displayShows.length]);

  if (displayShows.length === 0) return null;

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
        {currentRows.map((show, idx) => {
          const earliestDate = Array.isArray(show.dates) && show.dates.length > 0 
            ? [...show.dates].sort()[0] 
            : '';
          return (
            <AirportBoardRow
              key={`${show.id}-${idx}-${startIndex}`}
              dateStr={formatAirportDate(earliestDate)}
              band={show.band}
              isFlapping={rowFlapping[idx] || false}
            />
          );
        })}
      </div>
    </div>
  );
};
