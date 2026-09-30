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
 * Tile split-flap 100% determinista sin estados locales frágiles:
 * - Recibe 'char': el caracter que DEBE mostrarse ahora mismo.
 * - Recibe 'isFlipping': true si está girando mecánicamente.
 * - Recibe 'isFolded': true si la aleta está doblada (a 90°, plano ciego vertical).
 */
const MechanicalTile: React.FC<{
  char: string;
  isFlipping: boolean;
  isFolded: boolean;
  widthClass: string;
}> = ({ char, isFlipping, isFolded, widthClass }) => {
  return (
    <div
      className={`${widthClass} h-[22px] sm:h-[26px] md:h-[28px] bg-[#151515] border border-[#242424] rounded-[2px] flex items-center justify-center text-white text-xs sm:text-sm md:text-base font-bold shadow-inner shadow-black relative overflow-hidden transition-transform duration-250 ease-in-out ${
        isFolded
          ? 'rotate-x-90 scale-y-0 opacity-40 shadow-none'
          : 'rotate-x-0 scale-y-100 opacity-100 shadow-inner'
      }`}
      style={{
        transformOrigin: 'center center',
      }}
    >
      {/* Ranura central de división del flap */}
      <div className="absolute inset-x-0 top-1/2 h-[1px] bg-[#090909] z-10 pointer-events-none" />
      <span className="relative z-0 leading-none">
        {char === ' ' ? '\u00A0' : char}
      </span>
    </div>
  );
};

interface RowState {
  show: Show;
  dayFolded: boolean;
  monthFolded: boolean;
  bandFolded: boolean;
}

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

  // Estado explícito e inmutable de cada fila
  const [rows, setRows] = useState<RowState[]>(() => {
    return Array.from({ length: ROWS_TO_SHOW }, (_, i) => ({
      show: displayShows[i % Math.max(displayShows.length, 1)] || {
        id: `empty-${i}`,
        band: '',
        tourName: '',
        image: '',
        genre: '',
        city: 'Mar del Plata',
        venue: '',
        venueAddress: '',
        dates: [],
        time: '',
        ticketUrl: '',
        ticketPortalName: '',
        ticketPriceRange: '',
        ticketStatus: 'disponibles',
        description: '',
      },
      dayFolded: false,
      monthFolded: false,
      bandFolded: false,
    }));
  });

  // Si displayShows cambia o se carga por primera vez
  useEffect(() => {
    if (displayShows.length > 0) {
      setRows((prev) =>
        prev.map((r, i) => ({
          ...r,
          show: r.show.band ? r.show : (displayShows[i % displayShows.length] || r.show),
        }))
      );
    }
  }, [displayShows]);

  useEffect(() => {
    if (displayShows.length <= ROWS_TO_SHOW) return;

    let isCancelled = false;
    const timeouts: NodeJS.Timeout[] = [];

    // Tiempos exactos de animación (en ms)
    const FOLD_TIME = 220;   // Tiempo para plegarse a 90°
    const UNFOLD_TIME = 220; // Tiempo para abrirse a 0° con el nuevo dato
    const PAUSE_BETWEEN_ROWS = 2000; // 2 segundos constantes entre fila y fila

    // Índices globales de qué show le toca a cada una de las 5 filas
    const currentPoolIndices = [0, 1, 2, 3, 4];
    let currentRowToFlip = 0;

    const animateNextRow = () => {
      if (isCancelled) return;

      const r = currentRowToFlip;
      // Calculamos el siguiente show del pool para esta fila
      currentPoolIndices[r] = (currentPoolIndices[r] + ROWS_TO_SHOW) % displayShows.length;
      const nextShow = displayShows[currentPoolIndices[r]];

      const nextDate = parseAirportDateParts(nextShow.dates?.[0]);
      const nextBand = (nextShow.band || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();

      // ==========================================
      // ETAPA 1: DÍA
      // ==========================================
      // 1.1 Doblar el DÍA viejo a 90° (se pliega mostrando el día viejo)
      setRows((prev) => {
        const next = [...prev];
        next[r] = { ...next[r], dayFolded: true };
        return next;
      });

      // 1.2 A los FOLD_TIME (en el punto ciego vertical): actualizamos el DÍA a nextShow y desdoblamos
      timeouts.push(
        setTimeout(() => {
          if (isCancelled) return;
          setRows((prev) => {
            const next = [...prev];
            const currentShowCopy = { ...next[r].show };
            // Cambiamos solo la porción del día en las fechas del show de esa fila
            const curDate = parseAirportDateParts(currentShowCopy.dates?.[0]);
            currentShowCopy.dates = [`2026-11-${nextDate.day}`]; // Usamos token con el nuevo día
            next[r] = {
              ...next[r],
              show: {
                ...currentShowCopy,
                // Truco limpio: asociamos un objeto show con el día nuevo pero mes y banda viejos
                _overrideDay: nextDate.day,
              } as Show & { _overrideDay?: string; _overrideMonth?: string; _overrideBand?: string },
              dayFolded: false,
            };
            return next;
          });
        }, FOLD_TIME)
      );

      // ==========================================
      // ETAPA 2: MES (empieza al terminar el desdoble del día)
      // ==========================================
      const START_MONTH = FOLD_TIME + UNFOLD_TIME + 80;

      // 2.1 Doblar el MES viejo a 90°
      timeouts.push(
        setTimeout(() => {
          if (isCancelled) return;
          setRows((prev) => {
            const next = [...prev];
            next[r] = { ...next[r], monthFolded: true };
            return next;
          });
        }, START_MONTH)
      );

      // 2.2 En el punto ciego: actualizamos el MES a nextShow y desdoblamos
      timeouts.push(
        setTimeout(() => {
          if (isCancelled) return;
          setRows((prev) => {
            const next = [...prev];
            const currentShowCopy = { ...next[r].show } as any;
            currentShowCopy._overrideMonth = nextDate.month;
            next[r] = {
              ...next[r],
              show: currentShowCopy,
              monthFolded: false,
            };
            return next;
          });
        }, START_MONTH + FOLD_TIME)
      );

      // ==========================================
      // ETAPA 3: ARTISTA (empieza al terminar el desdoble del mes)
      // ==========================================
      const START_BAND = START_MONTH + FOLD_TIME + UNFOLD_TIME + 80;

      // 3.1 Doblar el ARTISTA viejo a 90° (todavía muestra el nombre anterior mientras se dobla)
      timeouts.push(
        setTimeout(() => {
          if (isCancelled) return;
          setRows((prev) => {
            const next = [...prev];
            next[r] = { ...next[r], bandFolded: true };
            return next;
          });
        }, START_BAND)
      );

      // 3.2 En el punto ciego: actualizamos por completo el show al nuevo nextShow y desdoblamos
      timeouts.push(
        setTimeout(() => {
          if (isCancelled) return;
          setRows((prev) => {
            const next = [...prev];
            // Ahora la fila r tiene completa y formalmente el nextShow
            next[r] = {
              ...next[r],
              show: nextShow,
              bandFolded: false,
            };
            return next;
          });
        }, START_BAND + FOLD_TIME)
      );

      // ==========================================
      // ETAPA 4: FIN DE FILA Y PAUSA DE 2 SEGUNDOS
      // ==========================================
      const ROW_CYCLE_COMPLETE = START_BAND + FOLD_TIME + UNFOLD_TIME;

      timeouts.push(
        setTimeout(() => {
          if (isCancelled) return;
          // Avanzamos al siguiente renglón (0 -> 1 -> 2 -> 3 -> 4 -> 0...)
          currentRowToFlip = (currentRowToFlip + 1) % ROWS_TO_SHOW;

          // PAUSA EXACTA DE 2 SEGUNDOS antes de que empiece la siguiente fila
          timeouts.push(
            setTimeout(() => {
              if (isCancelled) return;
              animateNextRow();
            }, PAUSE_BETWEEN_ROWS)
          );
        }, ROW_CYCLE_COMPLETE)
      );
    };

    // Pausa inicial de arranque
    const initialDelay = setTimeout(() => {
      animateNextRow();
    }, 4000);
    timeouts.push(initialDelay);

    return () => {
      isCancelled = true;
      timeouts.forEach(clearTimeout);
    };
  }, [displayShows]);

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
        {rows.map((rowState, rowPos) => {
          const { show, dayFolded, monthFolded, bandFolded } = rowState;
          const showAny = show as any;

          const defaultParts = parseAirportDateParts(show.dates?.[0]);
          const dayStr = (showAny._overrideDay || defaultParts.day || '  ').slice(0, 2);
          const monthStr = (showAny._overrideMonth || defaultParts.month || '   ').slice(0, 3);
          const cleanBand = (show.band || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
          const bandStr = cleanBand.padEnd(15, ' ').slice(0, 15);

          return (
            <div
              key={`row-${rowPos}`}
              className="flex items-center justify-between w-full bg-[#0e0e0e] font-airport-matrix select-none border-b border-[#1c1c1c] last:border-b-0 py-0.5 sm:py-1 px-1 sm:px-2"
            >
              {/* Columna Fecha: Día + Separador + Mes */}
              <div className="flex items-center gap-[2px] shrink-0">
                {/* DÍA */}
                {dayStr.split('').map((char, i) => (
                  <MechanicalTile
                    key={`day-${rowPos}-${i}`}
                    char={char}
                    isFlipping={dayFolded}
                    isFolded={dayFolded}
                    widthClass="w-[13px] sm:w-[16px] md:w-[18px]"
                  />
                ))}

                <div className="w-[3px] sm:w-[4px]" />

                {/* MES */}
                {monthStr.split('').map((char, i) => (
                  <MechanicalTile
                    key={`month-${rowPos}-${i}`}
                    char={char}
                    isFlipping={monthFolded}
                    isFolded={monthFolded}
                    widthClass="w-[13px] sm:w-[16px] md:w-[18px]"
                  />
                ))}
              </div>

              {/* Separador central */}
              <div className="flex items-center gap-[2px] mx-0.5 sm:mx-1 shrink-0">
                <div className="w-[6px] sm:w-[8px] h-[22px] sm:h-[26px] md:h-[28px] bg-[#121212] border border-[#202020] rounded-[2px]" />
              </div>

              {/* ARTISTA */}
              <div className="flex items-center gap-[2px] shrink-0">
                {bandStr.split('').map((char, i) => (
                  <MechanicalTile
                    key={`band-${rowPos}-${i}`}
                    char={char}
                    isFlipping={bandFolded}
                    isFolded={bandFolded}
                    widthClass="w-[12px] sm:w-[15px] md:w-[17px]"
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
