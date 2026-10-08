import React, { useState } from 'react';
import { 
  Calendar, 
  MapPin, 
  Ticket, 
  ExternalLink, 
  Clock, 
  Flame, 
  Sparkles,
  Edit3,
  Trash2,
  Share2,
  CalendarPlus,
  MessageCircle,
  Check,
  Copy
} from 'lucide-react';
import { Show } from '../types';
import { formatSingleDate, getDaysUntil } from '../utils/dateHelpers';
import { trackTicketClick, trackShareEvent } from '../services/metricsService';
import { safeHttpUrl } from '../utils/safeUrl';
import { getWhatsAppShareUrl, addToDeviceCalendar } from '../utils/shareAndCalendar';
import { formatDisplayPrice } from '../utils/priceHelpers';
import { formatProperCase } from '../utils/textFormatting';
import { SpotifyIcon } from './SpotifyIcon';
import { WhatsAppIcon } from './WhatsAppIcon';

interface ShowCardProps {
  show: Show;
  onSelectShow?: (show: Show) => void;
  isAdmin?: boolean;
  onEditShow?: (show: Show) => void;
  onDeleteShow?: (id: string) => void;
}

export const ShowCard: React.FC<ShowCardProps> = ({
  show,
  onSelectShow,
  isAdmin,
  onEditShow,
  onDeleteShow,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [addedCalendar, setAddedCalendar] = useState(false);

  const fallbackImage = 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=800&auto=format&fit=crop';
  const earliestDate = show.dates[0] || '';
  const countdown = getDaysUntil(earliestDate);

  const handleShareWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    trackShareEvent(show.id, show.band);
    const url = getWhatsAppShareUrl(show);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleAddToCalendar = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToDeviceCalendar(show);
    setAddedCalendar(true);
    setTimeout(() => setAddedCalendar(false), 2000);
  };

  return (
    <div
      id={`show-card-${show.id}`}
      className={`scroll-mt-28 group relative bg-slate-900 border rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-rose-950/20 transition-all duration-300 flex flex-col justify-between ${
        isAdmin && show.isNewBadge
          ? 'border-amber-500/70 ring-1 ring-amber-500/40'
          : 'border-slate-800 hover:border-slate-700/90'
      }`}
    >
      <div>
        {/* Band Photo Container */}
        <div className="relative h-56 w-full overflow-hidden bg-slate-950">
          {/* Action buttons (Favorite & Admin) in Top Right */}
          <div className="absolute top-3 right-3 z-20 flex items-center space-x-1.5">
            {isAdmin && (
              <>
                <button
                  id={`edit-show-${show.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditShow?.(show);
                  }}
                  className="p-2 rounded-full bg-slate-900/90 hover:bg-amber-500 hover:text-slate-950 backdrop-blur-md border border-white/20 text-amber-300 transition-all shadow-md active:scale-90"
                  title="Editar datos de este recital"
                  aria-label="Editar show"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  id={`delete-show-${show.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`¿Eliminar "${show.band}" de la cartelera? Esta acción no se puede deshacer.`)) {
                      onDeleteShow?.(show.id);
                    }
                  }}
                  className="p-2 rounded-full bg-slate-900/90 hover:bg-red-600 hover:text-white backdrop-blur-md border border-white/20 text-red-400 transition-all shadow-md active:scale-90 cursor-pointer"
                  title="Eliminar este recital de la cartelera"
                  aria-label="Eliminar show"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>

          {/* Bottom Info Strip on Image: Genre + Countdown */}
          <div className="absolute bottom-2.5 inset-x-2.5 z-20 flex items-center justify-between gap-1.5 pointer-events-none">
            {/* Genre Tag */}
            <div className="px-2 py-0.5 rounded-md bg-slate-950/85 backdrop-blur-md border border-white/10 text-[11px] font-medium text-slate-300 truncate max-w-[120px]">
              {show.genre}
            </div>

            {/* Countdown Pill on Bottom Right of Image */}
            {!countdown.isPast ? (
              <div className="flex items-center px-2 py-0.5 rounded-md bg-slate-950/85 backdrop-blur-md border border-white/10 text-[11px] font-medium text-slate-200 shrink-0">
                <Clock className="w-3 h-3 mr-1 text-rose-400" />
                {countdown.text}
              </div>
            ) : (
              <div className="w-1" />
            )}
          </div>

          {/* Image */}
          <img
            src={imageError ? fallbackImage : show.image}
            alt={`Foto de ${show.band}`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            loading="lazy"
            referrerPolicy="no-referrer"
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ${
              show.imagePosition === 'bottom'
                ? 'object-bottom'
                : show.imagePosition === 'center'
                ? 'object-center'
                : 'object-top'
            } ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent pointer-events-none" />
        </div>

        {/* Card Body */}
        <div className="p-5 space-y-3">
          {/* Band Name & Tour Name */}
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white group-hover:text-rose-400 transition-colors tracking-tight">
                {show.band}
              </h3>
              {isAdmin && show.isNewBadge && (
                <span
                  className="flex items-center shrink-0 text-[10px] uppercase font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/30"
                  title="Este show sale en el cartel MDQ LINE UP - DESTACADOS (solo lo ves vos como administrador)"
                >
                  <Flame className="w-3 h-3 mr-0.5 text-amber-400" /> Line up
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-slate-400 mt-0.5 line-clamp-1 flex items-center">
              <Sparkles className="w-3.5 h-3.5 mr-1 text-rose-400 shrink-0" />
              {show.tourName}
            </p>
          </div>

          {/* Venue & Address (Donde tocan) */}
          <div className="flex items-start text-xs text-slate-300 space-x-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
            <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">{formatProperCase(show.venue)}</p>
              <p className="text-slate-400 text-[11px]">{formatProperCase(show.venueAddress)}</p>
            </div>
          </div>

          {/* Dates (Fechas que tocan) */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              <span className="flex items-center">
                <Calendar className="w-3 h-3 mr-1 text-rose-400" />
                FECHAS CONFIRMADAS
              </span>
              <span className="text-slate-400 font-normal">{show.time}</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {show.dates.map((dateStr) => (
                <span
                  key={dateStr}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700/80 text-white font-medium text-xs flex items-center shadow-xs"
                >
                  {formatSingleDate(dateStr)}
                </span>
              ))}
            </div>
          </div>

          {/* Price */}
          {show.ticketPriceRange && (
            <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-800/80 mt-1">
              <span className="text-amber-300 font-semibold flex items-center gap-1.5">
                <Ticket className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                {formatDisplayPrice(show.ticketPriceRange)}
              </span>
              <span className="text-[11px] text-slate-400">Oficial</span>
            </div>
          )}
        </div>
      </div>

      {/* Card Footer: Action Buttons & Metrics */}
      <div className="p-5 pt-0 space-y-2">
        {/* Direct Link to Ticket Portal (AllAccess, Ticketek, etc.) */}
        <div>
          <a
            id={`buy-tickets-link-${show.id}`}
            href={safeHttpUrl(show.ticketUrl)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              trackTicketClick(show.id, show.band);
            }}
            className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-900/30 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            <Ticket className="w-3.5 h-3.5 mr-1.5 shrink-0" />
            <span className="truncate">Comprar Entradas en {formatProperCase(show.ticketPortalName)}</span>
            <ExternalLink className="w-3 h-3 ml-1.5 shrink-0 opacity-80" />
          </a>
        </div>

        {/* Secondary Actions: WhatsApp, Spotify (si tiene) & Calendar - Iconos limpios sin texto truncado */}
        <div className={`grid ${safeHttpUrl(show.spotifyUrl) ? 'grid-cols-3' : 'grid-cols-2'} gap-2 relative`}>
          {/* WhatsApp Share con icono oficial (teléfono adentro) */}
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="flex items-center justify-center py-2 px-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 text-[#25D366] hover:text-[#2ee672] border border-emerald-500/30 transition-all active:scale-95 cursor-pointer shadow-xs"
            title="Compartir fecha de recital por WhatsApp"
          >
            <WhatsAppIcon className="w-4 h-4 shrink-0" />
          </button>

          {/* Spotify Direct Link (si el recital tiene link cargado) */}
          {safeHttpUrl(show.spotifyUrl) && (
            <a
              href={safeHttpUrl(show.spotifyUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center py-2 px-2 rounded-xl bg-green-950/40 hover:bg-green-900/50 text-green-400 hover:text-green-300 border border-green-500/30 transition-all active:scale-95 cursor-pointer shadow-xs"
              title={`Escuchar a ${show.band} en Spotify`}
            >
              <SpotifyIcon className="w-4 h-4 text-[#1DB954] shrink-0" />
            </a>
          )}

          {/* Direct 1-Click Calendar button (auto-detects iPhone/Apple vs Google Calendar) */}
          <button
            type="button"
            onClick={handleAddToCalendar}
            className={`w-full flex items-center justify-center py-2 px-2 rounded-xl border transition-all active:scale-95 cursor-pointer shadow-xs ${
              addedCalendar
                ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
            }`}
            title="Guardar evento en tu calendario (detecta automáticamente Apple o Google Calendar)"
          >
            {addedCalendar ? (
              <Check className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <CalendarPlus className="w-4 h-4 text-rose-400 shrink-0" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
