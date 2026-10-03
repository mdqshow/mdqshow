import React from 'react';
import { Calendar, MapPin, Heart, ExternalLink, MessageCircle, CalendarPlus, Ticket, Edit3, Trash2 } from 'lucide-react';
import { Show } from '../types';
import { getDaysUntil } from '../utils/dateHelpers';
import { trackTicketClick, trackShareEvent } from '../services/metricsService';
import { getWhatsAppShareUrl, addToDeviceCalendar } from '../utils/shareAndCalendar';
import { formatDisplayPrice } from '../utils/priceHelpers';
import { formatProperCase } from '../utils/textFormatting';
import { AdSenseBanner } from './AdSenseBanner';
import { SpotifyIcon } from './SpotifyIcon';
import { WhatsAppIcon } from './WhatsAppIcon';
import { Sponsor } from '../types';

interface TimelineAgendaViewProps {
  shows: Show[];
  onSelectShow: (show: Show) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  isAdmin?: boolean;
  onEditShow?: (show: Show) => void;
  onDeleteShow?: (id: string) => void;
  metricsMap?: Record<string, { ticketClicks: number; shares: number; favoritesCount: number }>;
  sponsors?: Sponsor[];
}

interface TimelineItem {
  date: string;
  show: Show;
  globalIndex: number; // Índice correlativo global a lo largo de toda la lista
}

export const TimelineAgendaView: React.FC<TimelineAgendaViewProps> = ({
  shows,
  onSelectShow,
  favorites,
  onToggleFavorite,
  isAdmin,
  onEditShow,
  onDeleteShow,
  metricsMap,
  sponsors,
}) => {
  // Desglosamos todas las fechas para que cada recital tenga su lugar cronológico
  const rawItems: Array<{ date: string; show: Show }> = [];

  shows.forEach((show) => {
    show.dates.forEach((date) => {
      rawItems.push({ date, show });
    });
  });

  // Orden cronológico estricto
  rawItems.sort((a, b) => a.date.localeCompare(b.date));

  if (rawItems.length === 0) {
    return (
      <div className="text-center py-20 bg-slate-900/60 border border-slate-800 rounded-3xl p-8 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto">
          <Calendar className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white">No hay recitales en la agenda</h3>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          No se encontraron shows para mostrar con los filtros seleccionados.
        </p>
      </div>
    );
  }

  // Agrupamos por mes asignando un índice correlativo global (0, 1, 2... N)
  const groupedByMonth: { [key: string]: TimelineItem[] } = {};
  rawItems.forEach((item, globalIdx) => {
    const [year, month] = item.date.split('-');
    const dateObj = new Date(Number(year), Number(month) - 1, 1);
    const monthKey = dateObj.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    const capitalizedMonthKey = monthKey.charAt(0).toUpperCase() + monthKey.slice(1);

    if (!groupedByMonth[capitalizedMonthKey]) {
      groupedByMonth[capitalizedMonthKey] = [];
    }
    groupedByMonth[capitalizedMonthKey].push({
      date: item.date,
      show: item.show,
      globalIndex: globalIdx
    });
  });

  return (
    <div className="space-y-8">
      {Object.entries(groupedByMonth).map(([monthLabel, monthItems]) => (
        <div key={monthLabel} className="space-y-4">
          {/* Month Header Banner */}
          <div className="sticky top-20 z-30 flex items-center space-x-3 py-2 bg-[#0e1117]/95 backdrop-blur-md">
            <span className="px-3.5 py-1 rounded-xl bg-rose-500/10 text-rose-400 font-extrabold text-sm border border-rose-500/20 tracking-wide uppercase">
              {monthLabel}
            </span>
            <div className="h-px bg-slate-800 flex-1" />
            <span className="text-xs text-slate-400 font-medium">
              {monthItems.length} {monthItems.length === 1 ? 'fecha' : 'fechas'}
            </span>
          </div>

          {/* List of shows for this month */}
          <div className="space-y-3">
            {monthItems.map(({ date, show, globalIndex }) => {
              const countdown = getDaysUntil(date);
              const isFav = favorites.includes(show.id);
              // Intercalar dos publicidades propias lado a lado cada 6 shows de forma global continua
              const showSponsorBanner = (globalIndex + 1) % 6 === 0 && globalIndex !== rawItems.length - 1;

              return (
                <React.Fragment key={`${show.id}-${date}-${globalIndex}`}>
                  <div
                    id={`timeline-show-${show.id}`}
                    className="scroll-mt-28 bg-slate-900/90 border border-slate-800/90 hover:border-slate-700 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-200 hover:shadow-lg hover:shadow-rose-950/10"
                  >
                    {/* Left: Date Badge & Band Info */}
                    <div className="flex items-center space-x-4 w-full sm:w-auto min-w-0 flex-1">
                      {/* Date Block */}
                      <div className="flex flex-col items-center justify-center w-16 h-16 rounded-2xl bg-slate-950 border border-slate-800 text-center shrink-0 shadow-inner">
                        <span className="text-[11px] font-bold text-rose-400 uppercase leading-none">
                          {new Date(date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'short' })}
                        </span>
                        <span className="text-2xl font-black text-white leading-tight">
                          {date.split('-')[2]}
                        </span>
                        <span className="text-[10px] text-slate-400 leading-none">
                          {new Date(date + 'T00:00:00').toLocaleDateString('es-ES', { month: 'short' })}
                        </span>
                      </div>

                      {/* Band Thumbnail */}
                      <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-slate-700/60">
                        <img
                          src={show.image}
                          alt={show.band}
                          className={`w-full h-full object-cover ${
                            show.imagePosition === 'bottom'
                              ? 'object-bottom'
                              : show.imagePosition === 'center'
                              ? 'object-center'
                              : 'object-top'
                          }`}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-base sm:text-lg font-bold text-white truncate hover:text-rose-400 transition-colors cursor-pointer" onClick={() => onSelectShow(show)}>
                            {show.band}
                          </h4>
                          {!countdown.isPast && (
                            <span className="hidden md:inline-block text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                              {countdown.text}
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm font-medium text-rose-300/90 truncate">
                          {show.tourName}
                        </p>
                        <div className="flex flex-wrap items-center text-xs text-slate-400 mt-1.5 gap-x-3 gap-y-1.5">
                          {show.ticketPriceRange && (
                            <span className="text-[11px] font-semibold text-amber-300 bg-amber-950/40 border border-amber-500/30 px-2.5 py-0.5 rounded-md inline-flex items-center gap-1.5 shadow-xs">
                              <Ticket className="w-3 h-3 text-amber-400 shrink-0" />
                              <span>{formatDisplayPrice(show.ticketPriceRange)}</span>
                            </span>
                          )}
                          <span className="flex items-center">
                            <MapPin className="w-3.5 h-3.5 text-rose-400 mr-1 shrink-0" />
                            <strong className="text-slate-300 font-semibold">{formatProperCase(show.venue)}</strong>
                          </span>
                          <span className="text-slate-400">• {show.time}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80 shrink-0">
                      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => onEditShow?.(show)}
                              className="p-1.5 sm:p-2.5 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 border border-slate-700 text-amber-400 transition-colors shrink-0"
                              title="Editar show"
                            >
                              <Edit3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>
                            <button
                              id={`timeline-delete-${show.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteShow?.(show.id);
                              }}
                              className="p-1.5 sm:p-2.5 rounded-xl bg-slate-800 hover:bg-red-600 hover:text-white border border-slate-700 text-red-400 transition-colors cursor-pointer shrink-0"
                              title="Eliminar este recital de la cartelera"
                              aria-label="Eliminar show"
                            >
                              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => onToggleFavorite(show.id)}
                          className="p-2 sm:p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors shrink-0"
                          title={isFav ? 'Quitar de favoritos' : 'Guardar'}
                        >
                          <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                        </button>

                        {/* WhatsApp share */}
                        <button
                          onClick={() => {
                            trackShareEvent(show.id, show.band);
                            window.open(getWhatsAppShareUrl(show), '_blank', 'noopener,noreferrer');
                          }}
                          className="p-2 sm:p-2.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 text-[#25D366] hover:text-[#2ee672] transition-colors cursor-pointer shrink-0"
                          title="Compartir por WhatsApp"
                        >
                          <WhatsAppIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                        </button>

                        {/* Spotify link (si está configurado) */}
                        {show.spotifyUrl && (
                          <a
                            href={show.spotifyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 sm:p-2.5 rounded-xl bg-green-950/40 hover:bg-green-900/50 border border-green-500/30 text-[#1DB954] hover:text-green-300 transition-colors cursor-pointer shrink-0 flex items-center justify-center"
                            title={`Escuchar a ${show.band} en Spotify`}
                          >
                            <SpotifyIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </a>
                        )}

                        {/* Calendario inteligente 1-clic */}
                        <button
                          type="button"
                          onClick={() => addToDeviceCalendar(show, date)}
                          className="p-2 sm:p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-rose-400 transition-colors cursor-pointer shrink-0"
                          title="Agendar esta fecha en tu calendario"
                        >
                          <CalendarPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </div>

                      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 shrink-0 ml-auto sm:ml-0">
                        <a
                          href={show.ticketUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => {
                            trackTicketClick(show.id, show.band);
                          }}
                          className="flex items-center justify-center px-2.5 sm:px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-900/30 transition-all cursor-pointer max-w-[150px] sm:max-w-none"
                          title={`Comprar entradas en ${formatProperCase(show.ticketPortalName)}`}
                        >
                          <Ticket className="w-3.5 h-3.5 mr-1 shrink-0" />
                          <span className="sm:hidden truncate">{formatProperCase(show.ticketPortalName) || 'Entradas'}</span>
                          <span className="hidden sm:inline truncate">Entradas en {formatProperCase(show.ticketPortalName)}</span>
                          <ExternalLink className="w-3 h-3 ml-1 shrink-0 opacity-80" />
                        </a>
                        {isAdmin && metricsMap?.[show.id] && (
                          <span className="text-[10px] text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 whitespace-nowrap">
                            {metricsMap[show.id].ticketClicks} clicks
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Dos publicidades lado a lado en el ancho completo del cronograma cada 6 shows */}
                  {showSponsorBanner && (
                    <AdSenseBanner
                      format="timeline-double"
                      initialOffset={globalIndex}
                      sponsors={sponsors}
                      isTopBanner={false}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
