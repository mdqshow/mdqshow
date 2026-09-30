import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, Calendar, Filter, RotateCcw, Sparkles, MapPin, Music } from 'lucide-react';
import { FilterState, Show } from '../types';
import { formatProperCase } from '../utils/textFormatting';

interface ShowFiltersProps {
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  onResetFilters: () => void;
  availableVenues?: string[];
  totalMatches: number;
  totalShows: number;
  shows?: Show[];
}

export const ShowFilters: React.FC<ShowFiltersProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  totalMatches,
  totalShows,
  shows = [],
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const monthOptions = [
    { id: 'all', label: 'Todos los meses' },
    { id: '2026-10', label: 'Octubre 2026' },
    { id: '2026-11', label: 'Noviembre 2026' },
    { id: '2026-12', label: 'Diciembre 2026' },
    { id: '2027', label: 'Verano 2027' },
  ];

  const hasActiveFilters =
    Boolean(filters.searchQuery.trim()) ||
    filters.month !== 'all' ||
    filters.venue !== 'all';

  // Autocomplete suggestions based on user typing
  const query = filters.searchQuery.trim().toLowerCase();

  const suggestions = useMemo(() => {
    if (!query || query.length < 2) return [];

    const items: Array<{
      type: 'band' | 'tour' | 'venue';
      text: string;
      subtext?: string;
      image?: string;
      showId?: string;
    }> = [];

    const seenBands = new Set<string>();

    shows.forEach((show) => {
      // 1. Matches band name (e.g. "DIE" -> "Diego Torres")
      if (show.band.toLowerCase().includes(query)) {
        if (!seenBands.has(show.band.toLowerCase())) {
          seenBands.add(show.band.toLowerCase());
          items.push({
            type: 'band',
            text: show.band,
            subtext: show.tourName || show.venue,
            image: show.image,
            showId: show.id,
          });
        }
      }
      // 2. Matches tour or festival name
      else if (show.tourName && show.tourName.toLowerCase().includes(query)) {
        items.push({
          type: 'tour',
          text: show.tourName,
          subtext: show.band,
          image: show.image,
          showId: show.id,
        });
      }
      // 3. Matches venue name
      else if (show.venue.toLowerCase().includes(query)) {
        if (!items.some((i) => i.type === 'venue' && i.text === show.venue)) {
          items.push({
            type: 'venue',
            text: show.venue,
            subtext: 'Lugar en Mar del Plata',
            showId: show.id,
          });
        }
      }
    });

    return items.slice(0, 6); // Max 6 suggestions
  }, [query, shows]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const scrollToElementTop = (el: HTMLElement) => {
    // Calculamos la posición absoluta exacta con respecto al documento
    const navbarHeight = 88; // Altura del navbar sticky + margen de respiro
    const elementRect = el.getBoundingClientRect();
    const absoluteElementTop = elementRect.top + window.pageYOffset;
    const targetScrollPosition = Math.max(0, absoluteElementTop - navbarHeight);

    window.scrollTo({
      top: targetScrollPosition,
      behavior: 'smooth'
    });

    // Efecto visual de resaltado
    el.classList.add('highlight-rotate-glow');
    setTimeout(() => {
      el.classList.remove('highlight-rotate-glow');
    }, 3200);
  };

  const handleSelectSuggestion = (item: { text: string; showId?: string; type: string }) => {
    // Si el usuario elige una sugerencia, limpiamos la búsqueda para no ocultar la cartelera
    // pero dejamos el input o texto claro, y nos desplazamos directo a ese recital manteniendo todo el catálogo visible
    onFilterChange({ searchQuery: '', month: 'all', venue: 'all' });
    setIsDropdownOpen(false);
    inputRef.current?.blur();

    // Auto-scroll to recital card smoothly keeping all other shows visible
    setTimeout(() => {
      let targetEl: HTMLElement | null = null;
      if (item.showId) {
        targetEl =
          document.getElementById(`show-card-${item.showId}`) ||
          document.getElementById(`timeline-show-${item.showId}`);
      }
      if (!targetEl) {
        targetEl = document.getElementById('shows-section');
      }

      if (targetEl) {
        scrollToElementTop(targetEl);
      }
    }, 120);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setIsDropdownOpen(false);
      inputRef.current?.blur();

      // Si hay sugerencias y la primera coincide o es un show directo
      if (suggestions.length > 0) {
        handleSelectSuggestion(suggestions[0]);
      } else {
        // Si no hay sugerencias flotantes, desplazarse a la sección de shows o primer resultado filtrado
        setTimeout(() => {
          const firstCard = document.querySelector('[id^="show-card-"], [id^="timeline-show-"]') as HTMLElement | null;
          const targetEl = firstCard || document.getElementById('shows-section');
          if (targetEl) {
            scrollToElementTop(targetEl);
          }
        }, 120);
      }
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
      {/* Search Bar with Autocomplete Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          ref={inputRef}
          id="search-shows-input"
          type="text"
          value={filters.searchQuery}
          onFocus={() => {
            if (suggestions.length > 0) setIsDropdownOpen(true);
          }}
          onChange={(e) => {
            onFilterChange({ searchQuery: e.target.value });
            setIsDropdownOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Buscar por banda (ej: Diego Torres, Babasónicos, Divididos)..."
          className="w-full pl-12 pr-10 py-3 bg-slate-950/80 border border-slate-700/80 focus:border-rose-500 rounded-xl text-white placeholder-slate-400 text-base focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-all shadow-inner"
        />
        {filters.searchQuery && (
          <button
            id="clear-search-btn"
            onClick={() => {
              onFilterChange({ searchQuery: '' });
              setIsDropdownOpen(false);
            }}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            title="Limpiar búsqueda"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Floating Autocomplete Suggestions Dropdown */}
        {isDropdownOpen && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-slate-950/95 backdrop-blur-md border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="px-3.5 py-2 border-b border-slate-800/80 flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-rose-400" />
                Sugerencias
              </span>
              <span className="text-[10px] text-slate-500 normal-case">Hacé clic para ir al show</span>
            </div>

            <div className="py-1 divide-y divide-slate-800/40">
              {suggestions.map((item, index) => (
                <button
                  key={`${item.type}-${item.text}-${index}`}
                  type="button"
                  onClick={() => handleSelectSuggestion(item)}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-rose-500/10 hover:border-l-4 hover:border-rose-500 flex items-center justify-between transition-colors cursor-pointer group"
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt=""
                        className="w-8 h-8 rounded-lg object-cover border border-slate-700 shrink-0"
                      />
                    ) : item.type === 'venue' ? (
                      <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-rose-400">
                        <MapPin className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-amber-400">
                        <Music className="w-4 h-4" />
                      </div>
                    )}
                    <div className="truncate">
                      <p className="text-sm font-bold text-white group-hover:text-rose-400 transition-colors truncate">
                        {item.text}
                      </p>
                      {item.subtext && (
                        <p className="text-[11px] text-slate-400 truncate">
                          {item.subtext}
                        </p>
                      )}
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-500 font-semibold px-2 py-0.5 rounded bg-slate-900 border border-slate-800 shrink-0 ml-2">
                    {item.type === 'band' ? 'Artista' : item.type === 'tour' ? 'Gira' : 'Lugar'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Month Navigation Pills - Alineación centrada */}
      <div className="flex items-center justify-center flex-wrap gap-2 pb-1 text-xs sm:text-sm">
        <div className="flex items-center text-slate-400 font-medium shrink-0 mr-1">
          <Calendar className="w-3.5 h-3.5 mr-1 text-rose-400" />
          <span>Mes:</span>
        </div>
        {monthOptions.map((m) => {
          const isActive = filters.month === m.id;
          return (
            <button
              key={m.id}
              id={`filter-month-${m.id}`}
              onClick={() => onFilterChange({ month: m.id })}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-rose-500 text-white shadow-sm shadow-rose-900/30'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60'
              }`}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Results stats & clear filters */}
      <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-800/80 text-xs text-slate-400 gap-2">
        <div className="flex items-center flex-wrap gap-2">
          <div className="flex items-center space-x-1.5">
            <Filter className="w-3.5 h-3.5 text-rose-400" />
            <span>
              Mostrando <strong className="text-white font-semibold">{totalMatches}</strong> de {totalShows} recitales
            </span>
          </div>

          {filters.venue !== 'all' && (
            <span className="inline-flex items-center gap-1 bg-rose-500/10 text-rose-300 px-2.5 py-0.5 rounded-full border border-rose-500/20 text-[11px]">
              <span>Lugar: {formatProperCase(filters.venue)}</span>
              <button 
                type="button" 
                onClick={() => onFilterChange({ venue: 'all' })}
                className="hover:text-white cursor-pointer ml-1 font-bold"
                title="Quitar filtro de lugar"
              >
                ×
              </button>
            </span>
          )}

          {filters.city !== 'Todas las ciudades' && (
            <span className="bg-rose-500/10 text-rose-300 px-2 py-0.5 rounded-full border border-rose-500/20 text-[11px]">
              En {filters.city}
            </span>
          )}
        </div>

        {hasActiveFilters && (
          <button
            id="reset-filters-btn"
            onClick={onResetFilters}
            className="flex items-center text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors py-1 px-2.5 rounded-lg hover:bg-rose-500/10 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Restablecer filtros
          </button>
        )}
      </div>
    </div>
  );
};

