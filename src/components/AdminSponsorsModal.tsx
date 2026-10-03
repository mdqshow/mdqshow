import React, { useState, useRef } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Edit3, 
  Sparkles, 
  Upload, 
  Image as ImageIcon, 
  Type, 
  Film,
  ExternalLink, 
  Check, 
  Eye, 
  CheckSquare, 
  Square,
  AlertCircle,
  Megaphone,
  Play,
  RotateCcw,
  Download,
  MapPin,
  Search
} from 'lucide-react';
import { Sponsor, SponsorEffectType } from '../types';
import { SponsorCard } from './SponsorCard';
import { compressImage } from '../utils/imageCompressor';
import { INITIAL_SPONSORS } from '../data/mockSponsors';
import { importMissingSponsors } from '../services/sponsorsService';
import { downloadSponsorsTxt } from '../utils/sponsorsExport';

interface AdminSponsorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sponsors: Sponsor[];
  sponsorsStatus?: { source: 'cloud' | 'empty' | 'local'; error?: string };
  onSaveSponsor: (sponsor: Sponsor) => Promise<void>;
  onDeleteSponsor: (sponsorId: string) => Promise<void>;
}

const PRESET_BACKGROUNDS = [
  { name: 'Negro & Ámbar', bg: 'bg-black', text: 'text-amber-300', subtext: 'text-zinc-300' },
  { name: 'Noche & Oro (Bendu)', bg: 'bg-gradient-to-br from-[#180e29] via-[#0f071a] to-[#24123d]', text: 'text-amber-300', subtext: 'text-amber-200/90' },
  { name: 'Neón Rock (Abbey Road)', bg: 'bg-gradient-to-br from-[#121214] via-[#1c1917] to-[#0c0a09]', text: 'text-amber-400', subtext: 'text-orange-300/90' },
  { name: 'Océano Marino (Mute)', bg: 'bg-gradient-to-br from-[#032b30] via-[#064249] to-[#011a1d]', text: 'text-emerald-300', subtext: 'text-teal-200/90' },
  { name: 'Azul Arena (Arena MDP)', bg: 'bg-gradient-to-br from-[#071c30] via-[#0c2e4e] to-[#041221]', text: 'text-cyan-200', subtext: 'text-sky-200/90' },
  { name: 'Borgoña Carmesí (Plaza Música)', bg: 'bg-gradient-to-br from-[#2a0813] via-[#1a050c] to-[#3b0d1b]', text: 'text-rose-200', subtext: 'text-rose-300/90' },
  { name: 'Marquesina Broadway (Radio City)', bg: 'bg-gradient-to-br from-[#23093b] via-[#150426] to-[#300c4f]', text: 'text-fuchsia-200', subtext: 'text-pink-300/90' },
  { name: 'Cyber Noche', bg: 'bg-gradient-to-br from-[#051329] via-[#020b18] to-black', text: 'text-cyan-300', subtext: 'text-pink-300' },
];

export const AdminSponsorsModal: React.FC<AdminSponsorsModalProps> = ({
  isOpen,
  onClose,
  sponsors,
  sponsorsStatus,
  onSaveSponsor,
  onDeleteSponsor,
}) => {
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<Sponsor>>({
    type: 'text',
    name: '',
    address: '',
    link: '',
    image: '',
    showInPopup: false,
    showInTopBanner: false,
    showInFeed: true,
    effectType: 'random',
    bgColor: PRESET_BACKGROUNDS[0].bg,
    textColor: PRESET_BACKGROUNDS[0].text,
    subtextColor: PRESET_BACKGROUNDS[0].subtext,
    isActive: true,
  });

  if (!isOpen) return null;

  const handleStartCreate = () => {
    setIsCreatingNew(true);
    setEditingSponsor(null);
    setFormData({
      id: `sponsor-${Date.now()}`,
      type: 'text',
      name: '',
      address: '',
      link: '',
      image: '',
      showInPopup: false,
      showInTopBanner: false,
      showInFeed: true,
      effectType: 'random',
      bgColor: PRESET_BACKGROUNDS[0].bg,
      textColor: PRESET_BACKGROUNDS[0].text,
      subtextColor: PRESET_BACKGROUNDS[0].subtext,
      isActive: true,
    });
  };

  const handleStartEdit = (s: Sponsor) => {
    setEditingSponsor(s);
    setIsCreatingNew(false);
    setFormData({ ...s });
    bodyRef.current?.scrollTo({ top: 0 });
  };

  const handleCancelForm = () => {
    setEditingSponsor(null);
    setIsCreatingNew(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Comprimir la imagen para que sea ultra ligera y compatible con Firestore
      const compressedBase64 = await compressImage(file, 900, 450, 0.8);
      setFormData(prev => ({
        ...prev,
        image: compressedBase64,
        type: 'image'
      }));
      setFeedbackMsg('Imagen cargada y optimizada con éxito');
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch (err) {
      console.error('Error al procesar imagen:', err);
      alert('Error al procesar la imagen. Intenta con un archivo JPG o PNG más pequeño.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      alert('Por favor ingresá al menos el nombre del sponsor / negocio (Renglón 1).');
      return;
    }

    if (formData.type === 'video' && !formData.video?.trim()) {
      alert('Para una publicidad con video ingresá el link directo del video (.mp4 o .webm).');
      return;
    }

    setIsSaving(true);
    try {
      const sponsorToSave: Sponsor = {
        id: formData.id || editingSponsor?.id || `sponsor-${Date.now()}`,
        type: formData.type || 'text',
        name: formData.name.trim().toUpperCase(),
        address: (formData.address || '').trim().toUpperCase(),
        link: formData.link?.trim() || '',
        image: formData.image || '',
        video: formData.video?.trim() || '',
        showInPopup: Boolean(formData.showInPopup),
        showInTopBanner: Boolean(formData.showInTopBanner),
        showInFeed: formData.showInFeed !== false,
        effectType: formData.effectType || 'random',
        bgColor: formData.bgColor || PRESET_BACKGROUNDS[0].bg,
        textColor: formData.textColor || PRESET_BACKGROUNDS[0].text,
        subtextColor: formData.subtextColor || PRESET_BACKGROUNDS[0].subtext,
        isActive: formData.isActive !== false,
        createdAt: formData.createdAt || new Date().toISOString(),
        notes: formData.notes?.trim() || '',
      };

      await onSaveSponsor(sponsorToSave);
      setFeedbackMsg(`Sponsor "${sponsorToSave.name}" guardado exitosamente`);
      setTimeout(() => setFeedbackMsg(null), 3000);
      setEditingSponsor(null);
      setIsCreatingNew(false);
    } catch (error) {
      console.error('Error al guardar sponsor:', error);
      alert('Ocurrió un error al guardar el sponsor en Firestore.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (sponsorId: string, name: string) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar permanentemente el sponsor "${name}"?`)) {
      try {
        await onDeleteSponsor(sponsorId);
        if (editingSponsor?.id === sponsorId) {
          setEditingSponsor(null);
          setIsCreatingNew(false);
        }
      } catch (err) {
        console.error('Error al eliminar sponsor:', err);
        alert('Error al eliminar el sponsor.');
      }
    }
  };

  const handleTestPopup = (sponsorId: string) => {
    window.dispatchEvent(new CustomEvent('mdq_trigger_ad_popup', { detail: { sponsorId } }));
    onClose();
  };

  const handleDownloadTxt = () => {
    downloadSponsorsTxt(sponsors);
    setFeedbackMsg('Se descargó el archivo con todos los sponsors');
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleImportVenues = async () => {
    if (!window.confirm('Se van a cargar como sponsors los lugares de los shows (Abbey Road, Arena Mar del Plata, Auditorium, Bendu Arena, Bruto, Mute, Plaza de la Música, Polideportivo, Radio City, Teatro Tronador y Vorterix) que todavía no estén cargados. Los que ya existen no se tocan ni se duplican. ¿Seguimos?')) {
      return;
    }
    setIsImporting(true);
    try {
      const created = await importMissingSponsors(INITIAL_SPONSORS);
      setFeedbackMsg(
        created > 0
          ? `Listo: se cargaron ${created} ${created === 1 ? 'lugar' : 'lugares'} como sponsors`
          : 'Ya estaban todos los lugares cargados'
      );
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err) {
      console.error('Error al cargar los lugares:', err);
      alert('No se pudieron cargar los lugares. Revisá que hayas iniciado sesión como administrador e intentá de nuevo.');
    } finally {
      setIsImporting(false);
    }
  };

  const isFormActive = isCreatingNew || editingSponsor !== null;

  // Lista en formato "chips": operativos primero, pausados aparte, con buscador
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const visibleSponsors = sponsors.filter((s) =>
    !normalizedSearch || `${s.name} ${s.address || ''}`.toLowerCase().includes(normalizedSearch)
  );
  const activeSponsors = visibleSponsors.filter((s) => s.isActive !== false);
  const pausedSponsors = visibleSponsors.filter((s) => s.isActive === false);

  const describePlaces = (s: Sponsor) => {
    const places: string[] = [];
    if (s.showInPopup) places.push('Pop-up de inicio');
    if (s.showInTopBanner) places.push('Los dos primeros');
    if (s.showInFeed !== false) places.push('Resto de la página');
    return `${s.name}${s.address ? ' — ' + s.address : ''} · ${places.length ? places.join(', ') : 'Sin ubicación'} · Tocá para editar`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div 
        className="relative w-full max-w-4xl bg-slate-900 border border-amber-500/40 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <span>Gestión de Publicidades y Sponsors</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  ADMIN
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Configurá sponsors con imagen o texto en 2 renglones con transiciones animadas automáticas
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback message banner */}
        {feedbackMsg && (
          <div className="px-4 py-2 bg-emerald-950/80 border-b border-emerald-500/50 text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Content Body */}
        <div ref={bodyRef} className="p-5 overflow-y-auto space-y-6 flex-1">
          {/* Estado de la conexión con la base de datos */}
          {sponsorsStatus && sponsorsStatus.source !== 'cloud' && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  {sponsorsStatus.source === 'empty'
                    ? 'La base de datos de sponsors está vacía: la lista que ves es solo de respaldo.'
                    : 'No se pudo leer la base de datos: la lista que ves es una copia guardada en este navegador, no la real.'}
                </span>
              </div>
              <p className="text-rose-300/90">
                {sponsorsStatus.source === 'empty'
                  ? 'Tocá "Cargar lugares de los shows" para cargarlos en la nube.'
                  : 'Lo que cargues podría no verse hasta que se restablezca la conexión.'}
                {sponsorsStatus.error ? ` Detalle técnico: ${sponsorsStatus.error}` : ''}
              </p>
            </div>
          )}
          {sponsorsStatus?.source === 'cloud' && !isFormActive && (
            <p className="text-[11px] text-emerald-400/90 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              <span>Conectado a la base de datos en la nube · {sponsors.length} sponsors guardados</span>
            </p>
          )}

          {/* Top toolbar */}
          {!isFormActive && (
            <div className="flex flex-col gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white">Sponsors Registrados ({sponsors.length})</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Tocá un sponsor de la lista para editarlo, probarlo o eliminarlo.
                  </p>
                </div>

                <button
                  type="button"
                  id="btn-admin-add-sponsor"
                  onClick={handleStartCreate}
                  className="flex items-center px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm shadow-md shadow-amber-950/40 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4 mr-1.5 shrink-0" />
                  <span>Cargar Nueva Publicidad</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={handleDownloadTxt}
                  disabled={sponsors.length === 0}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/60 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-40"
                  title="Descarga un archivo .txt con todos los sponsors y su información, como respaldo"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>Descargar TXT</span>
                </button>

                <button
                  type="button"
                  onClick={handleImportVenues}
                  disabled={isImporting}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/60 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                  title="Carga como sponsors los lugares de los shows que todavía no estén cargados (no duplica ninguno)"
                >
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  <span>{isImporting ? 'Cargando lugares...' : 'Cargar lugares de los shows'}</span>
                </button>

                {sponsors.length > 10 && (
                  <div className="relative ml-auto w-full sm:w-56">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar sponsor..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5 pointer-events-none" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Formulario de Alta / Edición */}
          {isFormActive ? (
            <form onSubmit={handleSave} className="space-y-6 bg-slate-950/70 p-5 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>{isCreatingNew ? 'Cargar Nueva Publicidad' : `Editando: ${editingSponsor?.name}`}</span>
                </h3>
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
              </div>

              {/* Selector de Tipo: Solo Texto vs Con Imagen */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  1. ¿Qué tipo de publicidad querés publicar?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: 'text' }))}
                    className={`p-3.5 rounded-xl border flex items-center justify-center gap-2.5 font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                      formData.type === 'text'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-950/30'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Type className="w-4 h-4" />
                    <span>Solo Texto (2 Renglones)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: 'image' }))}
                    className={`p-3.5 rounded-xl border flex items-center justify-center gap-2.5 font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                      formData.type === 'image'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-950/30'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>Con Imagen / Banner Gráfico</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: 'video' }))}
                    className={`p-3.5 rounded-xl border flex items-center justify-center gap-2.5 font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                      formData.type === 'video'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-950/30'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Film className="w-4 h-4" />
                    <span>Con Video</span>
                  </button>
                </div>
              </div>

              {/* Si es con video: URL directa del archivo */}
              {formData.type === 'video' && (
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                  <label className="text-xs font-bold text-slate-300 block">
                    Link directo del video (.mp4 o .webm):
                  </label>
                  <input
                    type="url"
                    placeholder="https://mdqshow.com.ar/ads/mi-video.mp4"
                    value={formData.video || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, video: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                  <p className="text-[11px] text-slate-400">
                    Se reproduce solo, sin sonido y en bucle. Recomendado: video corto (hasta 15 segundos) y liviano (menos de 20 MB).
                  </p>

                  <label className="text-xs font-bold text-slate-300 block pt-1">
                    Imagen de portada (opcional, se ve mientras carga el video):
                  </label>
                  <input
                    type="url"
                    placeholder="https://ejemplo.com/portada.jpg"
                    value={formData.image || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}

              {/* Si es con imagen: subida o URL */}
              {formData.type === 'image' && (
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                  <label className="text-xs font-bold text-slate-300 block">
                    Subir Imagen del Sponsor:
                  </label>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleImageUpload} 
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Subir desde celular / PC</span>
                    </button>

                    <span className="text-xs text-slate-500">o ingresá una URL directa:</span>

                    <input
                      type="url"
                      placeholder="https://ejemplo.com/banner.jpg"
                      value={formData.image || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                      className="flex-1 w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {formData.image && (
                    <div className="relative h-28 w-full max-w-sm rounded-xl overflow-hidden border border-amber-500/40 mt-2">
                      <img 
                        src={formData.image} 
                        alt="Preview" 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Renglones de Información */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>Renglón 1: Nombre del negocio / marca *</span>
                    <span className="text-[10px] text-amber-400 font-semibold uppercase">MAYÚSCULAS</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: BRUTO, HAVANNA, CERVECERÍA ANTARES"
                    value={formData.name || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 font-bold focus:outline-none focus:border-amber-500 uppercase tracking-wider"
                  />
                  <p className="text-[11px] text-slate-400">
                    Se visualiza como título principal con tipografía destacada.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>Renglón 2: Dirección o bajada breve</span>
                    <span className="text-[10px] text-slate-400">DIRECCIÓN O ZONA</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: PLAYA GRANDE, AV. JUAN B. JUSTO 620"
                    value={formData.address || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 font-medium focus:outline-none focus:border-amber-500 uppercase tracking-wide"
                  />
                  <p className="text-[11px] text-slate-400">
                    Ubicación física en Mar del Plata o eslogan breve.
                  </p>
                </div>
              </div>

              {/* Enlace Web / Red Social */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Enlace de destino (Web o Instagram)</span>
                  <span className="text-[10px] text-slate-400">OPCIONAL</span>
                </label>
                <div className="relative">
                  <input
                    type="url"
                    placeholder="https://www.instagram.com/negocio o https://negocio.com.ar"
                    value={formData.link || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                  <ExternalLink className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Opciones de Ubicación: Pop-up de inicio, Los dos primeros, Resto de la página */}
              <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-3">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    ¿Dónde debe mostrarse este sponsor? (Podés marcar una o varias)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {/* Opción 1: Pop-up de inicio */}
                  <label 
                    onClick={() => setFormData(prev => ({ ...prev, showInPopup: !prev.showInPopup }))}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      formData.showInPopup 
                        ? 'bg-amber-500/20 border-amber-500 text-white shadow-xs' 
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="mt-0.5 text-amber-400">
                      {formData.showInPopup ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-amber-300">Pop-up de inicio</span>
                      <span className="block text-[11px] text-slate-400 mt-0.5 leading-tight">
                        Ventana emergente de 5s al abrir la web
                      </span>
                    </div>
                  </label>

                  {/* Opción 2: Los dos primeros de la página */}
                  <label 
                    onClick={() => setFormData(prev => ({ ...prev, showInTopBanner: !prev.showInTopBanner }))}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      formData.showInTopBanner 
                        ? 'bg-amber-500/20 border-amber-500 text-white shadow-xs' 
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="mt-0.5 text-amber-400">
                      {formData.showInTopBanner ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-amber-300">Los dos primeros</span>
                      <span className="block text-[11px] text-slate-400 mt-0.5 leading-tight">
                        Banner superior (solo los que marques acá)
                      </span>
                    </div>
                  </label>

                  {/* Opción 3: Resto de la página */}
                  <label 
                    onClick={() => setFormData(prev => ({ ...prev, showInFeed: !prev.showInFeed }))}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      formData.showInFeed 
                        ? 'bg-amber-500/20 border-amber-500 text-white shadow-xs' 
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="mt-0.5 text-amber-400">
                      {formData.showInFeed ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-amber-300">Resto de la página</span>
                      <span className="block text-[11px] text-slate-400 mt-0.5 leading-tight">
                        Alternando cada 6 recitales en la cartelera
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Configuración de Transición y Efectos para Texto */}
              {formData.type === 'text' && (
                <div className="space-y-3 p-4 bg-slate-900 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Efecto de Transición y Animación Dinámica:</span>
                    </label>
                    <span className="text-[11px] text-emerald-400 font-semibold">
                      El texto nunca queda fijo
                    </span>
                  </div>

                  <select
                    value={formData.effectType || 'random'}
                    onChange={(e) => setFormData(prev => ({ ...prev, effectType: e.target.value as SponsorEffectType }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer font-semibold"
                  >
                    <option value="random">🎲 Al azar (Automática - cambia al azar)</option>
                    <option value="bruto">Bruto (Giro 3D letra por letra + pulso cardíaco en dirección)</option>
                    <option value="abbey-road">Abbey Road (Destello Neón Rock Retro)</option>
                    <option value="bendu">Bendu Arena (Balanceo 3D con resplandor dorado áureo)</option>
                    <option value="arena-mdp">Arena Mar del Plata (Expansión y contracción tracking de letras)</option>
                    <option value="plaza-musica">Plaza de la Música (Pulso rítmico musical ecualizador)</option>
                    <option value="mute">Mute (Ola marina oceánica y destello turquesa)</option>
                    <option value="radio-city">Teatro Radio City (Marquesina teatral Broadway)</option>
                    <option value="cyber-neon">Cyber Neón (Pulso eléctrico cyan y fucsia)</option>
                    <option value="golden-shimmer">Golden Shimmer (Brillo dorado de gala)</option>
                    <option value="retro-bounce">Retro Bounce (Rebote cinético rítmico)</option>
                    <option value="float-glow">Float Glow (Flotación mística con aura)</option>
                  </select>

                  {/* Paleta de colores de fondo */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-semibold text-slate-400 block">
                      Esquema visual de colores:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {PRESET_BACKGROUNDS.map((preset) => {
                        const isSelected = formData.bgColor === preset.bg;
                        return (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                bgColor: preset.bg,
                                textColor: preset.text,
                                subtextColor: preset.subtext
                              }));
                            }}
                            className={`p-2 rounded-xl text-left border text-[11px] font-bold transition-all cursor-pointer ${
                              isSelected
                                ? 'border-amber-400 ring-2 ring-amber-400/30'
                                : 'border-slate-800 hover:border-slate-700'
                            } ${preset.bg}`}
                          >
                            <span className={preset.text}>{preset.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Vista previa en tiempo real */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                  <span>Vista Previa en Vivo:</span>
                </span>
                <div className="max-w-lg mx-auto">
                  <SponsorCard
                    sponsor={{
                      id: 'preview',
                      type: formData.type || 'text',
                      name: formData.name || 'NOMBRE DEL NEGOCIO',
                      address: formData.address || 'DIRECCIÓN O BAJADA',
                      image: formData.image,
                      video: formData.video,
                      link: formData.link,
                      effectType: formData.effectType || 'random',
                      bgColor: formData.bgColor,
                      textColor: formData.textColor,
                      subtextColor: formData.subtextColor,
                    }}
                    heightClass="h-28 sm:h-32"
                    showBadge={false}
                    variant="preview"
                  />
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
                {/* Acciones de un sponsor ya guardado */}
                <div className="flex items-center gap-2">
                  {editingSponsor && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleTestPopup(editingSponsor.id)}
                        className="flex items-center gap-1 px-3 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold cursor-pointer"
                        title="Probar cómo se ve la versión guardada de este sponsor en el popup de inicio"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Probar Popup</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(editingSponsor.id, editingSponsor.name)}
                        className="flex items-center gap-1 px-3 py-2.5 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/30 text-xs font-bold cursor-pointer"
                        title="Eliminar este sponsor"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Eliminar</span>
                      </button>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm shadow-md shadow-amber-950/40 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'Guardando en la nube...' : isCreatingNew ? 'Guardar y Publicar' : 'Actualizar Sponsor'}
                </button>
                </div>
              </div>
            </form>
          ) : (
            /* Lista de Sponsors existentes */
            <div className="space-y-4">
              {sponsors.length === 0 ? (
                <div className="text-center py-12 bg-slate-950/50 rounded-2xl border border-slate-800 p-6 space-y-3">
                  <Megaphone className="w-10 h-10 text-slate-600 mx-auto" />
                  <h4 className="text-sm font-bold text-white">No hay sponsors cargados todavía</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Cargá el primer sponsor para comenzar a monetizar y mostrar marcas locales.
                  </p>
                  <button
                    type="button"
                    onClick={handleStartCreate}
                    className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-black"
                  >
                    Crear Primer Sponsor
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Operativos */}
                  <div className="space-y-2">
                    <span className="text-slate-400 font-medium text-xs">
                      Sponsors operativos ({activeSponsors.length}):
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {activeSponsors.map((sponsor) => (
                        <button
                          key={sponsor.id}
                          type="button"
                          onClick={() => handleStartEdit(sponsor)}
                          title={describePlaces(sponsor)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer bg-slate-800/90 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/60 hover:border-amber-500/60"
                        >
                          {sponsor.name}
                        </button>
                      ))}
                      {activeSponsors.length === 0 && (
                        <span className="text-xs text-slate-500">
                          {normalizedSearch ? 'Ningún sponsor coincide con la búsqueda.' : 'No hay sponsors operativos.'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Pausados */}
                  {pausedSponsors.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-slate-500 font-medium text-xs">
                        Pausados, no se muestran en la web ({pausedSponsors.length}):
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        {pausedSponsors.map((sponsor) => (
                          <button
                            key={sponsor.id}
                            type="button"
                            onClick={() => handleStartEdit(sponsor)}
                            title={describePlaces(sponsor)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer bg-slate-900 text-slate-500 hover:text-slate-300 border border-dashed border-slate-700 hover:border-slate-500"
                          >
                            {sponsor.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
