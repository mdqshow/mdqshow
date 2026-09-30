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
 * Casillero mecánico de split-flap auténtico:
 * Conoce el caracter anterior (oldChar) y el nuevo caracter al que transiciona (newChar).
 * - En la 1ª mitad del giro (0deg -> 90deg), la aleta muestra el caracter viejo saliendo.
 * - Exactamente en los 90deg (punto ciego vertical), conmuta instantáneamente al caracter nuevo.
 * - En la 2ª mitad del giro (90deg -> 0deg), la aleta se abre revelando el nuevo caracter.
 * Esto elimina por completo el salto visual de "muestra un dato antes de girar y otro después".
 */
const FlipTile: React.FC<{
  oldChar: string;
  newChar: string;
  isFlapping: boolean;
  widthClass: string;
  delayMs?: number;
}> = ({ oldChar, newChar, isFlapping, widthClass, delayMs = 0 }) => {
  const [displayedChar, setDisplayedChar] = useState(oldChar);
  const [isHalfway, setIsHalfway] = useState(false);

  useEffect(() => {
    if (isFlapping) {
      // Inicia giro: mostramos el viejo caracter plegándose
      setIsHalfway(false);
      setDisplayedChar(oldChar);

      // A la mitad del giro mecánico (~220ms), cambiamos la letra por la nueva
      const halfTimer = setTimeout(() => {
        setIsHalfway(true);
        setDisplayedChar(newChar);
      }, delayMs + 200);

      // Al completar el giro, se restablece
      const endTimer = setTimeout(() => {
        setIsHalfway(false);
        setDisplayedChar(newChar);
      }, delayMs + 450);

      return () => {
        clearTimeout(halfTimer);
        clearTimeout(endTimer);
      };
    } else {
      setDisplayedChar(newChar);
      setIsHalfway(false);
    }
  }, [isFlapping, oldChar, newChar, delayMs]);

  return (
    <div
      className={`${widthClass} h-[22px] sm:h-[26px] md:h-[28px] bg-[#151515] border border-[#242424] rounded-[2px] flex items-center justify-center text-white text-xs sm:text-sm md:text-base font-bold shadow-inner shadow-black relative overflow-hidden transition-all duration-400 ease-in-out ${
        isFlapping && isHalfway
          ? 'rotate-x-0 scale-y-100 opacity-100'
          : isFlapping
          ? 'rotate-x-90 scale-y-0 opacity-40 shadow-none'
          : 'rotate-x-0 scale-y-100 opacity-100 shadow-inner'
      }`}
      style={{
        transitionDelay: `${delayMs}ms`,
        transformOrigin: 'center center',
      }}
    >
      {/* Ranura divisoria horizontal central de la aleta */}
      <div className="absolute inset-x-0 top-1/2 h-[1px] bg-[#090909] z-10 pointer-events-none" />
      <span className="relative z-0 leading-none">
        {displayedChar === ' ' ? '\u00A0' : displayedChar}
      </span>
    </div>
  );
};

/**
 * Fila de Cartelera de Aeropuerto:
 * - Color BLANCO en fecha y artista (#ffffff)
 * - Transición sincronizada entre oldShow y newShow:
 *   1º Gira el DÍA (2 casillas)
 *   2º Gira el MES (3 casillas)
 *   3º Gira el ARTISTA (hasta 15 casillas)
 */
const AirportBoardRow: React.FC<{
  currentShow: Show;
  targetShow: Show;
  flapPhase: 'idle' | 'day' | 'month' | 'band';
}> = ({ currentShow, targetShow, flapPhase }) => {
  const currentEarliestDate = Array.isArray(currentShow.dates) && currentShow.dates.length > 0 
    ? [...currentShow.dates].sort()[0] 
    : '';
  const targetEarliestDate = Array.isArray(targetShow.dates) && targetShow.dates.length > 0 
    ? [...targetShow.dates].sort()[0] 
    : '';

  const oldDate = parseAirportDateParts(currentEarliestDate);
  const newDate = parseAirportDateParts(targetEarliestDate);

  const oldCleanBand = (currentShow.band || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  const newCleanBand = (targetShow.band || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();

  const oldPaddedBand = oldCleanBand.padEnd(15, ' ').slice(0, 15);
  const newPaddedBand = newCleanBand.padEnd(15, ' ').slice(0, 15);

  const isDayFlapping = flapPhase === 'day';
  const isMonthFlapping = flapPhase === 'month';
  const isBandFlapping = flapPhase === 'band';

  return (
    <div className="flex items-center justify-between w-full bg-[#0e0e0e] font-airport-matrix select-none border-b border-[#1c1c1c] last:border-b-0 py-0.5 sm:py-1 px-1 sm:px-2">
      {/* Columna Fecha: Día + Separador sutil + Mes */}
      <div className="flex items-center gap-[2px] shrink-0">
        {/* 1º: DÍA (2 casilleros) */}
        {oldDate.day.split('').map((char, i) => (
          <FlipTile
            key={`day-${i}`}
            oldChar={char}
            newChar={newDate.day[i] || ' '}
            isFlapping={isDayFlapping}
            widthClass="w-[13px] sm:w-[16px] md:w-[18px]"
            delayMs={i * 35}
          />
        ))}

        {/* Separador sutil entre día y mes */}
        <div className="w-[3px] sm:w-[4px]" />

        {/* 2º: MES (3 casilleros) */}
        {oldDate.month.split('').map((char, i) => (
          <FlipTile
            key={`month-${i}`}
            oldChar={char}
            newChar={newDate.month[i] || ' '}
            isFlapping={isMonthFlapping}
            widthClass="w-[13px] sm:w-[16px] md:w-[18px]"
            delayMs={i * 35}
          />
        ))}
      </div>

      {/* Casillero vacío de separación central */}
      <div className="flex items-center gap-[2px] mx-0.5 sm:mx-1 shrink-0">
        <div className="w-[6px] sm:w-[8px] h-[22px] sm:h-[26px] md:h-[28px] bg-[#121212] border border-[#202020] rounded-[2px]" />
      </div>

      {/* 3º: ARTISTA (hasta 15 casilleros) */}
      <div className="flex items-center gap-[2px] shrink-0">
        {oldPaddedBand.split('').map((char, i) => (
          <FlipTile
            key={`band-${i}`}
            oldChar={char}
            newChar={newPaddedBand[i] || ' '}
            isFlapping={isBandFlapping}
            widthClass="w-[12px] sm:w-[15px] md:w-[17px]"
            delayMs={i * 25}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * Cartelera de Aeropuerto:
 * - Cadencia continua: entre fila y fila siempre hay exactamente 2 SEGUNDOS de pausa quieta.
 *   Incluso tras terminar de rotar la Fila 5: pasan 2 segundos y comienza a rotar la Fila 1.
 * - Cada casilla rota con su caracter original y conmuta mecánicamente al nuevo en el giro.
 * - Secuencia fija por fila: Día -> Mes -> Artista.
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

  // Estado del show actual visible en cada fila
  const [currentIndices, setCurrentIndices] = useState<number[]>([0, 1, 2, 3, 4]);
  // Estado del show objetivo (hacia el cual está girando cada fila)
  const [targetIndices, setTargetIndices] = useState<number[]>([0, 1, 2, 3, 4]);

  // Fase de animación para cada fila
  type FlapPhase = 'idle' | 'day' | 'month' | 'band';
  const [rowFlapPhases, setRowFlapPhases] = useState<FlapPhase[]>([
    'idle', 'idle', 'idle', 'idle', 'idle'
  ]);

  useEffect(() => {
    if (displayShows.length <= ROWS_TO_SHOW) return;

    let isCancelled = false;
    const timeouts: NodeJS.Timeout[] = [];

    // Duración de cada fase en milisegundos
    const DAY_DURATION = 380;
    const MONTH_DURATION = 380;
    const BAND_DURATION = 580;
    const ROW_ANIMATION_TOTAL = DAY_DURATION + MONTH_DURATION + BAND_DURATION; // ~1340ms
    const PAUSE_BETWEEN_ROWS = 2000; // Exactamente 2 SEGUNDOS entre fila y fila en todo momento

    // Puntero de fila actual a rotar (0, 1, 2, 3, 4, y luego 0 otra vez tras 2 segundos)
    let activeRow = 0;

    const scheduleNextRow = () => {
      if (isCancelled) return;

      const r = activeRow;

      // Determinamos cuál es el nuevo show que ocupará la fila r
      setTargetIndices((prevTargets) => {
        const next = [...prevTargets];
        // Avanzamos al siguiente show disponible en el pool
        next[r] = (prevTargets[r] + ROWS_TO_SHOW) % displayShows.length;
        return next;
      });

      // 1. Inicia giro del DÍA
      setRowFlapPhases((prev) => {
        const next = [...prev];
        next[r] = 'day';
        return next;
      });

      // 2. Termina DÍA, inicia giro del MES
      timeouts.push(
        setTimeout(() => {
          if (isCancelled) return;
          setRowFlapPhases((prev) => {
            const next = [...prev];
            next[r] = 'month';
            return next;
          });
        }, DAY_DURATION)
      );

      // 3. Termina MES, inicia giro del ARTISTA
      timeouts.push(
        setTimeout(() => {
          if (isCancelled) return;
          setRowFlapPhases((prev) => {
            const next = [...prev];
            next[r] = 'band';
            return next;
          });
        }, DAY_DURATION + MONTH_DURATION)
      );

      // 4. Termina ARTISTA: Fila r concluye su rotación y se asienta
      timeouts.push(
        setTimeout(() => {
          if (isCancelled) return;
          // Asentamos el nuevo show como el actual
          setCurrentIndices((prevCurrent) => {
            const next = [...prevCurrent];
            next[r] = (prevCurrent[r] + ROWS_TO_SHOW) % displayShows.length;
            return next;
          });
          setRowFlapPhases((prev) => {
            const next = [...prev];
            next[r] = 'idle';
            return next;
          });

          // Avanzamos al siguiente renglón (0 -> 1 -> 2 -> 3 -> 4 -> 0...)
          activeRow = (activeRow + 1) % ROWS_TO_SHOW;

          // PAUSA DE EXACTAMENTE 2 SEGUNDOS antes de que empiece a rotar la siguiente fila
          timeouts.push(
            setTimeout(() => {
              if (isCancelled) return;
              scheduleNextRow();
            }, PAUSE_BETWEEN_ROWS)
          );
        }, ROW_ANIMATION_TOTAL)
      );
    };

    // Al inicio, dejamos una lectura previa y luego arranca el ciclo continuo con pausa de 2s
    const initialDelay = setTimeout(() => {
      scheduleNextRow();
    }, 6000);
    timeouts.push(initialDelay);

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
        {currentIndices.map((showIndex, rowPos) => {
          const currentShow = displayShows[showIndex % displayShows.length] || displayShows[0];
          const targetIndex = targetIndices[rowPos];
          const targetShow = displayShows[targetIndex % displayShows.length] || displayShows[0];

          return (
            <AirportBoardRow
              key={`row-${rowPos}`}
              currentShow={currentShow}
              targetShow={targetShow}
              flapPhase={rowFlapPhases[rowPos] || 'idle'}
            />
          );
        })}
      </div>
    </div>
  );
};
