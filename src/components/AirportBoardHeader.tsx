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
 * Extrae partes de la fecha:
 * - day: "20" (2 caracteres)
 * - month: "NOV" (3 caracteres)
 */
function parseAirportDateParts(dateInput?: string | string[]): { day: string; month: string } {
  if (!dateInput) return { day: 'PR', month: 'ÓX' };
  const rawStr = Array.isArray(dateInput) ? dateInput[0] : dateInput;
  if (!rawStr || typeof rawStr !== 'string') return { day: 'PR', month: 'ÓX' };

  const clean = rawStr.trim();

  // Caso 1: ISO YYYY-MM-DD o YYYY/MM/DD
  const isoMatch = clean.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) {
    const monthNum = parseInt(isoMatch[2], 10);
    const day = isoMatch[3].padStart(2, '0').slice(0, 2);
    const month = MONTH_NAMES[monthNum - 1] || '---';
    return { day, month };
  }

  // Caso 2: Latino DD/MM/YYYY o DD-MM-YYYY
  const latamMatch = clean.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (latamMatch) {
    const day = latamMatch[1].padStart(2, '0').slice(0, 2);
    const monthNum = parseInt(latamMatch[2], 10);
    const month = MONTH_NAMES[monthNum - 1] || '---';
    return { day, month };
  }

  // Caso 3: Fallback Date
  const parsedTimestamp = Date.parse(clean);
  if (!isNaN(parsedTimestamp)) {
    const d = new Date(parsedTimestamp);
    const day = String(d.getUTCDate()).padStart(2, '0').slice(0, 2);
    const month = MONTH_NAMES[d.getUTCMonth()] || '---';
    return { day, month };
  }

  return { day: 'PR', month: 'ÓX' };
}

/**
 * Fila de Cartelera de Aeropuerto:
 * - Color BLANCO en fecha y artista (#ffffff)
 * - Giro mecánico individual en 3 etapas:
 *   1º Gira el DÍA (2 casillas)
 *   2º Gira el MES (3 casillas)
 *   3º Gira el ARTISTA (hasta 15 casillas)
 */
const AirportBoardRow: React.FC<{
  show: Show;
  flapPhase: 'idle' | 'day' | 'month' | 'band' | 'all';
}> = ({ show, flapPhase }) => {
  const earliestDate = Array.isArray(show.dates) && show.dates.length > 0 
    ? [...show.dates].sort()[0] 
    : '';
  const { day, month } = parseAirportDateParts(earliestDate);
  const cleanBand = (show.band || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  const paddedBand = cleanBand.padEnd(15, ' ').slice(0, 15);

  const isDayFlapping = flapPhase === 'day' || flapPhase === 'all';
  const isMonthFlapping = flapPhase === 'month' || flapPhase === 'all';
  const isBandFlapping = flapPhase === 'band' || flapPhase === 'all';

  return (
    <div className="flex items-center justify-between w-full bg-[#0e0e0e] font-airport-matrix select-none border-b border-[#1c1c1c] last:border-b-0 py-0.5 sm:py-1 px-1 sm:px-2">
      {/* Columna Fecha: Día + Separador sutil + Mes */}
      <div className="flex items-center gap-[2px] shrink-0">
        {/* 1º: DÍA (2 casilleros que rotan primero) */}
        {day.split('').map((char, i) => (
          <div
            key={`day-${i}`}
            className={`w-[13px] sm:w-[16px] md:w-[18px] h-[22px] sm:h-[26px] md:h-[28px] bg-[#151515] border border-[#242424] rounded-[2px] flex items-center justify-center text-white text-xs sm:text-sm md:text-base font-bold shadow-inner shadow-black relative overflow-hidden transition-all duration-350 ease-in-out ${
              isDayFlapping 
                ? 'rotate-x-90 scale-y-0 opacity-25 shadow-none' 
                : 'rotate-x-0 scale-y-100 opacity-100 shadow-inner'
            }`}
            style={{ 
              transitionDelay: `${i * 35}ms`,
              transformOrigin: 'center center'
            }}
          >
            <div className="absolute inset-x-0 top-1/2 h-[1px] bg-[#090909] z-10 pointer-events-none" />
            <span className="relative z-0 leading-none">
              {char}
            </span>
          </div>
        ))}

        {/* Separador entre día y mes */}
        <div className="w-[3px] sm:w-[4px]" />

        {/* 2º: MES (3 casilleros que rotan a continuación) */}
        {month.split('').map((char, i) => (
          <div
            key={`month-${i}`}
            className={`w-[13px] sm:w-[16px] md:w-[18px] h-[22px] sm:h-[26px] md:h-[28px] bg-[#151515] border border-[#242424] rounded-[2px] flex items-center justify-center text-white text-xs sm:text-sm md:text-base font-bold shadow-inner shadow-black relative overflow-hidden transition-all duration-350 ease-in-out ${
              isMonthFlapping 
                ? 'rotate-x-90 scale-y-0 opacity-25 shadow-none' 
                : 'rotate-x-0 scale-y-100 opacity-100 shadow-inner'
            }`}
            style={{ 
              transitionDelay: `${i * 35}ms`,
              transformOrigin: 'center center'
            }}
          >
            <div className="absolute inset-x-0 top-1/2 h-[1px] bg-[#090909] z-10 pointer-events-none" />
            <span className="relative z-0 leading-none">
              {char}
            </span>
          </div>
        ))}
      </div>

      {/* Casillero vacío de separación central */}
      <div className="flex items-center gap-[2px] mx-0.5 sm:mx-1 shrink-0">
        <div className="w-[6px] sm:w-[8px] h-[22px] sm:h-[26px] md:h-[28px] bg-[#121212] border border-[#202020] rounded-[2px]" />
      </div>

      {/* 3º: ARTISTA (rota en tercer lugar, tras el día y el mes) */}
      <div className="flex items-center gap-[2px] shrink-0">
        {paddedBand.split('').map((char, i) => (
          <div
            key={`band-${i}`}
            className={`w-[12px] sm:w-[15px] md:w-[17px] h-[22px] sm:h-[26px] md:h-[28px] bg-[#151515] border border-[#242424] rounded-[2px] flex items-center justify-center text-white text-xs sm:text-sm md:text-base font-bold shadow-inner shadow-black relative overflow-hidden transition-all duration-350 ease-in-out ${
              isBandFlapping 
                ? 'rotate-x-90 scale-y-0 opacity-25 shadow-none' 
                : 'rotate-x-0 scale-y-100 opacity-100 shadow-inner'
            }`}
            style={{ 
              transitionDelay: `${i * 25}ms`,
              transformOrigin: 'center center'
            }}
          >
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
 * - Los 5 primeros recitales quedan quietos 10 SEGUNDOS completos para una lectura tranquila.
 * - Luego comienza la rotación: cambia primero la Fila 0 (Día -> Mes -> Artista).
 * - Entre fila y fila pasan exactamente 2 SEGUNDOS de pausa quieta, evitando el efecto de cambio continuo.
 * - Al terminar las 5 filas, vuelve a descansar 10 segundos antes de la siguiente tanda.
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

  // Cada renglón mantiene su propio índice en el array general de shows
  const [rowShowIndices, setRowShowIndices] = useState<number[]>([0, 1, 2, 3, 4]);

  // Fase de animación para cada una de las 5 filas
  type FlapPhase = 'idle' | 'day' | 'month' | 'band' | 'all';
  const [rowFlapPhases, setRowFlapPhases] = useState<FlapPhase[]>([
    'idle', 'idle', 'idle', 'idle', 'idle'
  ]);

  useEffect(() => {
    if (displayShows.length <= ROWS_TO_SHOW) return;

    let isCancelled = false;
    const timeouts: NodeJS.Timeout[] = [];

    // Duraciones de giro para cada sub-etapa
    const DAY_DURATION = 350;
    const MONTH_DURATION = 350;
    const BAND_DURATION = 550;
    const ROW_ANIMATION_TIME = DAY_DURATION + MONTH_DURATION + BAND_DURATION; // ~1250ms
    const PAUSE_BETWEEN_ROWS = 2000; // 2 SEGUNDOS exactos entre fila y fila
    const PAUSE_FULL_BOARD = 10000;  // 10 SEGUNDOS de quietud para leer las 5 filas completas

    // Función que corre un ciclo completo: 10s de espera inicial y luego fila por fila con 2s entre cada una
    const runCycle = () => {
      if (isCancelled) return;

      // Esperar los 10 segundos de quietud inicial antes de empezar a girar
      const startTimer = setTimeout(() => {
        if (isCancelled) return;

        // Iterar las 5 filas secuencialmente con 2 segundos de pausa entre cada una
        for (let r = 0; r < ROWS_TO_SHOW; r++) {
          const rowStartTime = r * (ROW_ANIMATION_TIME + PAUSE_BETWEEN_ROWS);

          // 1. Inicia giro del DÍA
          timeouts.push(
            setTimeout(() => {
              if (isCancelled) return;
              setRowFlapPhases((prev) => {
                const next = [...prev];
                next[r] = 'day';
                return next;
              });
            }, rowStartTime)
          );

          // 2. Termina DÍA, inicia giro del MES
          timeouts.push(
            setTimeout(() => {
              if (isCancelled) return;
              setRowFlapPhases((prev) => {
                const next = [...prev];
                next[r] = 'month';
                return next;
              });
            }, rowStartTime + DAY_DURATION)
          );

          // 3. Termina MES, inicia giro del ARTISTA (actualizamos datos de esa fila)
          timeouts.push(
            setTimeout(() => {
              if (isCancelled) return;
              setRowShowIndices((prev) => {
                const next = [...prev];
                next[r] = (next[r] + ROWS_TO_SHOW) % displayShows.length;
                return next;
              });
              setRowFlapPhases((prev) => {
                const next = [...prev];
                next[r] = 'band';
                return next;
              });
            }, rowStartTime + DAY_DURATION + MONTH_DURATION)
          );

          // 4. Termina ARTISTA: Fila r queda en reposo ('idle')
          // Aquí arranca la pausa quieta de 2 segundos antes de que le toque a la siguiente fila
          timeouts.push(
            setTimeout(() => {
              if (isCancelled) return;
              setRowFlapPhases((prev) => {
                const next = [...prev];
                next[r] = 'idle';
                return next;
              });
            }, rowStartTime + ROW_ANIMATION_TIME)
          );
        }

        // Tiempo total de animación de las 5 filas + pausas entre ellas
        const totalAnimationDuration = (ROWS_TO_SHOW - 1) * (ROW_ANIMATION_TIME + PAUSE_BETWEEN_ROWS) + ROW_ANIMATION_TIME;

        // Al finalizar la 5ª fila, programamos el siguiente ciclo (que volverá a esperar 10 segundos)
        timeouts.push(
          setTimeout(() => {
            if (isCancelled) return;
            runCycle();
          }, totalAnimationDuration)
        );

      }, PAUSE_FULL_BOARD); // 10 segundos iniciales

      timeouts.push(startTimer);
    };

    runCycle();

    return () => {
      isCancelled = true;
      timeouts.forEach(clearTimeout);
    };
  }, [displayShows.length]);

  if (displayShows.length === 0) return null;

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

      {/* Contenedor principal con las 5 FILAS exactas */}
      <div className="bg-[#0b0c0e] border border-[#1a1c20] rounded-lg overflow-hidden shadow-inner flex-1 flex flex-col justify-around my-auto">
        {rowShowIndices.map((showIndex, rowPos) => {
          const show = displayShows[showIndex % displayShows.length] || displayShows[0];
          return (
            <AirportBoardRow
              key={`row-${rowPos}-${show.id}`}
              show={show}
              flapPhase={rowFlapPhases[rowPos] || 'idle'}
            />
          );
        })}
      </div>
    </div>
  );
};
