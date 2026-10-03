import React, { useRef } from 'react';
import { MapPin, Plus, Heart, Calendar, LayoutGrid, ShieldCheck, Lock, LogOut, Mail, Bell, Download, FileText, BarChart3, Database, Upload, Megaphone } from 'lucide-react';
import { MdqBrandIcon } from './MdqBrandIcon';
import { AVAILABLE_CITIES } from '../data/mockShows';

interface NavbarProps {
  currentCity: string;
  onSelectCity: (city: string) => void;
  favoritesCount: number;
  showFavoritesOnly: boolean;
  onToggleFavoritesOnly: () => void;
  onOpenAddShow: () => void;
  viewMode: 'grid' | 'timeline';
  onToggleViewMode: (mode: 'grid' | 'timeline') => void;
  isAdmin: boolean;
  onOpenAdminLogin: () => void;
  onAdminLogout: () => void;
  onOpenContact: () => void;
  onOpenNewsletter: () => void;
  onOpenInstallApp: () => void;
  onExportBackup?: () => void;
  onImportBackup?: (file: File) => void;
  onDownloadTxt?: () => void;
  onOpenMetrics?: () => void;
  onOpenSponsors?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentCity,
  onSelectCity,
  favoritesCount,
  showFavoritesOnly,
  onToggleFavoritesOnly,
  onOpenAddShow,
  viewMode,
  onToggleViewMode,
  isAdmin,
  onOpenAdminLogin,
  onAdminLogout,
  onOpenContact,
  onOpenNewsletter,
  onOpenInstallApp,
  onExportBackup,
  onImportBackup,
  onDownloadTxt,
  onOpenMetrics,
  onOpenSponsors,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  return (
    <header className="sticky top-0 z-40 bg-[#0e1117]/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand Oficial */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-slate-950 border border-rose-500/50 flex items-center justify-center shadow-xl shadow-rose-950/60 p-1 hover:scale-105 transition-transform overflow-hidden relative group shrink-0">
              <div className="absolute inset-0 bg-gradient-to-tr from-rose-600/25 via-rose-500/10 to-amber-500/20 pointer-events-none" />
              <MdqBrandIcon className="w-full h-full relative z-10" />
            </div>

            <div>
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <span className="font-black text-xl sm:text-3xl tracking-tight text-white font-mono leading-none">
                  MDQ<span className="text-rose-500">SHOW</span>
                </span>
                {/* Badge visible on desktop/tablets */}
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <MapPin className="w-3 h-3 mr-1 text-rose-400" />
                  <span>Mar del Plata</span>
                </span>
                {isAdmin && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <ShieldCheck className="w-2.5 h-2.5 mr-1" />
                    <span className="hidden sm:inline">MODO ADMIN</span>
                    <span className="sm:hidden">ADMIN</span>
                  </span>
                )}
              </div>
              {/* Mar del Plata subtext on mobile */}
              <div className="flex items-center text-[10px] text-rose-400/90 font-medium sm:hidden mt-0.5">
                <MapPin className="w-2.5 h-2.5 mr-1 text-rose-400 shrink-0" />
                <span>Mar del Plata</span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Cartelera de recitales y shows en Mar del Plata
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
            {/* View Mode Switcher (Desktop & Mobile) */}
            <div className="flex items-center bg-slate-900/80 p-1 rounded-xl border border-slate-800">
              <button
                id="view-mode-grid-btn"
                onClick={() => onToggleViewMode('grid')}
                className={`flex items-center px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Vista de cuadrícula de shows"
              >
                <LayoutGrid className="w-3.5 h-3.5 sm:mr-1.5 shrink-0" />
                <span className="hidden sm:inline">Cartelera</span>
              </button>
              <button
                id="view-mode-timeline-btn"
                onClick={() => onToggleViewMode('timeline')}
                className={`flex items-center px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'timeline'
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Vista cronológica por fecha"
              >
                <Calendar className="w-3.5 h-3.5 sm:mr-1.5 shrink-0" />
                <span className="hidden sm:inline">Cronograma</span>
              </button>
            </div>

            {/* Botones de usuario (se ocultan en modo Admin para una interfaz de gestión limpia y directa) */}
            {!isAdmin && (
              <>
                {/* App Download Button */}
                <button
                  type="button"
                  id="navbar-install-app-btn"
                  onClick={onOpenInstallApp}
                  className="flex items-center p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all cursor-pointer shadow-xs active:scale-95"
                  title="Descargar e instalar App de MDQSHOW en tu celular"
                >
                  <Download className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-rose-400 shrink-0 sm:mr-1.5" />
                  <span className="hidden sm:inline">App</span>
                </button>

                {/* Newsletter Popup Button */}
                <button
                  type="button"
                  id="navbar-newsletter-btn"
                  onClick={onOpenNewsletter}
                  className="flex items-center p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all cursor-pointer shadow-xs active:scale-95"
                  title="Suscribirme al Newsletter y Alertas"
                >
                  <Bell className="w-3.5 h-3.5 text-amber-400 shrink-0 sm:mr-1.5" />
                  <span className="hidden sm:inline">Newsletter</span>
                </button>

                {/* Contacto Popup Button (visible on tablets/desktop) */}
                <button
                  type="button"
                  id="navbar-contact-btn"
                  onClick={onOpenContact}
                  className="hidden lg:flex items-center px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 transition-colors cursor-pointer"
                  title="Abrir formulario de contacto"
                >
                  <Mail className="w-3.5 h-3.5 mr-1.5 text-rose-400" />
                  <span>Contacto</span>
                </button>

                {/* Favorites Button (visible para usuarios normales) */}
                <button
                  id="favorites-toggle-btn"
                  onClick={onToggleFavoritesOnly}
                  className={`relative p-2 sm:p-2.5 rounded-xl border transition-all active:scale-95 cursor-pointer ${
                    showFavoritesOnly
                      ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                      : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                  title={showFavoritesOnly ? 'Ver todos los shows' : 'Ver solo mis shows favoritos'}
                >
                  <Heart className={`w-4 h-4 ${showFavoritesOnly ? 'fill-rose-500 text-rose-500' : ''}`} />
                  {favoritesCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {favoritesCount}
                    </span>
                  )}
                </button>
              </>
            )}

            {/* Admin Controls */}
            {isAdmin ? (
              <div className="flex items-center space-x-1 sm:space-x-1.5">
                {onOpenSponsors && (
                  <button
                    id="admin-sponsors-btn"
                    onClick={onOpenSponsors}
                    className="flex items-center px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-amber-300 hover:text-amber-200 bg-amber-500/20 hover:bg-amber-500/30 rounded-xl transition-all border border-amber-500/50 text-xs font-black cursor-pointer shadow-xs active:scale-95"
                    title="Cargar y Gestionar Publicidades y Sponsors (Pop-up, Primeros Dos, Feed)"
                  >
                    <Megaphone className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 text-amber-400 shrink-0" />
                    <span className="font-extrabold">Sponsors</span>
                  </button>
                )}

                {onOpenMetrics && (
                  <button
                    id="admin-metrics-btn"
                    onClick={onOpenMetrics}
                    className="flex items-center p-1.5 sm:px-2.5 sm:py-2 text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-xl transition-all border border-emerald-500/30 text-xs font-bold cursor-pointer"
                    title="Ver Métricas Comerciales y Trackeo de Clicks a Entradas"
                  >
                    <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-1 shrink-0" />
                    <span className="hidden sm:inline">Métricas</span>
                  </button>
                )}

                {/* Botón TXT: Solo visible para Admin para verificación rápida */}
                {onDownloadTxt && (
                  <button
                    type="button"
                    id="navbar-download-txt-btn"
                    onClick={onDownloadTxt}
                    className="flex items-center p-1.5 sm:px-2.5 sm:py-2 text-sky-400 hover:text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 rounded-xl transition-all border border-sky-500/30 text-xs font-bold cursor-pointer"
                    title="Descargar listado de recitales en formato texto (.txt) para verificación rápida"
                  >
                    <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-1 shrink-0" />
                    <span className="hidden sm:inline">TXT</span>
                  </button>
                )}

                {/* Botón Backup: con icono de Database / Backup bien reconocible */}
                {onExportBackup && (
                  <button
                    id="admin-export-backup-btn"
                    onClick={onExportBackup}
                    className="flex items-center p-1.5 sm:px-2.5 sm:py-2 text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 rounded-xl transition-all border border-amber-500/30 text-xs font-bold cursor-pointer"
                    title="Descargar copia de seguridad (Backup JSON) de todos los recitales"
                  >
                    <Database className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-1 shrink-0" />
                    <span className="hidden md:inline">Backup</span>
                  </button>
                )}

                {/* Botón Restaurar Backup: para cargar y restablecer shows desde un archivo JSON */}
                {onImportBackup && (
                  <>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept=".json,application/json"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          onImportBackup(file);
                          e.target.value = '';
                        }
                      }}
                    />
                    <button
                      id="admin-import-backup-btn"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center p-1.5 sm:px-2.5 sm:py-2 text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-xl transition-all border border-indigo-500/30 text-xs font-bold cursor-pointer"
                      title="Restaurar recitales desde un archivo Backup .json"
                    >
                      <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-1 shrink-0" />
                      <span className="hidden md:inline">Restaurar</span>
                    </button>
                  </>
                )}

                <button
                  id="open-add-show-modal-btn"
                  onClick={onOpenAddShow}
                  className="flex items-center px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-semibold text-xs sm:text-sm shadow-md shadow-rose-900/40 transition-all active:scale-95"
                  title="Agregar un nuevo recital a la cartelera"
                >
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-1.5 shrink-0" />
                  <span className="hidden sm:inline">Agregar Show</span>
                  <span className="sm:hidden font-bold">Show</span>
                </button>
                <button
                  onClick={onAdminLogout}
                  className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors border border-slate-700/60"
                  title="Cerrar sesión de administrador"
                >
                  <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
};
