import React, { useState } from 'react';
import { 
  Calendar, 
  MapPin, 
  Ticket, 
  ExternalLink, 
  Heart, 
  Clock, 
  Flame, 
  Sparkles,
  Edit3,
  Trash2,
  MousePointerClick,
  Share2,
  CalendarPlus,
  MessageCircle,
  Check,
  Copy
} from 'lucide-react';
import { Show } from '../types';
import { formatSingleDate, getDaysUntil } from '../utils/dateHelpers';
import { trackTicketClick, trackShareEvent } from '../services/metricsService';
import { getWhatsAppShareUrl, addToDeviceCalendar } from '../utils/shareAndCalendar';
import { formatDisplayPrice } from '../utils/priceHelpers';
import { formatProperCase } from '../utils/textFormatting';
import { SpotifyIcon } from './SpotifyIcon';

interface ShowCardProps {
  show: Show;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onSelectShow?: (show: Show) => void;
  isAdmin?: boolean;
  onEditShow?: (show: Show) => void;
  onDeleteShow?: (id: string) => void;
  metrics?: {
    ticketClicks: number;
    shares: number;
    favoritesCount: number;
  };
}

export const ShowCard: React.FC<ShowCardProps> = ({
  show,
  isFavorite,
  onToggleFavorite,
  onSelectShow,
  isAdmin,
  onEditShow,
  onDeleteShow,
  metrics,
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

  // Status configuration
  const statusConfig = {
    disponibles: {
      label: 'Entradas Disponibles',
      bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
      dot: 'bg-emerald-400',
    },
    ultimas_entradas: {
      label: '¡Últimas Entradas!',
      bg: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
      dot: 'bg-amber-400 animate-pulse',
    },
    agotado: {
      label: 'Sold Out / Agotado',
      bg: 'bg-rose-500/15 border-rose-500/30 text-rose-300',
      dot: 'bg-rose-500',
    },
    proximamente: {
      label: 'Próxima Venta',
      bg: 'bg-sky-500/15 border-sky-500/30 text-sky-300',
      dot: 'bg-sky-400',
    },
  }[show.ticketStatus];

  return (
    <div
      id={`show-card-${show.id}`}
      className="scroll-mt-28 group relative bg-slate-900 border border-slate-800 hover:border-slate-700/90 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-rose-950/20 transition-all duration-300 flex flex-col justify-between"
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
                    onDeleteShow?.(show.id);
                  }}
                  className="p-2 rounded-full bg-slate-900/90 hover:bg-red-600 hover:text-white backdrop-blur-md border border-white/20 text-red-400 transition-all shadow-md active:scale-90 cursor-pointer"
                  title="Eliminar este recital de la cartelera"
                  aria-label="Eliminar show"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}

            {/* Favorite Button */}
            <button
              id={`toggle-favorite-${show.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(show.id);
              }}
              className="p-2 rounded-full bg-slate-950/70 hover:bg-slate-900 backdrop-blur-md border border-white/10 text-slate-300 hover:text-white transition-transform active:scale-90"
              title={isFavorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
              aria-label="Guardar show"
            >
              <Heart
                className={`w-4 h-4 transition-colors ${
                  isFavorite ? 'fill-rose-500 text-rose-500' : 'text-white'
                }`}
              />
            </button>
          </div>

          {/* Bottom Info Strip on Image: Genre + Status Badge in center + Countdown */}
          <div className="absolute bottom-2.5 inset-x-2.5 z-20 flex items-center justify-between gap-1.5 pointer-events-none">
            {/* Genre Tag */}
            <div className="px-2 py-0.5 rounded-md bg-slate-950/85 backdrop-blur-md border border-white/10 text-[11px] font-medium text-slate-300 truncate max-w-[90px] sm:max-w-[110px]">
              {show.genre}
            </div>

            {/* Status Badge Centered at bottom of photo (no tapa el rostro del cantante) */}
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold backdrop-blur-md border shadow-sm shrink-0 ${statusConfig.bg}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
              <span className="text-white text-[10px] sm:text-[11px] font-medium">{statusConfig.label}</span>
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
              {show.featured && (
                <span className="flex items-center text-[10px] uppercase font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                  <Flame className="w-3 h-3 mr-0.5 text-amber-400" /> Destacado
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
                {show.dates.length === 1 ? 'Fecha Confirmada' : `Fechas (${show.dates.length})`}
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
            href={show.ticketUrl}
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
          <p className="text-[10px] text-center text-slate-500 mt-1">
            Redirección directa a la ticketera oficial del evento
          </p>
        </div>

        {/* Secondary Actions: WhatsApp, Spotify (si tiene) & Calendar */}
        <div className={`grid ${show.spotifyUrl ? 'grid-cols-3' : 'grid-cols-2'} gap-2 relative`}>
          {/* WhatsApp Share */}
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="flex items-center justify-center py-2 px-2.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-all active:scale-95 cursor-pointer shadow-xs"
            title="Compartir fecha de recital por WhatsApp"
          >
            <MessageCircle className="w-3.5 h-3.5 mr-1 text-emerald-400 shrink-0" />
            <span className="truncate">WhatsApp</span>
          </button>

          {/* Spotify Direct Link (si el recital tiene link cargado) */}
          {show.spotifyUrl && (
            <a
              href={show.spotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center py-2 px-2.5 rounded-xl bg-green-950/40 hover:bg-green-900/50 text-green-400 hover:text-green-300 border border-green-500/30 text-xs font-semibold transition-all active:scale-95 cursor-pointer shadow-xs"
              title={`Escuchar a ${show.band} en Spotify`}
            >
              <SpotifyIcon className="w-3.5 h-3.5 mr-1 text-[#1DB954] shrink-0" />
              <span className="truncate">Spotify</span>
            </a>
          )}

          {/* Direct 1-Click Calendar button (auto-detects iPhone/Apple vs Google Calendar) */}
          <button
            type="button"
            onClick={handleAddToCalendar}
            className={`w-full flex items-center justify-center py-2 px-2.5 rounded-xl border text-xs font-semibold transition-all active:scale-95 cursor-pointer shadow-xs ${
              addedCalendar
                ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
            }`}
            title="Guardar evento en tu calendario (detecta automáticamente Apple o Google Calendar)"
          >
            {addedCalendar ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1 text-rose-400 shrink-0" />
                <span className="truncate">¡Agendando!</span>
              </>
            ) : (
              <>
                <CalendarPlus className="w-3.5 h-3.5 mr-1 text-rose-400 shrink-0" />
                <span className="truncate">Agendar</span>
              </>
            )}
          </button>
        </div>

        {/* Métricas para el Administrador (para evaluar performance y ofrecer pauta comercial) */}
        {isAdmin && metrics && (
          <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-950/80 border border-emerald-500/30 text-[11px] text-slate-300 font-medium">
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <MousePointerClick className="w-3 h-3 text-emerald-400" />
              {metrics.ticketClicks} {metrics.ticketClicks === 1 ? 'click' : 'clicks'} tickets
            </span>
            <span className="text-slate-400 flex items-center gap-1">
              <Heart className="w-3 h-3 text-rose-400" />
              {metrics.favoritesCount} favs
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
