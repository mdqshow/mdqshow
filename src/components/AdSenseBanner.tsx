import React, { useState, useEffect } from 'react';

export interface SponsorAd {
  id: string;
  title: string;
  line1?: string;
  line2?: string;
  location?: string;
  bgColor: string;
  textColor: string;
  subtextColor?: string;
  link: string;
  titleSizeClass: string;
  locationSizeClass?: string;
  effectType: 'bruto' | 'surf' | 'bendu' | 'arena-mdp' | 'plaza-musica' | 'abbey-road';
}

/**
 * 1. BANNERS SUPERIORES (Top / Iniciales - únicos fijos):
 *    - BRUTO (Fondo negro, giro 3D letra por letra, PLAYA GRANDE latido esporádico)
 *    - SURF COFFEE (Fondo azul océano, "SURF" desde la izquierda, "COFFEE" desde la derecha, AVELLANEDA 1387 esfumada)
 * 
 * 2. BANNERS DE SALAS / TEATROS (Rotan cada 10 segundos con transición suave de esfumado fade-in/out):
 *    - BENDU ARENA: Fondo índigo/dorado noche, Tilt 3D elegante con resplandor oro/ámbar.
 *    - ARENA MAR DEL PLATA: Fondo azul marino/celeste cielo, Expansión de onda horizontal.
 *    - PLAZA DE LA MÚSICA: Fondo rojo carmesí / borgoña oscuro, Pulso rítmico musical en dos fases.
 *    - ABBEY ROAD: Fondo negro / ámbar neón rock, Destello neón retro de concierto en dos renglones.
 */

// Los 2 principales fijos SOLO arriba
export const TOP_SPONSORS: SponsorAd[] = [
  {
    id: 'bruto',
    title: 'BRUTO',
    location: 'PLAYA GRANDE',
    bgColor: 'bg-black',
    textColor: 'text-white',
    subtextColor: 'text-zinc-300 font-bold',
    link: 'https://www.instagram.com/bruto.playagrande',
    titleSizeClass: 'text-3xl sm:text-4xl lg:text-5xl font-black tracking-widest',
    locationSizeClass: 'text-xs sm:text-sm font-extrabold tracking-[0.25em]',
    effectType: 'bruto'
  },
  {
    id: 'surfcoffee',
    title: 'SURF COFFEE',
    location: 'AVELLANEDA 1387',
    bgColor: 'bg-[#1b4965]',
    textColor: 'text-white',
    subtextColor: 'text-sky-200 font-bold',
    link: 'https://www.instagram.com/surfcoffee',
    titleSizeClass: 'text-2xl sm:text-3xl lg:text-4xl font-black tracking-wide',
    locationSizeClass: 'text-xs sm:text-sm font-extrabold tracking-[0.2em]',
    effectType: 'surf'
  }
];

// Los 4 teatros y salas para rotar cada 10 segundos
export const VENUE_SPONSORS: SponsorAd[] = [
  {
    id: 'bendu',
    title: 'BENDU ARENA',
    line1: 'ARENA',
    line2: 'BENDU',
    bgColor: 'bg-gradient-to-br from-[#180e29] via-[#0f071a] to-[#24123d]',
    textColor: 'text-amber-300',
    link: 'https://www.instagram.com/benduarena',
    titleSizeClass: 'text-2xl sm:text-3xl lg:text-4xl font-black tracking-widest',
    effectType: 'bendu'
  },
  {
    id: 'arena-mdp',
    title: 'ARENA MDP',
    line1: 'ARENA',
    line2: 'MAR DEL PLATA',
    bgColor: 'bg-gradient-to-br from-[#071c30] via-[#0c2e4e] to-[#041221]',
    textColor: 'text-cyan-200',
    link: 'https://www.instagram.com/arenamardelplata',
    titleSizeClass: 'text-2xl sm:text-3xl lg:text-4xl font-black tracking-widest',
    effectType: 'arena-mdp'
  },
  {
    id: 'plaza-musica',
    title: 'PLAZA DE LA MÚSICA',
    line1: 'PLAZA DE LA',
    line2: 'MÚSICA',
    bgColor: 'bg-gradient-to-br from-[#2a0813] via-[#1a050c] to-[#3b0d1b]',
    textColor: 'text-rose-200',
    link: 'https://www.instagram.com/plazadelamusica',
    titleSizeClass: 'text-xl sm:text-2xl lg:text-3xl font-black tracking-wider',
    effectType: 'plaza-musica'
  },
  {
    id: 'abbey-road',
    title: 'ABBEY ROAD',
    line1: 'ABBEY',
    line2: 'ROAD',
    bgColor: 'bg-gradient-to-br from-[#121214] via-[#1c1917] to-[#0c0a09]',
    textColor: 'text-amber-400',
    link: 'https://www.instagram.com/abbeyroadmdq',
    titleSizeClass: 'text-2xl sm:text-3xl lg:text-4xl font-black tracking-widest',
    effectType: 'abbey-road'
  }
];

interface AdSenseBannerProps {
  format?: 'horizontal' | 'in-feed' | 'timeline-double';
  className?: string;
  initialOffset?: number;
  isTopBanner?: boolean;
}

export const AdSenseBanner: React.FC<AdSenseBannerProps> = ({
  format = 'in-feed',
  className = '',
  initialOffset = 0,
  isTopBanner = false
}) => {
  // Rotación suave de salas cada 10 segundos para banners que NO son los superiores
  const [rotationIndex, setRotationIndex] = useState(initialOffset);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    if (isTopBanner) return; // BRUTO y SURF COFFEE se mantienen fijos arriba

    const interval = setInterval(() => {
      // Iniciar desvanecimiento (fade-out)
      setIsFading(true);
      setTimeout(() => {
        setRotationIndex((prev) => (prev + 2) % VENUE_SPONSORS.length);
        // Regresar a visible (fade-in)
        setIsFading(false);
      }, 500); // 500ms de transición de esfumado
    }, 10000); // Cada 10 segundos

    return () => clearInterval(interval);
  }, [isTopBanner]);

  // Selección de los dos avisos a mostrar
  const firstAd = isTopBanner
    ? TOP_SPONSORS[0]
    : VENUE_SPONSORS[rotationIndex % VENUE_SPONSORS.length];

  const secondAd = isTopBanner
    ? TOP_SPONSORS[1]
    : VENUE_SPONSORS[(rotationIndex + 1) % VENUE_SPONSORS.length];

  // Render individual card según el efecto configurado
  const renderAdCard = (ad: SponsorAd, heightClass: string) => {
    return (
      <a
        href={ad.link}
        target="_blank"
        rel="noopener noreferrer"
        className={`relative ${heightClass} rounded-2xl overflow-hidden transition-all duration-500 group block cursor-pointer select-none ${ad.bgColor} hover:scale-[1.01] ${
          isFading ? 'opacity-0 scale-[0.98]' : 'opacity-100 scale-100'
        }`}
        style={{
          border: '1.5px solid rgba(245, 158, 11, 0.85)',
          boxShadow: '0 0 14px -2px rgba(245, 158, 11, 0.35)'
        }}
        title={`${ad.title}${ad.location ? ` — ${ad.location}` : ''} (Clic para visitar)`}
      >
        {/* Textura sutil y viñeta de fondo */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />

        {/* Contenido tipográfico centrado */}
        <div className="absolute inset-0 p-3 sm:p-4 flex flex-col items-center justify-center text-center z-10 overflow-hidden">
          <div className="flex flex-col items-center justify-center transition-transform duration-300 group-hover:scale-105 w-full">
            
            {/* CASO 1: SURF COFFEE */}
            {ad.effectType === 'surf' && (
              <>
                <h3 className={`${ad.titleSizeClass} ${ad.textColor} uppercase font-sans drop-shadow-lg leading-tight select-none flex items-center justify-center gap-2 sm:gap-3 flex-wrap`}>
                  <span className="animate-surf-slide-left">SURF</span>
                  <span className="animate-coffee-slide-right">COFFEE</span>
                </h3>
                
                {ad.location && (
                  <div className="animate-surf-address mt-2">
                    <p className={`${ad.locationSizeClass} ${ad.subtextColor} uppercase drop-shadow-md`}>
                      {ad.location}
                    </p>
                  </div>
                )}
              </>
            )}

            {/* CASO 2: BRUTO */}
            {ad.effectType === 'bruto' && (
              <>
                <h3 className={`${ad.titleSizeClass} ${ad.textColor} uppercase font-sans drop-shadow-lg leading-tight select-none`}>
                  {ad.title.split('').map((char, index) => (
                    <span
                      key={index}
                      className="animate-bruto-letter"
                      style={{ animationDelay: `${index * 0.12}s` }}
                    >
                      {char}
                    </span>
                  ))}
                </h3>
                
                {ad.location && (
                  <div className="animate-bruto-location mt-2">
                    <p className={`${ad.locationSizeClass} ${ad.subtextColor} uppercase drop-shadow-md`}>
                      {ad.location}
                    </p>
                  </div>
                )}
              </>
            )}

            {/* CASO 3: BENDU ARENA (Tilt 3D dorado) */}
            {ad.effectType === 'bendu' && (
              <div className="animate-bendu flex flex-col items-center leading-tight">
                <span className={`${ad.titleSizeClass} text-amber-400/90 font-black drop-shadow-md`}>
                  {ad.line1}
                </span>
                <span className={`${ad.titleSizeClass} text-amber-300 font-black tracking-widest drop-shadow-lg -mt-1`}>
                  {ad.line2}
                </span>
              </div>
            )}

            {/* CASO 4: ARENA MAR DEL PLATA (Expansión horizontal de onda) */}
            {ad.effectType === 'arena-mdp' && (
              <div className="animate-arena-mdp flex flex-col items-center leading-tight">
                <span className={`${ad.titleSizeClass} text-sky-300 font-black drop-shadow-md`}>
                  {ad.line1}
                </span>
                <span className="text-sm sm:text-base lg:text-lg font-black tracking-[0.25em] text-white/90 drop-shadow-lg mt-0.5">
                  {ad.line2}
                </span>
              </div>
            )}

            {/* CASO 5: PLAZA DE LA MÚSICA (Pulso rítmico musical) */}
            {ad.effectType === 'plaza-musica' && (
              <div className="animate-plaza-musica flex flex-col items-center leading-tight">
                <span className="text-xs sm:text-sm font-extrabold tracking-[0.25em] text-rose-300/90 drop-shadow-sm uppercase">
                  {ad.line1}
                </span>
                <span className={`${ad.titleSizeClass} text-rose-100 font-black tracking-wider drop-shadow-lg mt-0.5 uppercase`}>
                  {ad.line2}
                </span>
              </div>
            )}

            {/* CASO 6: ABBEY ROAD (Destello neón rock retro en dos renglones) */}
            {ad.effectType === 'abbey-road' && (
              <div className="animate-abbey-road flex flex-col items-center leading-tight">
                <span className={`${ad.titleSizeClass} text-amber-400 font-black tracking-widest drop-shadow-md`}>
                  {ad.line1}
                </span>
                <span className={`${ad.titleSizeClass} text-orange-400 font-black tracking-[0.2em] drop-shadow-lg -mt-1`}>
                  {ad.line2}
                </span>
              </div>
            )}

          </div>
        </div>
      </a>
    );
  };

  // Formato In-Feed o Doble horizontal (siempre a lo ancho: 2 columnas limpias lado a lado)
  return (
    <aside 
      aria-label="Espacio publicitario"
      className={`w-full my-6 ${className}`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {renderAdCard(firstAd, 'h-28 sm:h-32')}
        {renderAdCard(secondAd, 'h-28 sm:h-32')}
      </div>
    </aside>
  );
};
