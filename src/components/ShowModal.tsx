import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Calendar as CalendarIcon, 
  Building2, 
  Check, 
  Edit3, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Ticket,
  DollarSign,
  Globe,
  Upload,
  Image as ImageIcon,
  MapPin,
  Sparkles
} from 'lucide-react';
import { Show } from '../types';
import { AVAILABLE_CITIES, AVAILABLE_GENRES, PRESET_VENUES } from '../data/mockShows';
import { formatSingleDate } from '../utils/dateHelpers';
import { normalizePriceInput } from '../utils/priceHelpers';
import { detectTicketPortalFromUrl } from '../utils/ticketDetectors';
import { formatProperCase } from '../utils/textFormatting';
import { SpotifyIcon } from './SpotifyIcon';

interface ShowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveShow: (show: Show) => void;
  onDeleteShow?: (showId: string) => void;
  initialShow?: Show | null;
  defaultCity: string;
}

const PRESET_TICKET_PORTALS = [
  { name: 'AllAccess', url: 'https://www.allaccess.com.ar' },
  { name: 'Arte Infernal', url: 'https://www.arteinfernal.com.ar' },
  { name: 'Articket', url: 'https://articket.com.ar' },
  { name: 'Boletería del lugar', url: '' },
  { name: 'EntradaUno', url: 'https://www.entradauno.com' },
  { name: 'Passline', url: 'https://www.passline.com' },
  { name: 'PlateaNet', url: 'https://www.plateanet.com' },
  { name: 'Ticketek', url: 'https://www.ticketek.com.ar' },
  { name: 'TuEntrada', url: 'https://www.tuentrada.com' },
  { name: 'Venti', url: 'https://venti.com.ar' },
];

export const ShowModal: React.FC<ShowModalProps> = ({
  isOpen,
  onClose,
  onSaveShow,
  onDeleteShow,
  initialShow,
  defaultCity,
}) => {
  const isEditing = Boolean(initialShow);

  const [band, setBand] = useState('');
  const [tourName, setTourName] = useState('');
  const [genre, setGenre] = useState('Rock Nacional');
  const [city, setCity] = useState('Mar del Plata');
  const [venue, setVenue] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  
  // Date management: Interactive array of YYYY-MM-DD strings
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => new Date());
  const [quickDateInput, setQuickDateInput] = useState('');

  const [time, setTime] = useState('21:00 hs');
  
  // Ticket portal selection
  const [ticketPortalName, setTicketPortalName] = useState('Articket');
  const [isCustomPortal, setIsCustomPortal] = useState(false);
  const [ticketUrl, setTicketUrl] = useState('https://articket.com.ar');
  const [ticketPriceRange, setTicketPriceRange] = useState('');
  const [spotifyUrl, setSpotifyUrl] = useState('');

  const [image, setImage] = useState('');
  const [imagePosition, setImagePosition] = useState<'top' | 'center' | 'bottom'>('top');
  const [featured, setFeatured] = useState(false);
  const [isNewBadge, setIsNewBadge] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Synchronize when modal opens or initialShow changes
  useEffect(() => {
    if (initialShow) {
      setBand(initialShow.band || '');
      setTourName(initialShow.tourName || '');
      setGenre(initialShow.genre || 'Rock Nacional');
      setCity(initialShow.city || 'Mar del Plata');
      setVenue(initialShow.venue || '');
      setVenueAddress(initialShow.venueAddress || '');
      
      const dates = Array.isArray(initialShow.dates) ? [...initialShow.dates] : [];
      setSelectedDates(dates);
      if (dates.length > 0 && dates[0].includes('-')) {
        const [y, m] = dates[0].split('-').map(Number);
        setCalendarMonth(new Date(y, m - 1, 1));
      }

      setTime(initialShow.time || '21:00 hs');
      setTicketUrl(initialShow.ticketUrl || '');
      
      const isPreset = PRESET_TICKET_PORTALS.some(p => p.name.toLowerCase() === (initialShow.ticketPortalName || '').toLowerCase());
      if (isPreset) {
        const found = PRESET_TICKET_PORTALS.find(p => p.name.toLowerCase() === (initialShow.ticketPortalName || '').toLowerCase());
        setTicketPortalName(found ? found.name : initialShow.ticketPortalName);
        setIsCustomPortal(false);
      } else {
        setTicketPortalName(initialShow.ticketPortalName || 'Otra');
        setIsCustomPortal(true);
      }

      setTicketPriceRange(initialShow.ticketPriceRange || '');
      setSpotifyUrl(initialShow.spotifyUrl || '');
      setImage(initialShow.image || '');
      setImagePosition(initialShow.imagePosition || 'top');
      setFeatured(Boolean(initialShow.featured));
      setIsNewBadge(Boolean(initialShow.isNewBadge));
      setError('');
      setShowConfirmDelete(false);
    } else {
      setBand('');
      setTourName('');
      setGenre('Rock Nacional');
      setCity(defaultCity === 'Todas las ciudades' ? 'Mar del Plata' : defaultCity);
      setVenue('');
      setVenueAddress('');
      
      // Default to 30 days ahead
      const nextMonth = new Date();
      nextMonth.setDate(nextMonth.getDate() + 30);
      const defaultDateStr = nextMonth.toISOString().split('T')[0];
      setSelectedDates([defaultDateStr]);
      setCalendarMonth(new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1));

      setTime('21:00 hs');
      setTicketPortalName('Articket');
      setIsCustomPortal(false);
      setTicketUrl('https://articket.com.ar');
      setTicketPriceRange('');
      setTicketStatus('disponibles');
      setSpotifyUrl('');
      setImage('');
      setImagePosition('top');
      setFeatured(false);
      setIsNewBadge(true); // Nuevos shows vienen marcados como Novedad por defecto
      setError('');
      setShowConfirmDelete(false);
    }
  }, [initialShow, isOpen, defaultCity]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Venue helper
  const handleSelectPresetVenue = (presetName: string) => {
    const found = PRESET_VENUES.find((p) => p.name === presetName);
    if (found) {
      setVenue(found.name);
      setVenueAddress(found.address);
      if (found.defaultTicketPortal) {
        setTicketPortalName(found.defaultTicketPortal);
        setIsCustomPortal(false);
      }
      if (found.ticketUrl && (!ticketUrl || ticketUrl.includes('articket') || ticketUrl.includes('ticketek'))) {
        setTicketUrl(found.ticketUrl);
      }
    }
  };

  // Portal selection helper
  const handleSelectPortal = (portal: typeof PRESET_TICKET_PORTALS[0]) => {
    setTicketPortalName(portal.name);
    setIsCustomPortal(false);
    if (portal.url && (!ticketUrl || PRESET_TICKET_PORTALS.some(p => p.url === ticketUrl))) {
      setTicketUrl(portal.url);
    }
  };

  // URL change with auto-detection of ticketera
  const handleTicketUrlChange = (newUrl: string) => {
    setTicketUrl(newUrl);
    const detectedName = detectTicketPortalFromUrl(newUrl);
    if (detectedName) {
      const matchedPreset = PRESET_TICKET_PORTALS.find(
        (p) => p.name.toLowerCase() === detectedName.toLowerCase()
      );
      if (matchedPreset) {
        setTicketPortalName(matchedPreset.name);
        setIsCustomPortal(false);
      } else {
        setTicketPortalName(detectedName);
        setIsCustomPortal(true);
      }
    }
  };

  // Image file upload helper (supports WebP, JPG, PNG, AVIF)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('El archivo seleccionado debe ser una imagen válida (WebP, JPG, PNG o AVIF)');
        return;
      }
      // Check file size (recommend < 4MB for fast client performance)
      if (file.size > 5 * 1024 * 1024) {
        setError('La imagen es demasiado pesada (máx 5MB recomendado). Probá comprimirla o usar formato WebP.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (typeof event.target?.result === 'string') {
          setImage(event.target.result);
          setError('');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Calendar toggle helpers
  const toggleDate = (dateStr: string) => {
    setSelectedDates(prev => {
      if (prev.includes(dateStr)) {
        return prev.filter(d => d !== dateStr);
      } else {
        return [...prev, dateStr].sort();
      }
    });
  };

  const removeDate = (dateStr: string) => {
    setSelectedDates(prev => prev.filter(d => d !== dateStr));
  };

  const handleAddQuickDate = () => {
    if (quickDateInput && !selectedDates.includes(quickDateInput)) {
      setSelectedDates(prev => [...prev, quickDateInput].sort());
      setQuickDateInput('');
    }
  };

  const handlePrevMonth = () => {
    setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Calendar grid calculations
  const calYear = calendarMonth.getFullYear();
  const calMonth = calendarMonth.getMonth();
  const monthNameStr = calendarMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay(); // 0 is Sunday
  // Align Monday as 0, Sunday as 6
  const startOffset = (firstDayOfWeek + 6) % 7;
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!band.trim() || !venue.trim()) {
      setError('Por favor completá el nombre de la banda y el lugar/sede.');
      return;
    }

    if (selectedDates.length === 0) {
      setError('Por favor seleccioná al menos una fecha para el show en el calendario.');
      return;
    }

    const defaultImg = 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=800&auto=format&fit=crop';

    const savedShow: Show = {
      id: initialShow ? initialShow.id : `custom-${Date.now()}`,
      band: formatProperCase(band.trim()),
      tourName: tourName.trim() || 'Gira 2026',
      genre,
      city,
      venue: formatProperCase(venue.trim()),
      venueAddress: formatProperCase(venueAddress.trim()) || 'Sede principal',
      dates: selectedDates,
      time: time.trim() || '21:00 hs',
      ticketUrl: ticketUrl.trim() || 'https://articket.com.ar',
      ticketPortalName: formatProperCase(ticketPortalName.trim()) || 'Boletería Oficial',
      ticketPriceRange: normalizePriceInput(ticketPriceRange),
      ticketStatus: 'disponibles',
      image: image.trim() || defaultImg,
      imagePosition,
      description: initialShow?.description || `${band} en vivo en ${venue}.`,
      featured,
      isNewBadge,
      spotifyUrl: spotifyUrl.trim() || undefined,
      createdAt: initialShow?.createdAt || new Date().toISOString(),
      isUserAdded: true,
      openingActs: initialShow?.openingActs || [],
    };

    onSaveShow(savedShow);
    onClose();
  };

  const handleDelete = () => {
    if (initialShow && onDeleteShow) {
      onDeleteShow(initialShow.id);
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center space-x-2.5">
            <div className={`p-2 rounded-xl ${isEditing ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
              {isEditing ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {isEditing ? `Editar: ${initialShow?.band}` : 'Agregar Show a MDQSHOW'}
              </h3>
              <p className="text-xs text-slate-400">
                {isEditing ? 'Modificá las fechas, ticketera o datos del recital' : 'Cargá los datos básicos del recital de forma ágil'}
              </p>
            </div>
          </div>
          <button
            id="close-show-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs sm:text-sm">
          {error && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Band and Tour */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Nombre de la Banda / Artista *</label>
              <input
                type="text"
                required
                value={band}
                onChange={(e) => setBand(e.target.value)}
                placeholder="Ej: Divididos, Babasónicos..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Nombre de la Gira / Show</label>
              <input
                type="text"
                value={tourName}
                onChange={(e) => setTourName(e.target.value)}
                placeholder="Ej: Gira Despedida 2026..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* City (Fixed to Mar del Plata) and Genre */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Ciudad</label>
              <div className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 flex items-center text-white">
                <span className="flex items-center text-sm font-semibold text-rose-300">
                  <MapPin className="w-4 h-4 mr-2 text-rose-400 shrink-0" />
                  Mar del Plata
                </span>
              </div>
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Género Musical</label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500 cursor-pointer"
              >
                {AVAILABLE_GENRES.filter((g) => g !== 'Todos los géneros').map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Venue preset selection helper */}
          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-rose-400 flex items-center space-x-1.5">
                <Building2 className="w-3.5 h-3.5" />
                <span>Elegir Lugar Predeterminado (Auto-carga dirección y ticketera)</span>
              </label>
              {PRESET_VENUES.some((p) => p.name === venue) && (
                <span className="text-[11px] text-emerald-400 font-semibold flex items-center">
                  <Check className="w-3 h-3 mr-1" /> Lugar seleccionado
                </span>
              )}
            </div>

            {/* Quick buttons for venues sorted alphabetically (A-Z) */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: '🍻 Abbey Road', name: 'Abbey Road Concert Bar' },
                { label: '🏟️ Arena MDQ', name: 'Arena Mar del Plata' },
                { label: '🔥 Bendu Arena', name: 'BENDU ARENA' },
                { label: '⭐ Once Unidos', name: 'Once Unidos' },
                { label: '⚽ Estadio Minella', name: 'Estadio José María Minella' },
                { label: '🎸 Plaza de la Música', name: 'Plaza de la Música Mar del Plata' },
                { label: '🏀 Polideportivo', name: 'Polideportivo Islas Malvinas' },
                { label: '🏛️ Auditorium', name: 'Teatro Auditorium (Centro Provincial de las Artes)' },
                { label: '🎭 Teatro Colón', name: 'Teatro Colón Mar del Plata' },
                { label: '🎭 Radio City', name: 'Teatro Radio City + Roxy + Melany' },
                { label: '🎪 Teatro Tronador', name: 'Teatro Tronador' },
                { label: '🌲 Villa Victoria', name: 'Villa Victoria Ocampo' },
                { label: '🎙️ Vorterix', name: 'Vorterix Club Mar del Plata' }
              ].map((item) => {
                const isSelected = venue === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => handleSelectPresetVenue(item.name)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-950/50'
                        : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/80'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Alphabetical dropdown selector */}
            <div className="pt-1">
              <select
                aria-label="Seleccionar lugar de la lista alfabética"
                value={PRESET_VENUES.some((p) => p.name === venue) ? venue : ''}
                onChange={(e) => {
                  if (e.target.value) {
                    handleSelectPresetVenue(e.target.value);
                  }
                }}
                className="w-full bg-slate-900 border border-slate-700/90 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-rose-500 cursor-pointer"
              >
                <option value="">O seleccionar de la lista alfabética completa (A-Z)...</option>
                {PRESET_VENUES.map((p) => (
                  <option key={p.name} value={p.name} className="bg-slate-900 text-white">
                    {p.name} ({p.address})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Venue and Address editable fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Lugar / Estadio / Sala *
              </label>
              <input
                type="text"
                required
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="Ej: Arena Mar del Plata, Plaza de la Música, Polideportivo..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Dirección del lugar
              </label>
              <input
                type="text"
                value={venueAddress}
                onChange={(e) => setVenueAddress(e.target.value)}
                placeholder="Ej: Av. Luro y San Juan..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* INTERACTIVE CALENDAR: SELECCIÓN DE FECHAS */}
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-rose-400 flex items-center space-x-1.5">
                <CalendarIcon className="w-4 h-4" />
                <span>Fechas del Recital (Tildá los días en el calendario) *</span>
              </label>
              <span className="text-[11px] text-slate-400 font-medium">
                {selectedDates.length === 0 
                  ? 'Ninguna fecha elegida' 
                  : `${selectedDates.length} fecha${selectedDates.length > 1 ? 's' : ''} marcada${selectedDates.length > 1 ? 's' : ''}`}
              </span>
            </div>

            {/* Selected dates chips */}
            {selectedDates.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {selectedDates.map(dateStr => (
                  <span
                    key={dateStr}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-600/20 border border-rose-500/50 text-rose-200 text-xs font-semibold shadow-xs"
                  >
                    <span>{formatSingleDate(dateStr)}</span>
                    <button
                      type="button"
                      onClick={() => removeDate(dateStr)}
                      className="text-rose-400 hover:text-white p-0.5 rounded transition-colors cursor-pointer"
                      title="Quitar fecha"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Interactive Month Picker */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Mes anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-white capitalize">
                  {monthNameStr}
                </span>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Mes siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                <span>Lu</span>
                <span>Ma</span>
                <span>Mi</span>
                <span>Ju</span>
                <span>Vi</span>
                <span>Sá</span>
                <span>Do</span>
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty offset days */}
                {Array.from({ length: startOffset }).map((_, i) => (
                  <div key={`offset-${i}`} className="h-8" />
                ))}

                {/* Days of current month */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const monthFormatted = String(calMonth + 1).padStart(2, '0');
                  const dayFormatted = String(dayNum).padStart(2, '0');
                  const dateStr = `${calYear}-${monthFormatted}-${dayFormatted}`;
                  const isSelected = selectedDates.includes(dateStr);

                  return (
                    <button
                      key={dateStr}
                      type="button"
                      onClick={() => toggleDate(dateStr)}
                      className={`h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-rose-600 text-white font-bold shadow-md shadow-rose-950/60 ring-2 ring-rose-400'
                          : 'bg-slate-950/60 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800/80'
                      }`}
                      title={isSelected ? `Deseleccionar ${dateStr}` : `Seleccionar ${dateStr}`}
                    >
                      {dayNum}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick date selector alternative */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] text-slate-400 whitespace-nowrap">O elegí una fecha puntual:</span>
              <input
                type="date"
                value={quickDateInput}
                onChange={(e) => setQuickDateInput(e.target.value)}
                className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-rose-500 cursor-pointer"
              />
              <button
                type="button"
                onClick={handleAddQuickDate}
                disabled={!quickDateInput}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                + Tildar fecha
              </button>
            </div>
          </div>

          {/* Horario del recital */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Horario del recital</label>
            <input
              type="text"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              placeholder="21:00 hs"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* TICKETERA PRECARGADA / PORTAL OFICIAL */}
          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-rose-400 flex items-center space-x-1.5">
                <Ticket className="w-3.5 h-3.5" />
                <span>Ticketera Oficial</span>
              </label>
              <span className="text-[11px] text-slate-400">
                Se selecciona sola si pegás el link
              </span>
            </div>

            {/* Known Portals Chips */}
            <div className="flex flex-wrap gap-1.5">
              {PRESET_TICKET_PORTALS.map((portal) => {
                const isSelected = !isCustomPortal && ticketPortalName.toLowerCase() === portal.name.toLowerCase();
                return (
                  <button
                    key={portal.name}
                    type="button"
                    onClick={() => handleSelectPortal(portal)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-950/50'
                        : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/80'
                    }`}
                  >
                    {portal.name}
                  </button>
                );
              })}

              {/* Custom Portal Option */}
              <button
                type="button"
                onClick={() => {
                  setIsCustomPortal(true);
                  if (PRESET_TICKET_PORTALS.some(p => p.name.toLowerCase() === ticketPortalName.toLowerCase())) {
                    setTicketPortalName('');
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  isCustomPortal
                    ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-950/50'
                    : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/80'
                }`}
              >
                + Otra ticketera...
              </button>
            </div>

            {/* Input if custom portal selected */}
            {isCustomPortal && (
              <div className="pt-2 animate-in fade-in">
                <label className="block text-slate-300 text-xs font-semibold mb-1">
                  Escribí el nombre de la ticketera personalizada:
                </label>
                <input
                  type="text"
                  required={isCustomPortal}
                  value={ticketPortalName}
                  onChange={(e) => setTicketPortalName(e.target.value)}
                  placeholder="Ej: Boletería del teatro, Eventbrite, etc."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>
            )}
          </div>

          {/* Ticket Link & Price (Entradas desde) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                <span>Link directo de compra (URL)</span>
                <Globe className="w-3.5 h-3.5 text-slate-400" />
              </label>
              <input
                type="url"
                value={ticketUrl}
                onChange={(e) => handleTicketUrlChange(e.target.value)}
                onPaste={(e) => {
                  const pastedText = e.clipboardData.getData('text');
                  if (pastedText) {
                    handleTicketUrlChange(pastedText.trim());
                  }
                }}
                placeholder="Pegá el link (ej: https://www.allaccess.com.ar/...)"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
              />
              {ticketUrl && (
                <div className="mt-1 flex items-center gap-1.5 text-[11px]">
                  {detectTicketPortalFromUrl(ticketUrl) ? (
                    <span className="text-emerald-400 font-medium inline-flex items-center gap-1 animate-in fade-in">
                      <Sparkles className="w-3 h-3 text-emerald-400" />
                      Detectado automáticamente: <strong>{detectTicketPortalFromUrl(ticketUrl)}</strong>
                    </span>
                  ) : (
                    <span className="text-slate-400">
                      Podés pegar cualquier link de ticketera y la reconoceremos al instante.
                    </span>
                  )}
                </div>
              )}
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                <span>Entradas desde ($)</span>
                <DollarSign className="w-3.5 h-3.5 text-amber-400" />
              </label>
              <input
                type="text"
                value={ticketPriceRange}
                onChange={(e) => setTicketPriceRange(e.target.value)}
                onBlur={() => {
                  if (ticketPriceRange) {
                    setTicketPriceRange(normalizePriceInput(ticketPriceRange));
                  }
                }}
                placeholder="Ej: 80000 o $ 80.000 (o Gratuito)"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
              {ticketPriceRange && (
                <p className="text-[11px] text-amber-300/90 mt-1 font-medium">
                  Se mostrará: {normalizePriceInput(ticketPriceRange) ? `Entradas desde ${normalizePriceInput(ticketPriceRange)}` : 'Entradas a confirmar'}
                </p>
              )}
            </div>
          </div>

          {/* Perfil de Spotify de la banda / artista */}
          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2">
            <label className="block text-slate-300 font-semibold text-xs flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-green-400 font-bold">
                <SpotifyIcon className="w-4 h-4 text-[#1DB954]" />
                Link de Spotify del artista o banda (opcional)
              </span>
              <span className="text-[11px] text-slate-400 font-normal">Para escuchar su música</span>
            </label>
            <input
              type="url"
              value={spotifyUrl}
              onChange={(e) => setSpotifyUrl(e.target.value)}
              placeholder="https://open.spotify.com/artist/... o https://open.spotify.com/album/..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-green-500 transition-colors text-xs"
            />
            <p className="text-[11px] text-slate-400">
              Si lo completás, aparecerá el botón de <strong className="text-green-400">Spotify</strong> entre WhatsApp y Agendar para que el público reproduzca las canciones del artista con 1 clic.
            </p>
          </div>

          {/* Band image & Featured */}
          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-rose-400 flex items-center space-x-1.5">
                <ImageIcon className="w-4 h-4" />
                <span>Foto de la banda o afiche del recital</span>
              </label>
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-semibold bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-md">
                <span>WebP, JPG, PNG soportados</span>
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1">
                  Opción 1: Pegar link / URL de la imagen (.webp, .jpg, .png, etc.)
                </label>
                <input
                  type="url"
                  value={image.startsWith('data:') ? '' : image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://ejemplo.com/foto-banda.webp (o .jpg)"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 text-xs"
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="h-px bg-slate-800 flex-1" />
                <span className="text-[10px] font-bold text-slate-400 uppercase">O también podés</span>
                <div className="h-px bg-slate-800 flex-1" />
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1">
                  Opción 2: Subir archivo directamente desde tu PC o celular
                </label>
                <label className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed border-slate-700 hover:border-rose-500/60 bg-slate-900/80 hover:bg-slate-900 text-slate-300 hover:text-white cursor-pointer transition-colors text-xs font-semibold">
                  <Upload className="w-4 h-4 text-rose-400" />
                  <span>Seleccionar imagen (WebP, JPG o PNG)</span>
                  <input
                    type="file"
                    accept="image/webp,image/jpeg,image/jpg,image/png,image/avif"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Live Preview & Alignment Control if image is present */}
              {image && (
                <div className="mt-2 p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-700 shrink-0 bg-slate-950">
                      <img
                        src={image}
                        alt="Vista previa"
                        className={`w-full h-full object-cover ${
                          imagePosition === 'bottom'
                            ? 'object-bottom'
                            : imagePosition === 'center'
                            ? 'object-center'
                            : 'object-top'
                        }`}
                        onError={() => setError('No se pudo cargar la imagen desde ese enlace o archivo.')}
                      />
                    </div>
                    <div className="flex-1 min-w-0 text-xs">
                      <p className="font-semibold text-white truncate">Vista previa del afiche/foto</p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {image.startsWith('data:image/webp') || image.toLowerCase().includes('.webp')
                          ? '🟢 Formato WebP (óptimo y liviano)'
                          : image.startsWith('data:image/jpeg') || image.toLowerCase().includes('.jpg') || image.toLowerCase().includes('.jpeg')
                          ? '🟢 Formato JPG / JPEG'
                          : image.startsWith('data:image/png') || image.toLowerCase().includes('.png')
                          ? '🟢 Formato PNG'
                          : '🟢 Imagen cargada'}
                      </p>
                      <p className="text-[10px] text-amber-400 mt-0.5">
                        Alineada: {imagePosition === 'top' ? 'Desde arriba (ideal afiches)' : imagePosition === 'center' ? 'Al centro' : 'Desde abajo'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setImage('')}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Quitar imagen"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Selector de encuadre / alineación de imagen */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-300 font-medium">
                      Encuadre en tarjeta:
                    </span>
                    <div className="inline-flex rounded-lg bg-slate-950 p-0.5 border border-slate-800">
                      <button
                        type="button"
                        onClick={() => setImagePosition('top')}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                          imagePosition === 'top'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                        title="Toma la imagen desde arriba hacia abajo (recomendado para afiches y flyers oficiales)"
                      >
                        Arriba (Recomendado)
                      </button>
                      <button
                        type="button"
                        onClick={() => setImagePosition('center')}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                          imagePosition === 'center'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Centro
                      </button>
                      <button
                        type="button"
                        onClick={() => setImagePosition('bottom')}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                          imagePosition === 'bottom'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Abajo
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2 pt-1">
              <label className="flex items-center space-x-2.5 p-3 rounded-xl bg-slate-950/70 border border-slate-800 cursor-pointer hover:bg-slate-950">
                <input
                  type="checkbox"
                  checked={isNewBadge}
                  onChange={(e) => setIsNewBadge(e.target.checked)}
                  className="w-4 h-4 text-amber-500 rounded bg-slate-900 border-slate-700 focus:ring-amber-500 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">
                    Mostrar en NOVEDADES (Banner superior del sitio)
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    Aparece entre los shows que rotan en el Head principal de novedades.
                  </span>
                </div>
              </label>

              <label className="flex items-center space-x-2.5 p-3 rounded-xl bg-slate-950/70 border border-slate-800 cursor-pointer hover:bg-slate-950">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="w-4 h-4 text-rose-600 rounded bg-slate-900 border-slate-700 focus:ring-rose-500 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">
                    Show Destacado Estrella (Popup de bienvenida inicial)
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    Se abre automáticamente en el popup promocional para los visitantes.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Delete confirmation section */}
          {isEditing && onDeleteShow && (
            <div className="pt-2 border-t border-slate-800/80">
              {showConfirmDelete ? (
                <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-xl flex items-center justify-between">
                  <div className="text-xs text-red-300">
                    <p className="font-bold">¿Seguro que querés eliminar este show?</p>
                    <p className="text-[11px] text-red-400">Esta acción no se puede deshacer.</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowConfirmDelete(false)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-700 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-bold text-white shadow-md cursor-pointer"
                    >
                      Sí, eliminar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(true)}
                  className="flex items-center text-xs text-red-400 hover:text-red-300 hover:underline pt-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  Eliminar este recital de la cartelera
                </button>
              )}
            </div>
          )}

          {/* Submit Buttons */}
          <div className="pt-3 flex justify-end space-x-3 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-lg shadow-rose-900/30 transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{isEditing ? 'Guardar Cambios' : 'Guardar y Publicar Show'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
