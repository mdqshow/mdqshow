import React from 'react';
import { MapPin } from 'lucide-react';
import { Show } from '../types';
import { getDaysUntil } from '../utils/dateHelpers';

interface ShowPopupCardProps {
  show: Show;
  onClick?: () => void;
}

const MONTHS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
const WEEKDAYS = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];

/** Próxima fecha del show que todavía no pasó (por ejemplo "DOM 08 NOV"). */
function getNextDateParts(dates: string[]): { weekday: string; day: string; month: string } | null {
  const upcoming = (dates || [])
    .filter((d) => {
      const info = getDaysUntil(d);
      return !info.isPast && info.days !== 999;
    })
    .sort();
  const first = upcoming[0];
  if (!first) return null;
  const [year, month, day] = first.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return {
    weekday: WEEKDAYS[date.getDay()],
    day: String(day).padStart(2, '0'),
    month: MONTHS[month - 1],
  };
}

/**
 * Aviso de inicio para un recital (solo información, sin foto ni botones): fondo de colores
 * con la banda, la fecha, la hora y el lugar, centrados.
 */
export const ShowPopupCard: React.FC<ShowPopupCardProps> = ({ show, onClick }) => {
  const when = getNextDateParts(show.dates);
  const time = (show.time || '').trim().toUpperCase();
  const place = (show.venue || '').trim() || (show.city || '').trim();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick?.();
      }}
      aria-label={`${show.band}${place ? ` en ${place}` : ''}`}
      className="relative w-full aspect-[8/7] rounded-2xl flex flex-col justify-end px-5 pb-5 pt-12 text-center cursor-pointer"
      style={{
        background:
          'linear-gradient(180deg, rgba(0,0,0,0.05) 15%, rgba(5,6,10,0.7) 55%, rgba(5,6,10,0.97) 100%), radial-gradient(circle at 30% 25%, #7c3aed 0, transparent 55%), radial-gradient(circle at 75% 70%, #e11d48 0, transparent 55%), #1b1030',
      }}
    >
      <div className="absolute top-3 inset-x-0 flex justify-center">
        <span className="text-[10px] font-bold tracking-[0.14em] text-white bg-rose-600/90 px-3 py-1 rounded-full">
          RECITAL DESTACADO
        </span>
      </div>

      {show.tourName ? (
        <p className="text-xs font-bold tracking-wide text-amber-300 mb-1.5 line-clamp-2">{show.tourName}</p>
      ) : null}

      <h3 className="text-3xl sm:text-4xl font-black uppercase leading-[0.95] tracking-tight text-white break-words">
        {show.band}
      </h3>

      <div className="mx-auto my-3 h-0.5 w-12 rounded bg-gradient-to-r from-rose-500 to-amber-500" />

      <p className="text-lg font-extrabold tracking-wide text-white">
        {when ? (
          <>
            {when.weekday} {when.day} <span className="text-rose-400">{when.month}</span>
          </>
        ) : (
          'FECHA A CONFIRMAR'
        )}
        {time ? ` · ${time}` : ''}
      </p>

      {place ? (
        <p className="mt-1.5 flex items-center justify-center gap-1.5 text-sm text-slate-200">
          <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span>{place}</span>
        </p>
      ) : null}
    </div>
  );
};
