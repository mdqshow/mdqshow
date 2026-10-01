import React, { useState, useEffect, useMemo } from 'react';
import { Show, FilterState } from './types';
import { INITIAL_SHOWS, AVAILABLE_CITIES } from './data/mockShows';
import { 
  subscribeToShows, 
  saveShowToCloud, 
  deleteShowFromCloud, 
  getLocalFallbackShows,
  markShowAsDeletedLocally,
  unmarkShowAsDeletedLocally
} from './services/showsService';
import { Navbar } from './components/Navbar';
import { ShowFilters } from './components/ShowFilters';
import { ShowCard } from './components/ShowCard';
import { ShowModal } from './components/ShowModal';
import { TimelineAgendaView } from './components/TimelineAgendaView';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdPopup } from './components/AdPopup';
import { ContactModal } from './components/ContactModal';
import { NewsletterModal } from './components/NewsletterModal';
import { InstallAppModal } from './components/InstallAppModal';
import { AdminMetricsModal } from './components/AdminMetricsModal';
import { AdSenseBanner } from './components/AdSenseBanner';
import { HeroShowcase } from './components/HeroShowcase';
import { AirportBoardHeader } from './components/AirportBoardHeader';
import { 
  subscribeToMetrics, 
  subscribeToBannerMetrics,
  ShowMetrics, 
  BannerMetrics,
  trackFavoriteEvent 
} from './services/metricsService';
import { 
  subscribeToSubscribers, 
  Subscriber 
} from './services/subscribersService';
import { ComingSoon } from './components/ComingSoon';
import { 
  Flame, 
  Calendar, 
  MapPin, 
  Ticket, 
  Music, 
  Radio, 
  Search, 
  Heart, 
  Sparkles,
  ExternalLink,
  Trash2,
  X,
  Mail,
  Bell,
  Smartphone,
  ChevronUp,
  ShieldCheck,
  Scale,
  Info
} from 'lucide-react';

const LOCAL_STORAGE_SHOWS_LIST = 'mdqshow_all_shows_v4';
const LOCAL_STORAGE_FAVORITES = 'mdqshow_favorites_v2';
const LOCAL_STORAGE_ADMIN = 'mdqshow_is_admin_v1';

export default function App() {
  const currentCity = 'Mar del Plata';

  // Admin authentication state
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem(LOCAL_STORAGE_ADMIN) === 'true';
  });
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);

  // Soporte para ingresar o abrir login por URL directa (ej: tudominio.com/?admin o #admin)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === '1' || params.has('admin') || window.location.hash === '#admin') {
      if (!isAdmin) {
        setIsAdminLoginOpen(true);
      }
    }
  }, [isAdmin]);

  const handleLoginSuccess = () => {
    setIsAdmin(true);
    localStorage.setItem(LOCAL_STORAGE_ADMIN, 'true');
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    setIsPreviewUnlocked(false);
    localStorage.removeItem(LOCAL_STORAGE_ADMIN);
    localStorage.removeItem('mdqshow_preview_access');
    sessionStorage.removeItem('mdqshow_preview_access');
    window.location.hash = '';
  };

  // Modo Próximamente / Vista previa privada
  // El público general ve la pantalla "Próximamente".
  // Para entrar a la web completa se requiere:
  // 1. Ingresar con la clave en pantalla (MDQ2026mdq)
  // 2. O entrar mediante enlace directo de test sin clave para clientes y conocidos:
  //    - mdqshow.com.ar/test (o /demo, /preview)
  //    - mdqshow.com.ar/?test (o ?preview=true)
  //    - mdqshow.com.ar/#test
  const [isPreviewUnlocked, setIsPreviewUnlocked] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;

    // Chequeo de link de test directo en path, search o hash
    const path = window.location.pathname.toLowerCase().replace(/\/$/, '');
    const search = window.location.search.toLowerCase();
    const hash = window.location.hash.toLowerCase();

    const isTestUrl = 
      path.endsWith('/test') || 
      path.endsWith('/demo') || 
      path.endsWith('/preview') || 
      path.endsWith('/cliente') || 
      search.includes('test') || 
      search.includes('demo') || 
      search.includes('preview') || 
      hash === '#test' || 
      hash === '#demo' || 
      hash === '#preview';

    if (isTestUrl) {
      sessionStorage.setItem('mdqshow_preview_access', 'true');
      return true;
    }

    // Si ya se desbloqueó en esta sesión previamente
    return sessionStorage.getItem('mdqshow_preview_access') === 'true';
  });

  // Escuchar si el usuario navega a /test o agrega #test en cualquier momento
  useEffect(() => {
    const checkTestUrl = () => {
      const path = window.location.pathname.toLowerCase().replace(/\/$/, '');
      const search = window.location.search.toLowerCase();
      const hash = window.location.hash.toLowerCase();

      if (
        path.endsWith('/test') || 
        path.endsWith('/demo') || 
        path.endsWith('/preview') || 
        search.includes('test') || 
        hash === '#test' || 
        hash === '#demo'
      ) {
        sessionStorage.setItem('mdqshow_preview_access', 'true');
        setIsPreviewUnlocked(true);
      }
    };

    checkTestUrl();
    window.addEventListener('popstate', checkTestUrl);
    window.addEventListener('hashchange', checkTestUrl);
    return () => {
      window.removeEventListener('popstate', checkTestUrl);
      window.removeEventListener('hashchange', checkTestUrl);
    };
  }, []);

  // Shows list initialized from local fallback, then synced with Firestore in real time
  const [shows, setShows] = useState<Show[]>(() => getLocalFallbackShows());

  // Subscribe to real-time updates from Firebase Firestore
  useEffect(() => {
    const unsubscribe = subscribeToShows((cloudShows) => {
      if (cloudShows && cloudShows.length > 0) {
        setShows(cloudShows);
      }
    });
    return () => unsubscribe();
  }, []);

  // Métricas en tiempo real de Firebase
  const [metricsMap, setMetricsMap] = useState<Record<string, ShowMetrics>>({});
  const [bannerMetricsMap, setBannerMetricsMap] = useState<Record<string, BannerMetrics>>({});
  const [isAdminMetricsOpen, setIsAdminMetricsOpen] = useState(false);

  useEffect(() => {
    const unsubMetrics = subscribeToMetrics((map) => {
      setMetricsMap(map);
    });
    const unsubBannerMetrics = subscribeToBannerMetrics((bMap) => {
      setBannerMetricsMap(bMap);
    });
    return () => {
      unsubMetrics();
      unsubBannerMetrics();
    };
  }, []);

  // Suscriptores para KPIs del Admin
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  useEffect(() => {
    const unsubSubs = subscribeToSubscribers((subs) => {
      setSubscribers(subs);
    });
    return () => unsubSubs();
  }, []);

  // Favorites state
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_FAVORITES);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedShow, setSelectedShow] = useState<Show | null>(null);
  
  // Show modal state (for both Adding and Editing)
  const [isShowModalOpen, setIsShowModalOpen] = useState(false);
  const [editingShow, setEditingShow] = useState<Show | null>(null);

  // Contact, Newsletter, and App Install popup modal states
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isNewsletterModalOpen, setIsNewsletterModalOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');

  // Botón flotante para subir arriba de todo cuando el usuario scrollea
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Mostrar la flecha cuando baje más de 400px
      if (window.scrollY > 400) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Cambiar vista (Cartelera / Cronograma) y scrollear suavemente a la altura de los recitales
  const handleToggleViewMode = (mode: 'grid' | 'timeline') => {
    setViewMode(mode);
    // Realizar scroll suave hacia la sección de shows
    setTimeout(() => {
      const section = document.getElementById('shows-section');
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  // Filters state
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    city: 'Mar del Plata',
    month: 'all',
    genre: 'all',
    venue: 'all',
    ticketStatus: 'all',
    sortBy: 'date_asc',
  });

  // Persist favorites
  const toggleFavorite = (showId: string) => {
    const isAdding = !favorites.includes(showId);
    const targetShow = shows.find((s) => s.id === showId);
    trackFavoriteEvent(showId, targetShow?.band, isAdding ? 1 : -1);

    setFavorites((prev) => {
      const updated = prev.includes(showId)
        ? prev.filter((id) => id !== showId)
        : [...prev, showId];
      localStorage.setItem(LOCAL_STORAGE_FAVORITES, JSON.stringify(updated));
      return updated;
    });
  };

  // Helper to persist shows list
  const persistShows = (newShowsList: Show[]) => {
    setShows(newShowsList);
    localStorage.setItem(LOCAL_STORAGE_SHOWS_LIST, JSON.stringify(newShowsList));
  };

  // Save show (handles both ADD new and EDIT existing with cloud persistence)
  const handleSaveShow = async (showData: Show) => {
    // Si estaba previamente marcado como eliminado, rehabilitarlo
    unmarkShowAsDeletedLocally(showData.id);

    // Immediate optimistic local update
    setShows((prev) => {
      const exists = prev.some((s) => s.id === showData.id);
      let updated: Show[];
      if (exists) {
        updated = prev.map((s) => (s.id === showData.id ? showData : s));
      } else {
        updated = [showData, ...prev];
      }
      localStorage.setItem(LOCAL_STORAGE_SHOWS_LIST, JSON.stringify(updated));
      return updated;
    });

    if (selectedShow && selectedShow.id === showData.id) {
      setSelectedShow(showData);
    }

    // Save to Firebase Firestore
    try {
      await saveShowToCloud(showData);
    } catch (err) {
      console.error('Error al guardar show en Firestore:', err);
    }
  };

  // Toast state for deletion feedback
  const [deleteToast, setDeleteToast] = useState<string | null>(null);

  // Delete show handler
  const handleDeleteShow = async (showId: string) => {
    const showToDelete = shows.find((s) => s.id === showId);
    const bandName = showToDelete ? showToDelete.band : 'El recital';

    // Marcar como eliminado localmente para que no se resucite
    markShowAsDeletedLocally(showId);

    // Immediate optimistic local update
    setShows((prev) => {
      const updated = prev.filter((s) => s.id !== showId);
      localStorage.setItem(LOCAL_STORAGE_SHOWS_LIST, JSON.stringify(updated));
      return updated;
    });

    if (selectedShow && selectedShow.id === showId) {
      setSelectedShow(null);
    }

    setDeleteToast(`"${bandName}" fue eliminado correctamente.`);
    setTimeout(() => {
      setDeleteToast(null);
    }, 3500);

    // Delete from Firebase Firestore
    try {
      await deleteShowFromCloud(showId);
    } catch (err) {
      console.error('Error al eliminar show en Firestore:', err);
    }
  };

  // Open modal to add new show
  const handleOpenAddShow = () => {
    setEditingShow(null);
    setIsShowModalOpen(true);
  };

  // Open modal to edit existing show
  const handleOpenEditShow = (show: Show) => {
    setEditingShow(show);
    setIsShowModalOpen(true);
  };

  // Export backup handler
  const handleExportBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(shows, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `mdqshow_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Descarga del listado rápido de shows en formato TXT (para verificación rápida)
  const handleDownloadTxt = () => {
    // Ordenar shows cronológicamente por primera fecha
    const sorted = [...shows].sort((a, b) => {
      const dateA = a.dates && a.dates[0] ? a.dates[0] : '9999-99-99';
      const dateB = b.dates && b.dates[0] ? b.dates[0] : '9999-99-99';
      return dateA.localeCompare(dateB);
    });

    const lines: string[] = [];
    lines.push('====================================================');
    lines.push('MDQSHOW - LISTADO COMPLETO DE SHOWS Y RECITALES');
    lines.push(`Mar del Plata | Generado el: ${new Date().toLocaleDateString('es-AR')} ${new Date().toLocaleTimeString('es-AR')}`);
    lines.push(`Total de shows cargados: ${sorted.length}`);
    lines.push('====================================================\n');

    sorted.forEach((show, index) => {
      const datesFormatted = show.dates && show.dates.length > 0 ? show.dates.join(', ') : 'A confirmar';
      const timeFormatted = show.time ? ` (${show.time})` : '';

      lines.push(`${index + 1}. BANDA / ARTISTA: ${show.band}`);
      if (show.tourName) {
        lines.push(`   Gira / Show: ${show.tourName}`);
      }
      lines.push(`   Lugar: ${show.venue}`);
      lines.push(`   Fecha(s): ${datesFormatted}${timeFormatted}`);
      lines.push(`   Link Tickets: ${show.ticketUrl || 'No especificado'} (${show.ticketPortalName || 'Boletería'})`);
      lines.push(`   Estado entradas: ${show.ticketStatus || 'disponibles'}`);
      lines.push('----------------------------------------------------');
    });

    const textContent = lines.join('\n');
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mdqshow_listado_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilters({
      searchQuery: '',
      city: 'Mar del Plata',
      month: 'all',
      genre: 'all',
      venue: 'all',
      ticketStatus: 'all',
      sortBy: 'date_asc',
    });
    setShowFavoritesOnly(false);
  };

  // Extract all unique venues in Mar del Plata sorted alphabetically (A-Z)
  const availableVenues = useMemo(() => {
    const venuesSet = new Set<string>();
    shows.forEach((show) => {
      if (show.venue && show.venue.trim()) {
        venuesSet.add(show.venue.trim());
      }
    });
    return Array.from(venuesSet).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
  }, [shows]);

  // Filtered & Sorted shows
  const filteredShows = useMemo(() => {
    return shows
      .filter((show) => {
        // Favorites only filter
        if (showFavoritesOnly && !favorites.includes(show.id)) {
          return false;
        }

        // Search text query
        if (filters.searchQuery.trim()) {
          const q = filters.searchQuery.toLowerCase();
          const matchBand = show.band.toLowerCase().includes(q);
          const matchTour = show.tourName.toLowerCase().includes(q);
          const matchVenue = show.venue.toLowerCase().includes(q);
          const matchCity = show.city.toLowerCase().includes(q);
          const matchGenre = show.genre.toLowerCase().includes(q);
          const matchPortal = show.ticketPortalName.toLowerCase().includes(q);
          if (!matchBand && !matchTour && !matchVenue && !matchCity && !matchGenre && !matchPortal) {
            return false;
          }
        }

        // Month filter
        if (filters.month !== 'all') {
          const hasDateInMonth = show.dates.some((d) => d.startsWith(filters.month));
          if (!hasDateInMonth) return false;
        }

        // Venue filter
        if (filters.venue !== 'all' && show.venue !== filters.venue) {
          return false;
        }

        // Genre filter
        if (filters.genre !== 'all' && show.genre !== filters.genre) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const dateA = a.dates[0] || '9999-99-99';
        const dateB = b.dates[0] || '9999-99-99';
        return dateA.localeCompare(dateB);
      });
  }, [shows, filters, showFavoritesOnly, favorites]);

  // Featured shows for carousel/banner
  const featuredShows = useMemo(() => {
    return shows.filter((s) => s.featured);
  }, [shows]);

  // Si no está desbloqueado el preview privado, mostramos la pantalla elegante de Próximamente
  if (!isPreviewUnlocked) {
    return (
      <ComingSoon 
        onUnlockAdmin={() => {
          setIsPreviewUnlocked(true);
          setIsAdmin(true);
        }} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0e1117] text-slate-100 flex flex-col selection:bg-rose-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentCity={currentCity}
        onSelectCity={(_city) => {}}
        favoritesCount={favorites.length}
        showFavoritesOnly={showFavoritesOnly}
        onToggleFavoritesOnly={() => setShowFavoritesOnly((prev) => !prev)}
        onOpenAddShow={handleOpenAddShow}
        viewMode={viewMode}
        onToggleViewMode={handleToggleViewMode}
        isAdmin={isAdmin}
        onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
        onAdminLogout={handleAdminLogout}
        onOpenContact={() => setIsContactModalOpen(true)}
        onOpenNewsletter={() => setIsNewsletterModalOpen(true)}
        onOpenInstallApp={() => setIsInstallModalOpen(true)}
        onExportBackup={handleExportBackup}
        onDownloadTxt={handleDownloadTxt}
        onOpenMetrics={() => setIsAdminMetricsOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {/* City Highlight Banner */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-rose-950/40 to-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch relative z-10">
            {/* Left Column: Text & Venues */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                  <span className="block">Recitales y shows</span>
                  <span className="block mt-1">
                    en{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-rose-500 to-amber-300">
                      Mar del Plata
                    </span>
                  </span>
                </h1>

                <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed mt-3">
                  La agenda más completa con todas las fechas confirmadas en teatros, estadios, clubes y paradores de la ciudad. Comprá tus entradas en boleterías oficiales y plataformas autorizadas.
                </p>
              </div>

              {/* Venues quick chips sorted alphabetically (A-Z) */}
              {/* En Celular (sm e inferiores): Carrusel horizontal scrolleable elegante con touch natural, sin cortar renglones */}
              {/* En Desktop/Tablet (sm en adelante): Los dos renglones exactos que configuramos, con el 2do renglón centrado respecto al 1ro */}
              <div className="pt-2 text-xs">
                {/* --- VERSIÓN CELULAR (< sm): Scroll horizontal limpio y fluido con snap --- */}
                <div className="block sm:hidden">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
                      Lugares en La Feliz:
                    </span>
                    {filters.venue !== 'all' && (
                      <button
                        onClick={() => handleFilterChange({ venue: 'all' })}
                        className="text-xs text-rose-400 font-semibold hover:underline ml-auto cursor-pointer"
                      >
                        (Ver todos)
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 -mx-4 px-4 scroll-smooth">
                    {[
                      'Abbey Road',
                      'Arena Mar del Plata',
                      'Auditorium',
                      'Bendu Arena',
                      'Bruto',
                      'Mute',
                      'Plaza de la Música',
                      'Polideportivo',
                      'Radio City',
                      'Teatro Tronador',
                      'Vorterix'
                    ].map((venueShort) => {
                      const isActive = filters.venue !== 'all' && filters.venue.toLowerCase().includes(venueShort.toLowerCase());
                      return (
                        <button
                          key={`mobile-${venueShort}`}
                          onClick={() => {
                            if (isActive) {
                              handleFilterChange({ venue: 'all' });
                            } else {
                              const fullVenue = availableVenues.find(v => v.toLowerCase().includes(venueShort.toLowerCase())) || venueShort;
                              handleFilterChange({ venue: fullVenue });
                              setTimeout(() => {
                                const showsEl = document.getElementById('shows-section');
                                if (showsEl) {
                                  showsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }
                              }, 100);
                            }
                          }}
                          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                            isActive
                              ? 'bg-rose-500 text-white shadow-xs'
                              : 'bg-slate-800/90 text-slate-300 border border-slate-700/60 active:scale-95'
                          }`}
                        >
                          {venueShort}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* --- VERSIÓN DESKTOP/TABLET (>= sm): Mantener exactamente el diseño de 2 renglones centrado --- */}
                <div className="hidden sm:inline-flex flex-col items-center gap-2 max-w-full">
                  {/* Renglón 1: Frase y primeros lugares a la izquierda */}
                  <div className="flex flex-wrap items-center justify-start gap-2 w-full">
                    <span className="text-slate-400 font-medium shrink-0">Lugares en La Feliz:</span>
                    {[
                      'Abbey Road',
                      'Arena Mar del Plata',
                      'Auditorium',
                      'Bendu Arena',
                      'Bruto',
                    ].map((venueShort) => {
                      const isActive = filters.venue !== 'all' && filters.venue.toLowerCase().includes(venueShort.toLowerCase());
                      return (
                        <button
                          key={venueShort}
                          onClick={() => {
                            if (isActive) {
                              handleFilterChange({ venue: 'all' });
                            } else {
                              const fullVenue = availableVenues.find(v => v.toLowerCase().includes(venueShort.toLowerCase())) || venueShort;
                              handleFilterChange({ venue: fullVenue });
                              setTimeout(() => {
                                const showsEl = document.getElementById('shows-section');
                                if (showsEl) {
                                  showsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }
                              }, 100);
                            }
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            isActive
                              ? 'bg-rose-500 text-white shadow-xs'
                              : 'bg-slate-800/90 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/60'
                          }`}
                        >
                          {venueShort}
                        </button>
                      );
                    })}
                  </div>

                  {/* Renglón 2: Resto de los lugares centrado respecto al renglón superior */}
                  <div className="flex flex-wrap items-center justify-center gap-2 w-full">
                    {[
                      'Mute',
                      'Plaza de la Música',
                      'Polideportivo',
                      'Radio City',
                      'Teatro Tronador',
                      'Vorterix'
                    ].map((venueShort) => {
                      const isActive = filters.venue !== 'all' && filters.venue.toLowerCase().includes(venueShort.toLowerCase());
                      return (
                        <button
                          key={venueShort}
                          onClick={() => {
                            if (isActive) {
                              handleFilterChange({ venue: 'all' });
                            } else {
                              const fullVenue = availableVenues.find(v => v.toLowerCase().includes(venueShort.toLowerCase())) || venueShort;
                              handleFilterChange({ venue: fullVenue });
                              setTimeout(() => {
                                const showsEl = document.getElementById('shows-section');
                                if (showsEl) {
                                  showsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }
                              }, 100);
                            }
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            isActive
                              ? 'bg-rose-500 text-white shadow-xs'
                              : 'bg-slate-800/90 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/60'
                          }`}
                        >
                          {venueShort}
                        </button>
                      );
                    })}
                    {filters.venue !== 'all' && (
                      <button
                        onClick={() => handleFilterChange({ venue: 'all' })}
                        className="text-xs text-rose-400 hover:underline ml-1 cursor-pointer font-medium"
                      >
                        (Ver todos)
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Cartelera estilo Aeropuerto (Split-Flap) con Novedades */}
            <div className="lg:col-span-5 w-full flex flex-col justify-stretch">
              <AirportBoardHeader 
                shows={shows} 
                onSelectShow={setSelectedShow} 
              />
            </div>
          </div>

          {/* Background Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        </section>

        {/* Search & Multi-criteria Filters */}
        <section aria-label="Filtros de búsqueda">
          <ShowFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
            availableVenues={availableVenues}
            totalMatches={filteredShows.length}
            totalShows={shows.length}
            shows={shows}
          />
        </section>

        {/* Espacio publicitario superior: Dos banners de salas y estadios lado a lado con rotación suave */}
        <div className="animate-in fade-in duration-300">
          <AdSenseBanner 
            format="timeline-double" 
            initialOffset={0} 
          />
        </div>

        {/* Active View Content: Grid vs. Timeline */}
        <section id="shows-section" className="scroll-mt-24" aria-label="Lista de recitales">
          {showFavoritesOnly && (
            <div className="mb-6 flex items-center justify-between p-3.5 bg-rose-950/30 border border-rose-800/40 rounded-2xl">
              <div className="flex items-center space-x-2 text-rose-300 text-sm font-semibold">
                <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                <span>Viendo únicamente tus shows guardados en Favoritos ({favorites.length})</span>
              </div>
              <button
                onClick={() => setShowFavoritesOnly(false)}
                className="text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 px-3 py-1 rounded-xl transition-colors"
              >
                Ver todos
              </button>
            </div>
          )}

          {filteredShows.length === 0 ? (
            <div className="text-center py-20 bg-slate-900/60 border border-slate-800 rounded-3xl p-8 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white">No se encontraron recitales con esos criterios</h3>
              <p className="text-slate-400 text-sm max-w-md mx-auto">
                Intentá cambiar el mes, borrar la búsqueda de texto o cambiar a "Todas las ciudades" para descubrir otros shows.
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <button
                  id="empty-reset-filters-btn"
                  onClick={handleResetFilters}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition-colors"
                >
                  Limpiar filtros
                </button>
                {isAdmin && (
                  <button
                    onClick={handleOpenAddShow}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-900/30 transition-all"
                  >
                    Agregar este show manualmente
                  </button>
                )}
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="space-y-6">
              {(() => {
                // Dividimos los shows en bloques de 6 para insertar un banner horizontal cada 6 shows
                const chunks: Show[][] = [];
                for (let i = 0; i < filteredShows.length; i += 6) {
                  chunks.push(filteredShows.slice(i, i + 6));
                }

                return chunks.map((chunk, chunkIdx) => (
                  <React.Fragment key={`chunk-${chunkIdx}`}>
                    {/* Grilla de hasta 6 shows */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {chunk.map((show) => (
                        <ShowCard
                          key={show.id}
                          show={show}
                          isFavorite={favorites.includes(show.id)}
                          onToggleFavorite={toggleFavorite}
                          onSelectShow={setSelectedShow}
                          isAdmin={isAdmin}
                          onEditShow={handleOpenEditShow}
                          onDeleteShow={handleDeleteShow}
                          metrics={metricsMap[show.id]}
                        />
                      ))}
                    </div>

                    {/* Banner a lo ancho de salas de teatros cada 6 shows (excepto al final de la lista) */}
                    {chunkIdx < chunks.length - 1 && (
                      <div className="py-2">
                        <AdSenseBanner
                          format="timeline-double"
                          initialOffset={chunkIdx * 2}
                        />
                      </div>
                    )}
                  </React.Fragment>
                ));
              })()}
            </div>
          ) : (
            <TimelineAgendaView
              shows={filteredShows}
              onSelectShow={setSelectedShow}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              isAdmin={isAdmin}
              onEditShow={handleOpenEditShow}
              onDeleteShow={handleDeleteShow}
              metricsMap={metricsMap}
            />
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-800/80 bg-slate-950 py-10 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Quick buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              id="footer-install-app-btn"
              onClick={() => setIsInstallModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:border-rose-500/50 transition-all cursor-pointer shadow-xs"
              title="Instalar la App de MDQSHOW en tu celular"
            >
              <Smartphone className="w-3.5 h-3.5 text-rose-400" />
              <span>Instalar App en celular</span>
            </button>
            <button
              type="button"
              id="footer-contact-btn"
              onClick={() => setIsContactModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-800 hover:border-slate-700 transition-all cursor-pointer shadow-xs"
            >
              <Mail className="w-3.5 h-3.5 text-rose-400" />
              <span>Contacto</span>
            </button>
            <button
              type="button"
              id="footer-newsletter-btn"
              onClick={() => setIsNewsletterModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-amber-300 hover:text-amber-200 border border-slate-800 hover:border-amber-500/30 transition-all cursor-pointer shadow-xs"
              title="Suscribirme a las novedades de recitales"
            >
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span>Newsletters</span>
            </button>

            {isAdmin && (
              <button
                type="button"
                id="footer-test-ad-btn"
                onClick={() => window.dispatchEvent(new Event('mdq_trigger_ad_popup'))}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-all cursor-pointer shadow-xs"
                title="Probar el popup de publicidad obligatorio de 5s"
              >
                <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                <span>Probar Publicidad (5s)</span>
              </button>
            )}
          </div>

          {/* Aviso Legal & Descargo de Responsabilidad (Disclaimer Oficial) */}
          <div className="max-w-3xl mx-auto text-center bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 text-xs text-slate-400 space-y-2.5">
            <div className="flex items-center justify-center gap-2 text-slate-200 font-bold tracking-wide uppercase text-[11px]">
              <Scale className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Aviso Legal y de Transparencia</span>
            </div>
            
            <p className="leading-relaxed">
              <strong className="text-slate-300">MDQSHOW no comercializa, reserva ni emite entradas para ningún espectáculo.</strong>
            </p>
            <p className="leading-relaxed text-slate-400">
              Actuamos exclusivamente como una guía informativa independiente sobre recitales, shows y eventos en la ciudad de Mar del Plata.
            </p>

            <p className="leading-relaxed text-slate-400">
              Todas las operaciones de compra y cobro se concretan pura y directamente en las boleterías y plataformas autorizadas por cada productora.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-1.5 pt-2 border-t border-slate-800 text-[10px] text-slate-500">
              <span>Marcas y afiches pertenecen a sus respectivos productores y artistas.</span>
              <span>Conforme Ley 24.240 de Defensa del Consumidor • República Argentina</span>
            </div>
          </div>

          <div className="pt-2 space-y-1.5 text-center">
            <p className="font-bold text-sm text-slate-300">
              MDQ<span className="text-rose-500">SHOW</span> — Cartelera de recitales y shows en Mar del Plata
            </p>
            <p className="text-slate-400">
              Email de contacto y prensa:{' '}
              <button
                type="button"
                onClick={() => setIsContactModalOpen(true)}
                className="text-rose-400 hover:text-rose-300 underline font-medium cursor-pointer"
              >
                info@mdqshow.com.ar
              </button>
            </p>
            <p className="text-slate-600 text-[11px]">
              © {new Date().getFullYear()} MDQSHOW. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>

      {/* Welcome / Entry 5-second Ad Popup */}
      <AdPopup shows={shows} isAdmin={isAdmin} />

      {/* Contact Form Modal */}
      <ContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
      />

      {/* Newsletter & Alerts Modal */}
      <NewsletterModal
        isOpen={isNewsletterModalOpen}
        onClose={() => setIsNewsletterModalOpen(false)}
        isAdmin={isAdmin}
      />

      {/* Mobile PWA Install Modal */}
      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />

      {/* Admin Metrics & Performance Modal */}
      <AdminMetricsModal
        isOpen={isAdminMetricsOpen}
        onClose={() => setIsAdminMetricsOpen(false)}
        shows={shows}
        metricsMap={metricsMap}
        bannerMetricsMap={bannerMetricsMap}
        subscribers={subscribers}
      />

      {/* Direct deletion confirmation toast */}
      {deleteToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-red-950/95 border border-red-500/80 text-white px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5">
          <Trash2 className="w-4 h-4 text-red-400 shrink-0" />
          <span className="text-xs font-semibold">{deleteToast}</span>
          <button 
            type="button"
            onClick={() => setDeleteToast(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            title="Cerrar aviso"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Add / Edit Show Modal */}
      <ShowModal
        isOpen={isShowModalOpen}
        onClose={() => {
          setIsShowModalOpen(false);
          setEditingShow(null);
        }}
        onSaveShow={handleSaveShow}
        onDeleteShow={handleDeleteShow}
        initialShow={editingShow}
        defaultCity={currentCity}
      />

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Botón flotante para volver arriba (Back to Top) */}
      <div 
        className={`fixed bottom-6 right-6 z-40 transition-all duration-300 ${
          showScrollTop 
            ? 'opacity-100 translate-y-0 pointer-events-auto' 
            : 'opacity-0 translate-y-6 pointer-events-none'
        }`}
      >
        <button
          type="button"
          onClick={scrollToTop}
          className="group flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-slate-900/80 hover:bg-slate-900 text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 hover:border-rose-500/60 backdrop-blur-md shadow-xl shadow-black/60 transition-all active:scale-90 cursor-pointer"
          title="Volver arriba"
          aria-label="Volver arriba de la página"
        >
          <ChevronUp className="w-6 h-6 stroke-[2.5] text-rose-500 group-hover:text-rose-400 transition-transform group-hover:-translate-y-0.5" />
        </button>
      </div>
    </div>
  );
}
