import React from 'react';

export interface SponsorAd {
  id: string;
  title: string;
  location: string;
  bgColor: string;
  textColor: string;
  subtextColor: string;
  link: string;
  titleSizeClass: string;
  locationSizeClass: string;
}

/**
 * Sponsors locales:
 * - Título con giro 3D LETRA POR LETRA despacio, se queda 5 segundos fijo y vuelve a girar.
 * - Ubicación abajo con zoom/latido esporádico (no constante) y reposo.
 * - Tarjeta 100% limpia, sin badges ni textos feos de "sponsor" ni "visitar perfil".
 * - Toda la tarjeta es un enlace directo con clic.
 */
export const LOCAL_SPONSORS: SponsorAd[] = [
  {
    id: 'bruto',
    title: 'BRUTO',
    location: 'PLAYA GRANDE',
    bgColor: 'bg-black',
    textColor: 'text-white',
    subtextColor: 'text-zinc-300 font-bold',
    link: 'https://www.instagram.com/bruto.playagrande',
    titleSizeClass: 'text-4xl sm:text-5xl lg:text-6xl font-black tracking-widest',
    locationSizeClass: 'text-sm sm:text-base font-extrabold tracking-[0.25em]'
  },
  {
    id: 'surfcoffee',
    title: 'SURF COFFEE',
    location: 'AVELLANEDA 1387',
    bgColor: 'bg-[#1b4965]', // Azul océano profundo surfer característico
    textColor: 'text-white',
    subtextColor: 'text-sky-200 font-bold',
    link: 'https://www.instagram.com/surfcoffee',
    titleSizeClass: 'text-3xl sm:text-4xl lg:text-5xl font-black tracking-wide',
    locationSizeClass: 'text-sm sm:text-base font-extrabold tracking-[0.2em]'
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
  // Las publicidades se fijan para la sesión actual
  const topAd = LOCAL_SPONSORS[initialOffset % LOCAL_SPONSORS.length];
  const bottomAd = LOCAL_SPONSORS[(initialOffset + 1) % LOCAL_SPONSORS.length];

  // Render individual card con giro letra por letra y link directo
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
        {/* Textura sutil y viñeta de fondo */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />

        {/* Contenido tipográfico centrado, limpio (sin badge de sponsor) */}
        <div className="absolute inset-0 p-5 flex flex-col items-center justify-center text-center z-10">
          <div className="flex flex-col items-center justify-center transition-transform duration-300 group-hover:scale-105">
            
            {/* Título: Gira letra por letra despacio en 3D, y se queda 5 segundos quieto */}
            <h3 className={`${ad.titleSizeClass} ${ad.textColor} uppercase font-sans drop-shadow-lg leading-tight select-none`}>
              {ad.title.split('').map((char, index) => {
                if (char === ' ') {
                  return <span key={index} className="inline-block w-3 sm:w-4">&nbsp;</span>;
                }
                return (
                  <span
                    key={index}
                    className="animate-sponsor-letter"
                    style={{
                      animationDelay: `${index * 0.12}s`
                    }}
                  >
                    {char}
                  </span>
                );
              })}
            </h3>
            
            {/* Ubicación: Zoom rítmico estilo latido esporádico (no constante) y reposo */}
            <div className="animate-sponsor-location mt-2.5">
              <p className={`${ad.locationSizeClass} ${ad.subtextColor} uppercase drop-shadow-md`}>
                {ad.location}
              </p>
            </div>
          </div>
        </div>
      </a>
    );
  };

  // Formato In-Feed (2 cuadraditos apilados en la grilla de recitales)
  if (format === 'in-feed') {
    return (
      <aside 
        aria-label="Espacio publicitario"
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
        aria-label="Espacio publicitario en cronograma"
        className={`w-full my-3 grid grid-cols-1 sm:grid-cols-2 gap-3.5 ${className}`}
      >
        {renderAdCard(topAd, 'h-36 sm:h-40')}
        {renderAdCard(bottomAd, 'h-36 sm:h-40')}
      </aside>
    );
  }

  // Formato Horizontal
  return (
    <aside 
      aria-label="Espacio publicitario"
      className={`w-full my-4 ${className}`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {renderAdCard(topAd, 'h-32 sm:h-36')}
        {renderAdCard(bottomAd, 'h-32 sm:h-36')}
      </div>
    </aside>
  );
};
