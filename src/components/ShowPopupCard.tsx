import React, { useState } from 'react';
import { MapPin } from 'lucide-react';
import { Show } from '../types';
import { getDaysUntil } from '../utils/dateHelpers';
import { getImageFrameStyle } from '../utils/imageFocus';

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
 * Aviso de inicio para un recital (solo información, sin botones): foto grande del show
 * con la banda, la fecha, la hora y el lugar abajo, centrados.
 */
export const ShowPopupCard: React.FC<ShowPopupCardProps> = ({ show, onClick }) => {
  const [imageError, setImageError] = useState(false);
  const when = getNextDateParts(show.dates);
  const time = (show.time || '').trim().toUpperCase();
  const place = (show.venue || '').trim() || (show.city || '').trim();
  const hasImage = Boolean(show.image) && !imageError;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick?.();
      }}
      aria-label={`${show.band}${place ? ` en ${place}` : ''}`}
      className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden bg-slate-900 cursor-pointer"
    >
      {/* Foto del show (con el encuadre y el zoom elegidos en el administrador) */}
      {hasImage ? (
        <img
          src={show.image}
          alt={`Foto de ${show.band}`}
          referrerPolicy="no-referrer"
          onError={() => setImageError(true)}
          style={getImageFrameStyle(show)}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,#7c3aed_0,transparent_55%),radial-gradient(circle_at_75%_70%,#e11d48_0,transparent_55%)] bg-[#1b1030]" />
      )}

      {/* Degradé oscuro: oscurece un poco arriba (para el cartelito) y bastante abajo (para leer los datos) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 38%, rgba(5,6,10,0.74) 66%, rgba(5,6,10,0.97) 100%)',
        }}
      />

      <div className="absolute top-3 inset-x-0 flex justify-center">
        <span className="text-[10px] font-bold tracking-[0.14em] text-white bg-rose-600/90 px-3 py-1 rounded-full">
          RECITAL DESTACADO
        </span>
      </div>

      <div className="absolute inset-x-0 bottom-0 p-5 text-center">
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
    </div>
  );
};
