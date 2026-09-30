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
  if (!dateInput) return { day: '  ', month: '   ' };
  const rawStr = Array.isArray(dateInput) ? dateInput[0] : dateInput;
  if (!rawStr || typeof rawStr !== 'string') return { day: '  ', month: '   ' };

  const clean = rawStr.trim();
  if (!clean) return { day: '  ', month: '   ' };

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

  return { day: '  ', month: '   ' };
}

/**
 * Casilla split-flap con rotación mecánica de 2 tiempos:
 * - Se pliega a 90° mostrando 'char'.
 * - En 'isFolded' = true, queda de perfil (invisible).
 * - Al desdoblarse a 0° muestra el nuevo caracter.
 */
const MechanicalTile: React.FC<{
  char: string;
  isFolded: boolean;
  widthClass: string;
}> = ({ char, isFolded, widthClass }) => {
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
      {/* Ranura divisoria horizontal central de la aleta */}
      <div className="absolute inset-x-0 top-1/2 h-[1px] bg-[#090909] z-10 pointer-events-none" />
      <span className="relative z-0 leading-none">
        {char === ' ' ? '\u00A0' : char}
      </span>
    </div>
  );
};

// Objeto que representa exactamente lo que se muestra en cada fila de la cartelera
interface DisplayRowState {
  day: string;    // Siempre 2 caracteres exactos
  month: string;  // Siempre 3 caracteres exactos
  band: string;   // Siempre 15 caracteres exactos
  dayFolded: boolean;
  monthFolded: boolean;
  bandFolded: boolean;
}

// Fila vacía de separación (las mismas casillas pero sin letras)
const EMPTY_ROW_ITEM: { date?: string; band: string } = {
  date: '',
  band: '               ', // 15 espacios vacíos
};

export const AirportBoardHeader: React.FC<AirportBoardHeaderProps> = ({ shows = [] }) => {
  // Ordenamos cronológicamente los shows
  const sortedShows = React.useMemo(() => {
    if (!shows || shows.length === 0) return [];
    
    const explicitlyMarked = shows.filter(s => s.isNewBadge === true);
    const pool = explicitlyMarked.length >= 5 ? explicitlyMarked : shows;

    const getShowEarliestDate = (s: Show): string => {
      if (Array.isArray(s.dates) && s.dates.length > 0) {
        return [...s.dates].sort()[0];
      }
      return '9999-99-99';
    };

    return [...pool].sort((a, b) => {
      const dateA = getShowEarliestDate(a);
      const dateB = getShowEarliestDate(b);
      return dateA.localeCompare(dateB);
    });
  }, [shows]);

  // Lista unificada para la cartelera: Todos los shows ordenados + 1 FILA VACÍA de separación al final
  // Esto genera el efecto solicitado: luego de mostrar el último show (el más lejano en fecha),
  // rota una fila completamente vacía como separador antes de volver a empezar desde el show más próximo.
  const boardItems = React.useMemo(() => {
    if (sortedShows.length === 0) return [];
    return [
      ...sortedShows.map(s => {
        const earliest = Array.isArray(s.dates) && s.dates.length > 0 ? [...s.dates].sort()[0] : '';
        return {
          date: earliest,
          band: (s.band || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().padEnd(15, ' ').slice(0, 15)
        };
      }),
      EMPTY_ROW_ITEM // Renglón vacío de separación
    ];
  }, [sortedShows]);

  const ROWS_TO_SHOW = 5;

  // Estado inicial de las 5 filas
  const [rows, setRows] = useState<DisplayRowState[]>(() => {
    return Array.from({ length: ROWS_TO_SHOW }, (_, i) => {
      const item = boardItems[i] || { date: '', band: '               ' };
      const parts = parseAirportDateParts(item.date);
      return {
        day: parts.day.padEnd(2, ' ').slice(0, 2),
        month: parts.month.padEnd(3, ' ').slice(0, 3),
        band: (item.band || '').padEnd(15, ' ').slice(0, 15),
        dayFolded: false,
        monthFolded: false,
        bandFolded: false,
      };
    });
  });

  // Inicialización cuando boardItems esté disponible por primera vez
  useEffect(() => {
    if (boardItems.length > 0) {
      setRows((prev) => {
        // Solo inicializamos si estaban vacías
        const hasContent = prev.some(r => r.band.trim().length > 0);
        if (hasContent) return prev;
        return Array.from({ length: ROWS_TO_SHOW }, (_, i) => {
          const item = boardItems[i % boardItems.length];
          const parts = parseAirportDateParts(item.date);
          return {
            day: parts.day.padEnd(2, ' ').slice(0, 2),
            month: parts.month.padEnd(3, ' ').slice(0, 3),
            band: (item.band || '').padEnd(15, ' ').slice(0, 15),
            dayFolded: false,
            monthFolded: false,
            bandFolded: false,
          };
        });
      });
    }
  }, [boardItems]);

  useEffect(() => {
    if (boardItems.length <= ROWS_TO_SHOW) return;

    let isCancelled = false;
    const timeouts: NodeJS.Timeout[] = [];

    const FOLD_TIME = 240;   // Tiempo de giro a 90°
    const UNFOLD_TIME = 240; // Tiempo de apertura a 0°
    const PAUSE_BETWEEN_ROWS = 2000; // 2 segundos constantes entre cada fila

    // Puntero cíclico global de cuál es el siguiente show de la lista a ingresar en la cartelera
    // Inicialmente los primeros 5 shows están en las posiciones 0, 1, 2, 3, 4.
    // Por lo tanto, el siguiente elemento a entrar cuando rote la fila 0 es el índice 5.
    let nextItemPointer = ROWS_TO_SHOW % boardItems.length;
    let currentRowToAnimate = 0;

    const animateNextRow = () => {
      if (isCancelled) return;

      const r = currentRowToAnimate;
      // Obtenemos el próximo elemento garantizado
      const targetItem = boardItems[nextItemPointer];
      const targetParts = parseAirportDateParts(targetItem.date);
      const targetDay = targetParts.day.padEnd(2, ' ').slice(0, 2);
      const targetMonth = targetParts.month.padEnd(3, ' ').slice(0, 3);
      const targetBand = (targetItem.band || '').padEnd(15, ' ').slice(0, 15);

      // Avanzamos el puntero para la próxima fila
      nextItemPointer = (nextItemPointer + 1) % boardItems.length;

      // ==========================================
      // ETAPA 1: DÍA
      // ==========================================
      // 1.1 Doblar el DÍA a 90° (todavía muestra el día viejo mientras gira)
      setRows((prev) => {
        const next = [...prev];
        next[r] = { ...next[r], dayFolded: true };
        return next;
      });

      // 1.2 En 90° (punto ciego): cambiamos el texto a targetDay y desdoblamos
      timeouts.push(
        setTimeout(() => {
          if (isCancelled) return;
          setRows((prev) => {
            const next = [...prev];
            next[r] = {
              ...next[r],
              day: targetDay,
              dayFolded: false,
            };
            return next;
          });
        }, FOLD_TIME)
      );

      // ==========================================
      // ETAPA 2: MES (inicia recién al terminar de desdoblarse el día)
      // ==========================================
      const START_MONTH = FOLD_TIME + UNFOLD_TIME + 60;

      // 2.1 Doblar el MES a 90°
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

      // 2.2 En 90°: cambiamos el texto a targetMonth y desdoblamos
      timeouts.push(
        setTimeout(() => {
          if (isCancelled) return;
          setRows((prev) => {
            const next = [...prev];
            next[r] = {
              ...next[r],
              month: targetMonth,
              monthFolded: false,
            };
            return next;
          });
        }, START_MONTH + FOLD_TIME)
      );

      // ==========================================
      // ETAPA 3: ARTISTA (inicia recién al terminar de desdoblarse el mes)
      // ==========================================
      const START_BAND = START_MONTH + FOLD_TIME + UNFOLD_TIME + 60;

      // 3.1 Doblar el ARTISTA a 90° (conserva el nombre viejo mientras gira)
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

      // 3.2 En 90°: cambiamos el texto a targetBand y desdoblamos
      timeouts.push(
        setTimeout(() => {
          if (isCancelled) return;
          setRows((prev) => {
            const next = [...prev];
            next[r] = {
              ...next[r],
              band: targetBand,
              bandFolded: false,
            };
            return next;
          });
        }, START_BAND + FOLD_TIME)
      );

      // ==========================================
      // ETAPA 4: FIN DE FILA Y ESPERA DE 2 SEGUNDOS
      // ==========================================
      const TOTAL_ROW_ANIMATION = START_BAND + FOLD_TIME + UNFOLD_TIME;

      timeouts.push(
        setTimeout(() => {
          if (isCancelled) return;
          // Avanzamos al siguiente renglón (0 -> 1 -> 2 -> 3 -> 4 -> 0...)
          currentRowToAnimate = (currentRowToAnimate + 1) % ROWS_TO_SHOW;

          // PAUSA DE EXACTAMENTE 2 SEGUNDOS antes de la siguiente fila
          timeouts.push(
            setTimeout(() => {
              if (isCancelled) return;
              animateNextRow();
            }, PAUSE_BETWEEN_ROWS)
          );
        }, TOTAL_ROW_ANIMATION)
      );
    };

    // Pausa inicial antes del primer giro
    const initialTimer = setTimeout(() => {
      animateNextRow();
    }, 4000);
    timeouts.push(initialTimer);

    return () => {
      isCancelled = true;
      timeouts.forEach(clearTimeout);
    };
  }, [boardItems]);

  if (boardItems.length === 0) return null;

  return (
    <div className="relative w-full h-full min-h-[280px] sm:min-h-[310px] rounded-2xl bg-[#090a0c] border-2 border-[#202226] p-2 sm:p-3 shadow-2xl shadow-black overflow-hidden select-none flex flex-col justify-between">
      {/* Marco superior: "MDQ LINE UP" con el color ámbar vintage original */}
      <div className="flex items-center pb-1.5 mb-1 border-b border-[#1c1e22] px-1 text-zinc-400 font-airport-matrix">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#e2b740] animate-pulse" />
          <span className="text-[#e2b740] font-black tracking-[0.25em] text-xs sm:text-sm">
            MDQ LINE UP
          </span>
        </div>
      </div>

      {/* Contenedor principal con las 5 FILAS exactas */}
      <div className="bg-[#0b0c0e] border border-[#1a1c20] rounded-lg overflow-hidden shadow-inner flex-1 flex flex-col justify-around my-auto">
        {rows.map((rowState, rowPos) => {
          const { day, month, band, dayFolded, monthFolded, bandFolded } = rowState;

          return (
            <div
              key={`row-${rowPos}`}
              className="flex items-center justify-between w-full bg-[#0e0e0e] font-airport-matrix select-none border-b border-[#1c1c1c] last:border-b-0 py-0.5 sm:py-1 px-1 sm:px-2"
            >
              {/* Columna Fecha: Día (2 casillas) + Separador + Mes (3 casillas) */}
              <div className="flex items-center gap-[2px] shrink-0">
                {/* DÍA */}
                {day.split('').map((char, i) => (
                  <MechanicalTile
                    key={`day-${rowPos}-${i}`}
                    char={char}
                    isFolded={dayFolded}
                    widthClass="w-[13px] sm:w-[16px] md:w-[18px]"
                  />
                ))}

                <div className="w-[3px] sm:w-[4px]" />

                {/* MES */}
                {month.split('').map((char, i) => (
                  <MechanicalTile
                    key={`month-${rowPos}-${i}`}
                    char={char}
                    isFolded={monthFolded}
                    widthClass="w-[13px] sm:w-[16px] md:w-[18px]"
                  />
                ))}
              </div>

              {/* Separador central */}
              <div className="flex items-center gap-[2px] mx-0.5 sm:mx-1 shrink-0">
                <div className="w-[6px] sm:w-[8px] h-[22px] sm:h-[26px] md:h-[28px] bg-[#121212] border border-[#202020] rounded-[2px]" />
              </div>

              {/* ARTISTA (15 casillas) */}
              <div className="flex items-center gap-[2px] shrink-0">
                {band.split('').map((char, i) => (
                  <MechanicalTile
                    key={`band-${rowPos}-${i}`}
                    char={char}
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
