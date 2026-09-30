import React from 'react';
import { ExternalLink, Sparkles } from 'lucide-react';

export interface SponsorAd {
  id: string;
  title: string;
  location: string;
  tag?: string;
  desc?: string;
  bgColor: string;
  textColor: string;
  subtextColor: string;
  tagBg: string;
  tagBorder: string;
  tagText: string;
  link: string;
  customStyle?: React.CSSProperties;
}

/**
 * Sponsors locales iniciales con diseño tipográfico y estético de alta gama.
 * 1. BRUTO: Fondo negro azabache, tipografía bold blanca imponente, "Playa Grande" abajo con sutileza.
 * 2. SURF COFFEE: Fondo azul/celeste característico (azul océano #0B3B60 o celeste surfer #227093 / #38769E), 
 *    letras blancas gruesas limpias y "Avellaneda 1387" abajo.
 */
export const LOCAL_SPONSORS: SponsorAd[] = [
  {
    id: 'bruto',
    title: 'BRUTO',
    location: 'Playa Grande',
    tag: 'Playa Grande',
    desc: 'La previa, tragos y noche frente al mar.',
    bgColor: 'bg-black',
    textColor: 'text-white',
    subtextColor: 'text-zinc-400',
    tagBg: 'bg-zinc-900/90',
    tagBorder: 'border-zinc-700/60',
    tagText: 'text-zinc-300',
    link: 'https://www.instagram.com/bruto.playagrande'
  },
  {
    id: 'surfcoffee',
    title: 'SURF COFFEE',
    location: 'Avellaneda 1387',
    tag: 'Café & Bakery',
    desc: 'Specialty coffee & surf vibes en Mar del Plata.',
    bgColor: 'bg-[#1b4965]', // Azul océano profundo surfer característico de la marca
    textColor: 'text-white',
    subtextColor: 'text-sky-200',
    tagBg: 'bg-[#133347]/90',
    tagBorder: 'border-sky-500/40',
    tagText: 'text-sky-200',
    link: 'https://www.instagram.com/surfcoffee'
  }
];

interface AdSenseBannerProps {
  format?: 'horizontal' | 'in-feed' | 'timeline-double';
  className?: string;
  initialOffset?: number;
}

export const AdSenseBanner: React.FC<AdSenseBannerProps> = ({
  format = 'in-feed',
  className = '',
  initialOffset = 0
}) => {
  // Las publicidades se fijan para la sesión/visita actual:
  // Se eligen de forma determinista o aleatoria por carga de página (sin rotar cada 10s mientras el usuario navega)
  const topAd = LOCAL_SPONSORS[initialOffset % LOCAL_SPONSORS.length];
  const bottomAd = LOCAL_SPONSORS[(initialOffset + 1) % LOCAL_SPONSORS.length];

  // Render individual card con estética tipográfica limpia
  const renderAdCard = (ad: SponsorAd, heightClass: string) => {
    return (
      <a
        href={ad.link}
        target="_blank"
        rel="noopener noreferrer"
        className={`relative ${heightClass} rounded-2xl overflow-hidden transition-all duration-300 group block cursor-pointer select-none ${ad.bgColor} hover:scale-[1.01]`}
        style={{
          border: '1.5px solid rgba(245, 158, 11, 0.85)',
          boxShadow: '0 0 14px -2px rgba(245, 158, 11, 0.35)'
        }}
        title={`${ad.title} — ${ad.location} (Clic para visitar)`}
      >
        {/* Textura sutil y sutil viñeta para efecto visual de alta gama */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />

        {/* Badge superior derecho de Sponsor */}
        <div className="absolute top-3 right-3 z-10">
          <span 
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md ${ad.tagBg} border ${ad.tagBorder} text-[9px] font-black ${ad.tagText} uppercase tracking-wider backdrop-blur-md shadow-xs`}
          >
            <Sparkles className="w-2.5 h-2.5 text-amber-400" />
            <span>Sponsor</span>
          </span>
        </div>

        {/* Contenido tipográfico centrado con impacto estético */}
        <div className="absolute inset-0 p-4 sm:p-5 flex flex-col items-center justify-center text-center z-10 transition-transform duration-300 group-hover:scale-105">
          <h3 className={`text-2xl sm:text-3xl font-black ${ad.textColor} tracking-wider uppercase font-sans drop-shadow-md`}>
            {ad.title}
          </h3>
          <p className={`text-xs sm:text-sm font-semibold ${ad.subtextColor} tracking-widest uppercase mt-1 drop-shadow-sm`}>
            {ad.location}
          </p>
          <div className="mt-3 flex items-center gap-1 text-[11px] font-medium text-amber-300 opacity-80 group-hover:opacity-100 transition-opacity">
            <span>Visitar perfil</span>
            <ExternalLink className="w-3 h-3 ml-0.5" />
          </div>
        </div>
      </a>
    );
  };

  // Formato In-Feed (2 cuadraditos apilados en la grilla de recitales)
  if (format === 'in-feed') {
    return (
      <aside 
        aria-label="Espacio publicitario de sponsors locales"
        className={`h-full min-h-[480px] flex flex-col justify-between gap-4 ${className}`}
      >
        <div className="flex-1 flex flex-col">
          {renderAdCard(topAd, 'h-full min-h-[220px]')}
        </div>
        <div className="flex-1 flex flex-col">
          {renderAdCard(bottomAd, 'h-full min-h-[220px]')}
        </div>
      </aside>
    );
  }

  // Formato Timeline Double (lado a lado en el cronograma)
  if (format === 'timeline-double') {
    return (
      <aside 
        aria-label="Espacio publicitario de sponsors locales en cronograma"
        className={`w-full my-3 grid grid-cols-1 sm:grid-cols-2 gap-3.5 ${className}`}
      >
        {renderAdCard(topAd, 'h-32 sm:h-36')}
        {renderAdCard(bottomAd, 'h-32 sm:h-36')}
      </aside>
    );
  }

  // Formato Horizontal (banner completo)
  return (
    <aside 
      aria-label="Espacio publicitario de sponsors locales"
      className={`w-full my-4 ${className}`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {renderAdCard(topAd, 'h-28 sm:h-32')}
        {renderAdCard(bottomAd, 'h-28 sm:h-32')}
      </div>
    </aside>
  );
};
