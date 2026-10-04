import React, { useState, useEffect, useMemo } from 'react';
import { getDaysUntil, isShowPast } from './utils/dateHelpers';
import { Show, FilterState, Sponsor } from './types';
import { INITIAL_SHOWS, AVAILABLE_CITIES } from './data/mockShows';
import { 
  subscribeToShows, 
  saveShowToCloud, 
  deleteShowFromCloud, 
  getLocalFallbackShows,
  restoreShowsFromBackup
} from './services/showsService';
import { 
  subscribeToSponsors,
  saveSponsorToCloud,
  deleteSponsorFromCloud,
  getLocalFallbackSponsors
} from './services/sponsorsService';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import { Navbar } from './components/Navbar';
import { ShowFilters } from './components/ShowFilters';
import { ShowCard } from './components/ShowCard';
import { ShowModal } from './components/ShowModal';
import { TimelineAgendaView } from './components/TimelineAgendaView';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminSponsorsModal } from './components/AdminSponsorsModal';
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
  Info,
  Megaphone
} from 'lucide-react';

const LOCAL_STORAGE_SHOWS_LIST = 'mdqshow_all_shows_v4';
const LOCAL_STORAGE_FAVORITES = 'mdqshow_favorites_v2';

export default function App() {
  const currentCity = 'Mar del Plata';

  // Estado de administrador: lo determina Firebase Auth (no la URL ni el localStorage)
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);

  useEffect(() => {
    // Limpieza de la bandera vieja que guardaba la versión anterior
    try {
      localStorage.removeItem('mdqshow_is_admin_v1');
    } catch {
      // ignore
    }
    // Entrar a /admin (o #admin) solo abre la pantalla de login; el acceso lo da Firebase Auth
    const isAdminRoute = () => {
      const path = window.location.pathname.toLowerCase().replace(/\/$/, '');
      return path.endsWith('/admin') || window.location.hash.toLowerCase() === '#admin';
    };
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setIsAdmin(!!user);
      if (!user && isAdminRoute()) {
        setIsAdminLoginOpen(true);
      }
    });
    const handleRouteChange = () => {
      if (!auth.currentUser && isAdminRoute()) {
        setIsAdminLoginOpen(true);
      }
    };
    window.addEventListener('popstate', handleRouteChange);
    window.addEventListener('hashchange', handleRouteChange);
    return () => {
      unsubscribeAuth();
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('hashchange', handleRouteChange);
    };
  }, []);

  const handleLoginSuccess = () => {
    setIsAdmin(true);
  };

  const handleAdminLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    }
    setIsAdmin(false);
    window.location.hash = '';

    const path = window.location.pathname.toLowerCase().replace(/\/$/, '');
    if (path.endsWith('/admin')) {
      // Vuelve a la misma ruta sin "/admin" (por ejemplo /test/admin -> /test)
      window.history.replaceState(null, '', path.replace(/\/admin$/, '') || '/');
    }
  };

  // Shows list initialized from local fallback, then synced with Firestore in real time
  const [allShows, setShows] = useState<Show[]>(() => getLocalFallbackShows());
  // Solo el administrador puede pedir ver también los shows que ya pasaron
  const [showPastShows, setShowPastShows] = useState(false);
  // Se actualiza solo al cambiar el día, aunque la página quede abierta
  const [dayKey, setDayKey] = useState(() => new Date().toDateString());
  useEffect(() => {
    const id = window.setInterval(() => setDayKey(new Date().toDateString()), 60 * 1000);
    return () => window.clearInterval(id);
  }, []);
  const [showsStatus, setShowsStatus] = useState<{ source: 'cloud' | 'empty' | 'local'; error?: string }>({ source: 'cloud' });

  // Subscribe to real-time updates from Firebase Firestore
  useEffect(() => {
    const unsubscribe = subscribeToShows((cloudShows, source, errorMessage) => {
      if (cloudShows && cloudShows.length > 0) {
        setShows(cloudShows);
      }
      setShowsStatus({ source, error: errorMessage });
    });
    return () => unsubscribe();
  }, []);

  // Métricas en tiempo real de Firebase
  const [metricsMap, setMetricsMap] = useState<Record<string, ShowMetrics>>({});
  const [bannerMetricsMap, setBannerMetricsMap] = useState<Record<string, BannerMetrics>>({});
  const [isAdminMetricsOpen, setIsAdminMetricsOpen] = useState(false);

  // Solo el administrador necesita las métricas: los visitantes no las escuchan (ahorra lecturas de Firebase)
  useEffect(() => {
    if (!isAdmin) return;
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
  }, [isAdmin]);

  // Suscriptores para KPIs del Admin
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  useEffect(() => {
    if (!isAdmin) {
      setSubscribers([]);
      return;
    }
    const unsubSubs = subscribeToSubscribers((subs) => {
      setSubscribers(subs);
    });
    return () => unsubSubs();
  }, [isAdmin]);

  // Sponsors y Publicidades sincronizados con Firestore en tiempo real
  const [sponsors, setSponsors] = useState<Sponsor[]>(() => getLocalFallbackSponsors());
  const [isAdminSponsorsOpen, setIsAdminSponsorsOpen] = useState(false);
  const [sponsorsStatus, setSponsorsStatus] = useState<{ source: 'cloud' | 'empty' | 'local'; error?: string }>({ source: 'local' });

  useEffect(() => {
    const unsubSponsors = subscribeToSponsors((cloudSponsors, source, errorMessage) => {
      if (cloudSponsors && cloudSponsors.length > 0) {
        setSponsors(cloudSponsors);
      }
      setSponsorsStatus({ source, error: errorMessage });
    });
    return () => unsubSponsors();
  }, []);

  const handleSaveSponsor = async (sponsor: Sponsor) => {
    await saveSponsorToCloud(sponsor);
  };

  const handleDeleteSponsor = async (sponsorId: string) => {
    await deleteSponsorFromCloud(sponsorId);
  };

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
    // Immediate optimistic local update
    setShows((prev) => {
      const exists = prev.some((s) => s.id === showData.id);
      let updated: Show[];
      if (exists) {
        updated = prev.map((s) => (s.id === showData.id ? showData : s));
      } else {
        updated = [showData, ...prev];
      }
      return updated;
    });

    if (selectedShow && selectedShow.id === showData.id) {
      setSelectedShow(showData);
    }

    // Save to Firebase Firestore
    try {
      await saveShowToCloud(showData);
      setDeleteToast(`"${showData.band}" se guardó y sincronizó correctamente en la nube.`);
      setTimeout(() => {
        setDeleteToast(null);
      }, 4000);
    } catch (err: any) {
      console.error('Error al guardar show en Firestore:', err);
      alert('Aviso al guardar en la nube: ' + (err?.message || 'Verificá tu conexión a internet'));
    }
  };

  // Toast state for feedback
  const [deleteToast, setDeleteToast] = useState<string | null>(null);

  // Delete show handler
  const handleDeleteShow = async (showId: string) => {
    const showToDelete = allShows.find((s) => s.id === showId);
    const bandName = showToDelete ? showToDelete.band : 'El recital';

    // Immediate optimistic local update
    setShows((prev) => prev.filter((s) => s.id !== showId));

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
      console.error('Error al eliminar show de Firestore:', err);
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
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allShows, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `mdqshow_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import / Restaurar backup handler
  const handleImportBackup = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        alert('El archivo no contiene una lista válida de recitales.');
        return;
      }

      const confirmed = window.confirm(
        `¿Confirmás restaurar ${parsed.length} recitales desde "${file.name}"?\nEsta acción actualizará la base de datos de MDQSHOW en Firebase.`
      );
      if (!confirmed) return;

      const result = await restoreShowsFromBackup(parsed);
      setDeleteToast(`¡Se restauraron exitosamente ${result.count} recitales desde la copia de seguridad!`);
      setTimeout(() => setDeleteToast(null), 5000);
    } catch (err: any) {
      console.error('Error al importar backup:', err);
      alert(`Error al restaurar archivo: ${err?.message || 'Formato JSON inválido'}`);
    }
  };

  // Descarga del listado rápido de shows en formato TXT (para verificación rápida)
  const handleDownloadTxt = () => {
    // Ordenar shows cronológicamente por primera fecha
    const sorted = [...allShows].sort((a, b) => {
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

  // Cartelera visible: los shows que ya pasaron se ocultan solos (se conservan en la base de datos).
  // Si un show tiene varias fechas, solo se muestran las que todavía no pasaron.
  const shows = useMemo(() => {
    if (isAdmin && showPastShows) return allShows;
    const upcoming: Show[] = [];
    for (const show of allShows) {
      const dates = Array.isArray(show.dates) ? show.dates : [];
      if (dates.length === 0) {
        upcoming.push(show); // fecha a confirmar
        continue;
      }
      const futureDates = dates.filter((d) => !getDaysUntil(d).isPast);
      if (futureDates.length === 0) continue; // todas las fechas ya pasaron
      upcoming.push(futureDates.length === dates.length ? show : { ...show, dates: futureDates });
    }
    return upcoming;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allShows, isAdmin, showPastShows, dayKey]);

  const hiddenPastCount = useMemo(
    () => allShows.filter((s) => isShowPast(s.dates)).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allShows, dayKey]
  );

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
        onImportBackup={handleImportBackup}
        onDownloadTxt={handleDownloadTxt}
        onOpenMetrics={() => setIsAdminMetricsOpen(true)}
        onOpenSponsors={() => setIsAdminSponsorsOpen(true)}
      />

      {/* Aviso solo para el administrador: la lista de recitales no viene de la base de datos real */}
      {isAdmin && showsStatus.source !== 'cloud' && (
        <div className="bg-rose-950/90 border-b border-rose-500/60 text-rose-100 px-4 py-3 text-xs sm:text-sm" role="alert">
          <div className="max-w-7xl mx-auto">
            <p className="font-bold">
              {showsStatus.source === 'empty'
                ? '⚠️ La base de datos de recitales está vacía: estás viendo solo la lista de respaldo.'
                : '⚠️ No se pudo leer la base de datos: la lista de recitales que ves es una copia guardada, no la real.'}
            </p>
            <p className="mt-1 text-rose-200/90">
              {/quota/i.test(showsStatus.error || '')
                ? 'Firebase alcanzó el límite diario gratuito de uso y se restablece solo cada día (alrededor de las 4 de la mañana, hora de Argentina). Mientras tanto no cargues, edites, borres ni restaures recitales.'
                : 'Evitá cargar, editar, borrar o restaurar recitales hasta que desaparezca este aviso.'}
              {showsStatus.error && !/quota/i.test(showsStatus.error) ? ` Detalle técnico: ${showsStatus.error}` : ''}
            </p>
          </div>
        </div>
      )}

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

        {/* Espacio publicitario superior: Los dos primeros según los sponsors que marcó el admin */}
        <div className="animate-in fade-in duration-300">
          <AdSenseBanner 
            format="timeline-double" 
            initialOffset={0} 
            sponsors={sponsors}
            isTopBanner={true}
          />
        </div>

        {/* Active View Content: Grid vs. Timeline */}
        <section id="shows-section" className="scroll-mt-24" aria-label="Lista de recitales">
          {isAdmin && (hiddenPastCount > 0 || showPastShows) && (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-900 border border-slate-700 rounded-2xl">
              <p className="text-xs sm:text-sm text-slate-300">
                {showPastShows
                  ? 'Estás viendo también los shows que ya pasaron (el público no los ve).'
                  : `Hay ${hiddenPastCount} ${hiddenPastCount === 1 ? 'show finalizado oculto' : 'shows finalizados ocultos'} para el público (solo lo ves vos).`}
              </p>
              <button
                type="button"
                onClick={() => setShowPastShows((v) => !v)}
                className="text-xs font-bold text-white bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
              >
                {showPastShows ? 'Ocultar finalizados' : 'Mostrar finalizados'}
              </button>
            </div>
          )}
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
                        />
                      ))}
                    </div>

                    {/* Banner a lo ancho de salas de teatros cada 6 shows (excepto al final de la lista) */}
                    {chunkIdx < chunks.length - 1 && (
                      <div className="py-2">
                        <AdSenseBanner
                          format="timeline-double"
                          initialOffset={chunkIdx * 2}
                          sponsors={sponsors}
                          isTopBanner={false}
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
              sponsors={sponsors}
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

            {isAdmin ? (
              <>
                <button
                  type="button"
                  id="footer-sponsors-btn"
                  onClick={() => setIsAdminSponsorsOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 transition-all cursor-pointer shadow-xs active:scale-95"
                  title="Gestionar Publicidades y Sponsors (Pop-up, Primeros Dos, Feed)"
                >
                  <Megaphone className="w-3.5 h-3.5 text-amber-400" />
                  <span>Publicidades / Sponsors</span>
                </button>

                <button
                  type="button"
                  id="footer-test-ad-btn"
                  onClick={() => window.dispatchEvent(new CustomEvent('mdq_trigger_ad_popup'))}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all cursor-pointer shadow-xs"
                  title="Probar el popup: cada vez que lo tocás muestra el siguiente sponsor, así los ves a todos"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Probar Popup Sponsor (siguiente)</span>
                </button>
              </>
            ) : null}
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
            <p className="text-slate-500 text-xs">
              <button
                type="button"
                onClick={() => setIsContactModalOpen(true)}
                className="text-slate-400 hover:text-rose-400 underline transition-colors cursor-pointer"
              >
                Formulario de contacto
              </button>
            </p>
            <p className="text-slate-600 text-[11px]">
              © {new Date().getFullYear()} MDQSHOW. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>

      {/* Welcome / Entry 5-second Ad Popup for Sponsors */}
      <AdPopup sponsors={sponsors} isAdmin={isAdmin} />

      {/* Admin Sponsors & Publicidades Modal */}
      <AdminSponsorsModal
        isOpen={isAdminSponsorsOpen}
        onClose={() => setIsAdminSponsorsOpen(false)}
        sponsors={sponsors}
        sponsorsStatus={sponsorsStatus}
        onSaveSponsor={handleSaveSponsor}
        onDeleteSponsor={handleDeleteSponsor}
      />

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
        shows={allShows}
        metricsMap={metricsMap}
        bannerMetricsMap={bannerMetricsMap}
        subscribers={subscribers}
        sponsors={sponsors}
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
