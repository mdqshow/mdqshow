import React, { useState } from 'react';
import { 
  BarChart3, 
  MousePointerClick, 
  Users, 
  ExternalLink, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  X, 
  Download, 
  Check, 
  Copy,
  Ticket,
  Search,
  Sparkles,
  Heart,
  MessageCircle,
  Eye,
  Megaphone
} from 'lucide-react';
import { Show, Sponsor } from '../types';
import { ShowMetrics, BannerMetrics } from '../services/metricsService';
import { Subscriber } from '../services/subscribersService';
import { VENUE_SPONSORS } from './AdSenseBanner';

interface AdminMetricsModalProps {
  isOpen: boolean;
  onClose: () => void;
  shows: Show[];
  metricsMap: Record<string, ShowMetrics>;
  bannerMetricsMap: Record<string, BannerMetrics>;
  subscribers: Subscriber[];
  sponsors?: Sponsor[];
}

export const AdminMetricsModal: React.FC<AdminMetricsModalProps> = ({
  isOpen,
  onClose,
  shows,
  metricsMap,
  bannerMetricsMap,
  subscribers,
  sponsors,
}) => {
  const [activeTab, setActiveTab] = useState<'shows' | 'banners'>('shows');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedReport, setCopiedReport] = useState(false);

  if (!isOpen) return null;

  // Combinar shows con sus métricas
  const showsWithMetrics = shows.map((show) => {
    const metric = metricsMap[show.id] || {
      showId: show.id,
      ticketClicks: 0,
      shares: 0,
      favoritesCount: 0,
    };
    return {
      show,
      ticketClicks: metric.ticketClicks,
      shares: metric.shares,
      favoritesCount: metric.favoritesCount,
    };
  });

  // Ordenar shows por cantidad de clicks descendente (ranking comercial)
  const sortedByClicks = [...showsWithMetrics].sort((a, b) => b.ticketClicks - a.ticketClicks);

  // Estadísticas globales de shows
  const totalClicks = showsWithMetrics.reduce((acc, curr) => acc + curr.ticketClicks, 0);
  const totalShares = showsWithMetrics.reduce((acc, curr) => acc + curr.shares, 0);
  const totalFavorites = showsWithMetrics.reduce((acc, curr) => acc + curr.favoritesCount, 0);
  const activeShowsCount = shows.length;
  const totalSubscribersCount = subscribers.length;

  // Combinar banners y sponsors con sus métricas de impresiones y clicks
  const sponsorPool = (sponsors && sponsors.length > 0) ? sponsors : VENUE_SPONSORS;
  const venueBannersWithMetrics = sponsorPool.map((venue) => {
    const m = bannerMetricsMap[venue.id] || {
      venueId: venue.id,
      venueName: venue.name,
      venueAddress: venue.address || '',
      impressions: 0,
      clicks: 0,
    };
    return {
      venue,
      impressions: m.impressions,
      clicks: m.clicks,
      lastImpressionAt: m.lastImpressionAt,
    };
  }).sort((a, b) => b.impressions - a.impressions);

  const totalBannerImpressions = venueBannersWithMetrics.reduce((acc, curr) => acc + curr.impressions, 0);
  const totalBannerClicks = venueBannersWithMetrics.reduce((acc, curr) => acc + curr.clicks, 0);

  // Filtrado por buscador
  const filteredShowsList = sortedByClicks.filter((item) =>
    item.show.band.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.show.venue.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBannersList = venueBannersWithMetrics.filter((item) =>
    item.venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.venue.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Generar reporte de métricas en texto para copiar o enviar a productores y auspiciantes
  const generateProducerReport = () => {
    const lines: string[] = [];
    lines.push('====================================================');
    lines.push('MDQSHOW - REPORTE DE MÉTRICAS Y PERFORMANCE');
    lines.push(`Fecha: ${new Date().toLocaleDateString('es-AR')} ${new Date().toLocaleTimeString('es-AR')}`);
    lines.push(`Total Clicks a Boleterías Oficiales: ${totalClicks}`);
    lines.push(`Total Compartidos por WhatsApp: ${totalShares}`);
    lines.push(`Suscriptores al Newsletter: ${totalSubscribersCount}`);
    lines.push(`Total Impresiones/Publicaciones de Banners: ${totalBannerImpressions}`);
    lines.push('====================================================\n');

    lines.push('1. MÉTRICAS DE BANNERS (TEATROS Y ESTADIOS):');
    venueBannersWithMetrics.forEach((item, idx) => {
      lines.push(`${idx + 1}. ${item.venue.name} - ${item.venue.address}`);
      lines.push(`   - Impresiones (veces publicado en pantalla): ${item.impressions}`);
      lines.push(`   - Clics al Instagram/Sitio Oficial: ${item.clicks}`);
      lines.push('----------------------------------------------------');
    });

    lines.push('\n2. RANKING DE RECITALES POR INTERÉS (CLICKS A COMPRA):');
    sortedByClicks.slice(0, 15).forEach((item, idx) => {
      lines.push(`${idx + 1}. ${item.show.band} (${item.show.venue})`);
      lines.push(`   - Clicks en entradas: ${item.ticketClicks}`);
      lines.push(`   - Compartidos por WhatsApp: ${item.shares}`);
      lines.push(`   - Guardado en Favoritos: ${item.favoritesCount}`);
      lines.push(`   - Ticketera: ${item.show.ticketPortalName}`);
      lines.push('----------------------------------------------------');
    });

    return lines.join('\n');
  };

  const handleCopyReport = async () => {
    try {
      const text = generateProducerReport();
      await navigator.clipboard.writeText(text);
      setCopiedReport(true);
      setTimeout(() => setCopiedReport(false), 2500);
    } catch {
      // ignore
    }
  };

  const handleDownloadTxtReport = () => {
    const text = generateProducerReport();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mdqshow_reporte_metricas_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-4xl max-h-[92vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Panel de Métricas Comerciales
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                  Firebase Realtime
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Trackeo en vivo de shows, entradas y publicaciones de banners de teatros/estadios
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 p-3 sm:p-4 border-b border-slate-800/80 bg-slate-950/30">
          {/* Publicaciones de Banners */}
          <div className="bg-slate-900/90 border border-amber-500/40 rounded-xl p-2.5 shadow-sm col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-amber-400 text-xs font-semibold mb-0.5">
              <span>Banners Publi</span>
              <Eye className="w-3.5 h-3.5" />
            </div>
            <p className="text-lg sm:text-xl font-black text-amber-300">{totalBannerImpressions}</p>
            <p className="text-[9px] text-slate-400 mt-0.5">Veces publicados</p>
          </div>

          {/* Clicks en Entradas */}
          <div className="bg-slate-900/90 border border-emerald-500/30 rounded-xl p-2.5 shadow-sm">
            <div className="flex items-center justify-between text-emerald-400 text-xs font-semibold mb-0.5">
              <span>Clicks Tickets</span>
              <MousePointerClick className="w-3.5 h-3.5" />
            </div>
            <p className="text-lg sm:text-xl font-black text-white">{totalClicks}</p>
            <p className="text-[9px] text-slate-400 mt-0.5">En "Comprar"</p>
          </div>

          {/* Compartidos WhatsApp */}
          <div className="bg-slate-900/90 border border-emerald-500/30 rounded-xl p-2.5 shadow-sm">
            <div className="flex items-center justify-between text-emerald-400 text-xs font-semibold mb-0.5">
              <span>Compartidos</span>
              <MessageCircle className="w-3.5 h-3.5" />
            </div>
            <p className="text-lg sm:text-xl font-black text-white">{totalShares}</p>
            <p className="text-[9px] text-slate-400 mt-0.5">WhatsApp</p>
          </div>

          {/* Suscriptores Newsletter */}
          <div className="bg-slate-900/90 border border-amber-500/30 rounded-xl p-2.5 shadow-sm">
            <div className="flex items-center justify-between text-amber-400 text-xs font-semibold mb-0.5">
              <span>Suscriptores</span>
              <Users className="w-3.5 h-3.5" />
            </div>
            <p className="text-lg sm:text-xl font-black text-white">{totalSubscribersCount}</p>
            <p className="text-[9px] text-slate-400 mt-0.5">Newsletter</p>
          </div>

          {/* Recitales en Cartelera */}
          <div className="bg-slate-900/90 border border-sky-500/30 rounded-xl p-2.5 shadow-sm">
            <div className="flex items-center justify-between text-sky-400 text-xs font-semibold mb-0.5">
              <span>Recitales</span>
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <p className="text-lg sm:text-xl font-black text-white">{activeShowsCount}</p>
            <p className="text-[9px] text-slate-400 mt-0.5">Cartelera</p>
          </div>

          {/* Favoritos */}
          <div className="bg-slate-900/90 border border-rose-500/30 rounded-xl p-2.5 shadow-sm">
            <div className="flex items-center justify-between text-rose-400 text-xs font-semibold mb-0.5">
              <span>Guardados</span>
              <Heart className="w-3.5 h-3.5" />
            </div>
            <p className="text-lg sm:text-xl font-black text-white">{totalFavorites}</p>
            <p className="text-[9px] text-slate-400 mt-0.5">Favoritos</p>
          </div>
        </div>

        {/* Tabs de Selección */}
        <div className="px-5 pt-3 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('shows')}
              className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'shows'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Ticket className="w-4 h-4" />
              Recitales y Tickets ({shows.length})
            </button>
            <button
              onClick={() => setActiveTab('banners')}
              className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'banners'
                  ? 'border-amber-500 text-amber-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Megaphone className="w-4 h-4" />
              Publicaciones de Banners ({VENUE_SPONSORS.length} Lugares)
            </button>
          </div>

          <div className="flex items-center space-x-2 pb-2">
            <button
              onClick={handleCopyReport}
              className="flex items-center px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
              title="Copiar reporte al portapapeles"
            >
              {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-400 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
              {copiedReport ? '¡Copiado!' : 'Copiar Reporte'}
            </button>
            <button
              onClick={handleDownloadTxtReport}
              className="flex items-center px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors cursor-pointer"
              title="Descargar reporte en TXT"
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              Descargar TXT
            </button>
          </div>
        </div>

        {/* Table & Search */}
        <div className="p-4 sm:p-5 flex-1 overflow-hidden flex flex-col space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={activeTab === 'shows' ? "Buscar show en la tabla de métricas..." : "Buscar teatro / estadio..."}
                className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <span className="text-xs text-slate-400 shrink-0">
              {activeTab === 'shows' ? `${filteredShowsList.length} recitales` : `${filteredBannersList.length} lugares`}
            </span>
          </div>

          {/* Table: Shows */}
          {activeTab === 'shows' && (
            <div className="flex-1 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/50">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                  <tr>
                    <th className="py-3 px-4"># Posición</th>
                    <th className="py-3 px-4">Banda / Show</th>
                    <th className="py-3 px-4">Lugar</th>
                    <th className="py-3 px-4 text-center">Ticketera</th>
                    <th className="py-3 px-4 text-right text-emerald-400">Clicks Tickets</th>
                    <th className="py-3 px-4 text-right text-emerald-400">WhatsApp</th>
                    <th className="py-3 px-4 text-right text-rose-400">Favoritos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-300">
                  {filteredShowsList.map((item, index) => (
                    <tr key={item.show.id} className="hover:bg-slate-900/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-500">
                        {index === 0 && <span className="text-amber-400 mr-1">🥇</span>}
                        {index === 1 && <span className="text-slate-300 mr-1">🥈</span>}
                        {index === 2 && <span className="text-amber-600 mr-1">🥉</span>}
                        #{index + 1}
                      </td>
                      <td className="py-3 px-4 font-bold text-white">
                        {item.show.band}
                        {item.show.tourName && (
                          <p className="text-[11px] font-normal text-slate-400">{item.show.tourName}</p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {item.show.venue}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[11px] text-slate-300">
                          {item.show.ticketPortalName}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-emerald-400">
                        {item.ticketClicks}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-400">
                        {item.shares}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-rose-400">
                        {item.favoritesCount}
                      </td>
                    </tr>
                  ))}

                  {filteredShowsList.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                        No se encontraron recitales con ese criterio.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Table: Banners (Impresiones y Clics por Teatro/Lugar) */}
          {activeTab === 'banners' && (
            <div className="flex-1 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/50">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                  <tr>
                    <th className="py-3 px-4"># Posición</th>
                    <th className="py-3 px-4">Espacio / Teatro</th>
                    <th className="py-3 px-4">Dirección</th>
                    <th className="py-3 px-4 text-center">Instagram / Web</th>
                    <th className="py-3 px-4 text-right text-amber-300">Veces Publicado</th>
                    <th className="py-3 px-4 text-right text-emerald-400">Clicks al Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-300">
                  {filteredBannersList.map((item, index) => (
                    <tr key={item.venue.id} className="hover:bg-slate-900/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-500">
                        {index === 0 && <span className="text-amber-400 mr-1">🥇</span>}
                        {index === 1 && <span className="text-slate-300 mr-1">🥈</span>}
                        {index === 2 && <span className="text-amber-600 mr-1">🥉</span>}
                        #{index + 1}
                      </td>
                      <td className="py-3 px-4 font-bold text-white uppercase tracking-wider">
                        {item.venue.name}
                      </td>
                      <td className="py-3 px-4 text-slate-300 text-xs">
                        {item.venue.address}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <a 
                          href={item.venue.link} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="inline-flex items-center text-xs text-sky-400 hover:text-sky-300 hover:underline"
                        >
                          Instagram
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-amber-300 text-sm">
                        {item.impressions}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-emerald-400 text-sm">
                        {item.clicks}
                      </td>
                    </tr>
                  ))}

                  {filteredBannersList.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                        No se encontraron lugares con ese criterio.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>Los contadores de impresiones y clicks se actualizan en vivo en Firebase con cada rotación de banner.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
