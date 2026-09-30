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

function parseAirportDateParts(dateInput?: string | string[]): { day: string; month: string } {
  if (!dateInput) return { day: 'PR', month: 'ÓX' };
  const rawStr = Array.isArray(dateInput) ? dateInput[0] : dateInput;
  if (!rawStr || typeof rawStr !== 'string') return { day: 'PR', month: 'ÓX' };

  const clean = rawStr.trim();

  const isoMatch = clean.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) {
    const monthNum = parseInt(isoMatch[2], 10);
    const day = isoMatch[3].padStart(2, '0').slice(0, 2);
    const month = MONTH_NAMES[monthNum - 1] || '---';
    return { day, month };
  }

  const latamMatch = clean.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (latamMatch) {
    const day = latamMatch[1].padStart(2, '0').slice(0, 2);
    const monthNum = parseInt(latamMatch[2], 10);
    const month = MONTH_NAMES[monthNum - 1] || '---';
    return { day, month };
  }

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
 * Casilla de split-flap auténtica:
 * - Siempre muestra de forma determinista el caracter correspondiente.
 * - Antes del giro (isFlapping = false): muestra EXACTAMENTE oldChar. NUNCA newChar.
 * - Al arrancar el giro (isFlapping = true):
 *     0 a 200ms: se pliega la aleta superior mostrando oldChar.
 *     a los 200ms: en el punto ciego (pliegue plano), conmuta a newChar.
 *     200ms a 400ms: cae la nueva aleta revelando newChar.
 * - Al terminar el giro (isFlapping = false y ya rotó): muestra newChar fijo.
 */
const FlipTile: React.FC<{
  oldChar: string;
  newChar: string;
  isFlapping: boolean;
  hasFlipped: boolean;
  widthClass: string;
  delayMs?: number;
}> = ({ oldChar, newChar, isFlapping, hasFlipped, widthClass, delayMs = 0 }) => {
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    if (!isFlapping) {
      setShowNew(hasFlipped);
      return;
    }

    // Comienza el giro mostrando oldChar
    setShowNew(false);

    // Conmuta a newChar exactamente en la mitad del giro mecánico
    const timer = setTimeout(() => {
      setShowNew(true);
    }, delayMs + 220);

    return () => clearTimeout(timer);
  }, [isFlapping, hasFlipped, delayMs]);

  // Si no está rotando y ya rotó, muestra newChar; de lo contrario muestra oldChar (o showNew a mitad del giro)
  const charToDisplay = isFlapping 
    ? (showNew ? newChar : oldChar) 
    : (hasFlipped ? newChar : oldChar);

  return (
    <div
      className={`${widthClass} h-[22px] sm:h-[26px] md:h-[28px] bg-[#151515] border border-[#242424] rounded-[2px] flex items-center justify-center text-white text-xs sm:text-sm md:text-base font-bold shadow-inner shadow-black relative overflow-hidden transition-all duration-350 ease-in-out ${
        isFlapping && !showNew
          ? 'rotate-x-90 scale-y-0 opacity-40 shadow-none'
          : isFlapping && showNew
          ? 'rotate-x-0 scale-y-100 opacity-100 shadow-inner'
          : 'rotate-x-0 scale-y-100 opacity-100 shadow-inner'
      }`}
      style={{
        transitionDelay: `${delayMs}ms`,
        transformOrigin: 'center center',
      }}
    >
      {/* Ranura central de división del flap */}
      <div className="absolute inset-x-0 top-1/2 h-[1px] bg-[#090909] z-10 pointer-events-none" />
      <span className="relative z-0 leading-none">
        {charToDisplay === ' ' ? '\u00A0' : charToDisplay}
      </span>
    </div>
  );
};

/**
 * Fila de Cartelera:
 * Mientras está en reposo ('idle'):
 * - Muestra estrictamente el show actual (oldShow).
 * Durante la rotación:
 * - 1º Rota DÍA: Día conmuta a newShow, mientras Mes y Artista siguen mostrando oldShow intacto.
 * - 2º Rota MES: Mes conmuta a newShow, mientras Artista sigue mostrando oldShow intacto.
 * - 3º Rota ARTISTA: Artista conmuta a newShow.
 * Al finalizar:
 * - Toda la fila queda con newShow asentado.
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
  const hasDayFlipped = flapPhase === 'month' || flapPhase === 'band';

  const isMonthFlapping = flapPhase === 'month';
  const hasMonthFlipped = flapPhase === 'band';

  const isBandFlapping = flapPhase === 'band';
  const hasBandFlipped = false;

  return (
    <div className="flex items-center justify-between w-full bg-[#0e0e0e] font-airport-matrix select-none border-b border-[#1c1c1c] last:border-b-0 py-0.5 sm:py-1 px-1 sm:px-2">
      {/* Columna Fecha: Día + Separador + Mes */}
      <div className="flex items-center gap-[2px] shrink-0">
        {/* 1º: DÍA */}
        {oldDate.day.split('').map((char, i) => (
          <FlipTile
            key={`day-${i}`}
            oldChar={char}
            newChar={newDate.day[i] || ' '}
            isFlapping={isDayFlapping}
            hasFlipped={hasDayFlipped}
            widthClass="w-[13px] sm:w-[16px] md:w-[18px]"
            delayMs={i * 35}
          />
        ))}

        <div className="w-[3px] sm:w-[4px]" />

        {/* 2º: MES */}
        {oldDate.month.split('').map((char, i) => (
          <FlipTile
            key={`month-${i}`}
            oldChar={char}
            newChar={newDate.month[i] || ' '}
            isFlapping={isMonthFlapping}
            hasFlipped={hasMonthFlipped}
            widthClass="w-[13px] sm:w-[16px] md:w-[18px]"
            delayMs={i * 35}
          />
        ))}
      </div>

      {/* Separador central */}
      <div className="flex items-center gap-[2px] mx-0.5 sm:mx-1 shrink-0">
        <div className="w-[6px] sm:w-[8px] h-[22px] sm:h-[26px] md:h-[28px] bg-[#121212] border border-[#202020] rounded-[2px]" />
      </div>

      {/* 3º: ARTISTA */}
      <div className="flex items-center gap-[2px] shrink-0">
        {oldPaddedBand.split('').map((char, i) => (
          <FlipTile
            key={`band-${i}`}
            oldChar={char}
            newChar={newPaddedBand[i] || ' '}
            isFlapping={isBandFlapping}
            hasFlipped={hasBandFlipped}
            widthClass="w-[12px] sm:w-[15px] md:w-[17px]"
            delayMs={i * 25}
          />
        ))}
      </div>
    </div>
  );
};

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

  // Estado del show visible actual en cada una de las 5 filas
  const [currentIndices, setCurrentIndices] = useState<number[]>([0, 1, 2, 3, 4]);
  // Estado del nuevo show hacia el cual rotará la fila
  const [targetIndices, setTargetIndices] = useState<number[]>([0, 1, 2, 3, 4]);

  type FlapPhase = 'idle' | 'day' | 'month' | 'band';
  const [rowFlapPhases, setRowFlapPhases] = useState<FlapPhase[]>([
    'idle', 'idle', 'idle', 'idle', 'idle'
  ]);

  useEffect(() => {
    if (displayShows.length <= ROWS_TO_SHOW) return;

    let isCancelled = false;
    const timeouts: NodeJS.Timeout[] = [];

    const DAY_DURATION = 350;
    const MONTH_DURATION = 350;
    const BAND_DURATION = 650;
    const PAUSE_BETWEEN_ROWS = 2000; // 2 segundos constantes entre cada fila

    let activeRow = 0;

    const scheduleNextRow = () => {
      if (isCancelled) return;

      const r = activeRow;

      // 1. Configuramos el targetIndex SOLO para la fila que va a rotar
      setTargetIndices((prevTargets) => {
        const next = [...prevTargets];
        next[r] = (currentIndices[r] + ROWS_TO_SHOW) % displayShows.length;
        return next;
      });

      // 2. Inicia giro del DÍA: mientras tanto, el mes y el artista siguen mostrando el actual
      setRowFlapPhases((prev) => {
        const next = [...prev];
        next[r] = 'day';
        return next;
      });

      // 3. Termina DÍA, inicia giro del MES
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

      // 4. Termina MES, inicia giro del ARTISTA
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

      // 5. Termina ARTISTA: Fila r asienta el nuevo show en currentIndices y vuelve a 'idle'
      timeouts.push(
        setTimeout(() => {
          if (isCancelled) return;
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

          // PAUSA DE 2 SEGUNDOS antes de que empiece a rotar la siguiente fila
          timeouts.push(
            setTimeout(() => {
              if (isCancelled) return;
              scheduleNextRow();
            }, PAUSE_BETWEEN_ROWS)
          );
        }, DAY_DURATION + MONTH_DURATION + BAND_DURATION)
      );
    };

    // Pausa inicial antes del primer ciclo
    const initialDelay = setTimeout(() => {
      scheduleNextRow();
    }, 4000);
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
        {currentIndices.map((currentIdx, rowPos) => {
          const currentShow = displayShows[currentIdx % displayShows.length] || displayShows[0];
          const targetIdx = targetIndices[rowPos];
          const targetShow = displayShows[targetIdx % displayShows.length] || displayShows[0];

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
