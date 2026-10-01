import React, { useState, useEffect } from 'react';

export interface SponsorVenueAd {
  id: string;
  name: string;      // Renglón 1: NOMBRE DEL LUGAR EN MAYÚSCULAS
  address: string;   // Renglón 2: DIRECCIÓN DEL MISMO
  bgColor: string;
  textColor: string;
  subtextColor: string;
  link: string;
  titleSizeClass: string;
  addressSizeClass: string;
  effectType: 'bruto' | 'bendu' | 'arena-mdp' | 'plaza-musica' | 'abbey-road' | 'mute' | 'radio-city';
}

/**
 * Teatros, Estadios y Espacios Emblemáticos de Mar del Plata:
 * 1. BRUTO: Playa Grande (Fondo negro con giro 3D letra por letra en el título y latido rítmico en dirección)
 * 2. ABBEY ROAD: Av. Juan B. Justo 620 (Fondo noche y destello neón retro de rock)
 * 3. BENDU ARENA: Juan B. Justo y De los Trabajadores (Fondo índigo noche y resplandor dorado 3D tilt)
 * 4. ARENA MAR DEL PLATA: Av. Pedro Luro y San Juan (Fondo azul marino/cyan con expansión horizontal)
 * 5. PLAZA DE LA MÚSICA: Av. Constitución 5780 (Fondo borgoña carmesí con pulso musical)
 * 6. MUTE: Paraje Alfar, Ruta 11 (Fondo turquesa océano profundo con ola marina y brillo solar)
 * 7. TEATRO RADIO CITY: San Luis 1750 (Fondo púrpura marquesina teatral con resplandor dorado broadway)
 */
export const VENUE_SPONSORS: SponsorVenueAd[] = [
  {
    id: 'bruto',
    name: 'BRUTO',
    address: 'PLAYA GRANDE',
    bgColor: 'bg-black',
    textColor: 'text-white',
    subtextColor: 'text-zinc-300',
    link: 'https://www.instagram.com/bruto.playagrande',
    titleSizeClass: 'text-2xl sm:text-3xl lg:text-4xl font-black tracking-widest',
    addressSizeClass: 'text-xs sm:text-sm font-extrabold tracking-[0.25em]',
    effectType: 'bruto'
  },
  {
    id: 'abbey-road',
    name: 'ABBEY ROAD',
    address: 'AV. JUAN B. JUSTO 620',
    bgColor: 'bg-gradient-to-br from-[#121214] via-[#1c1917] to-[#0c0a09]',
    textColor: 'text-amber-400',
    subtextColor: 'text-orange-300/90',
    link: 'https://www.instagram.com/abbeyroadmdq',
    titleSizeClass: 'text-2xl sm:text-3xl lg:text-4xl font-black tracking-widest',
    addressSizeClass: 'text-xs sm:text-sm font-extrabold tracking-[0.2em]',
    effectType: 'abbey-road'
  },
  {
    id: 'bendu',
    name: 'BENDU ARENA',
    address: 'AV. JUAN B. JUSTO Y AV. DE LOS TRABAJADORES',
    bgColor: 'bg-gradient-to-br from-[#180e29] via-[#0f071a] to-[#24123d]',
    textColor: 'text-amber-300',
    subtextColor: 'text-amber-200/90',
    link: 'https://www.instagram.com/benduarena',
    titleSizeClass: 'text-2xl sm:text-3xl lg:text-4xl font-black tracking-widest',
    addressSizeClass: 'text-[11px] sm:text-xs font-extrabold tracking-[0.18em]',
    effectType: 'bendu'
  },
  {
    id: 'arena-mdp',
    name: 'ARENA MAR DEL PLATA',
    address: 'AV. PEDRO LURO Y SAN JUAN',
    bgColor: 'bg-gradient-to-br from-[#071c30] via-[#0c2e4e] to-[#041221]',
    textColor: 'text-cyan-200',
    subtextColor: 'text-sky-200/90',
    link: 'https://www.instagram.com/arenamardelplata',
    titleSizeClass: 'text-xl sm:text-2xl lg:text-3xl font-black tracking-wider',
    addressSizeClass: 'text-xs sm:text-sm font-extrabold tracking-[0.22em]',
    effectType: 'arena-mdp'
  },
  {
    id: 'plaza-musica',
    name: 'PLAZA DE LA MÚSICA',
    address: 'AV. CONSTITUCIÓN 5780',
    bgColor: 'bg-gradient-to-br from-[#2a0813] via-[#1a050c] to-[#3b0d1b]',
    textColor: 'text-rose-200',
    subtextColor: 'text-rose-300/90',
    link: 'https://www.instagram.com/plazadelamusica',
    titleSizeClass: 'text-xl sm:text-2xl lg:text-3xl font-black tracking-wider',
    addressSizeClass: 'text-xs sm:text-sm font-extrabold tracking-[0.22em]',
    effectType: 'plaza-musica'
  },
  {
    id: 'mute',
    name: 'MUTE',
    address: 'RUTA 11, PARAJE ALFAR',
    bgColor: 'bg-gradient-to-br from-[#032b30] via-[#064249] to-[#011a1d]',
    textColor: 'text-emerald-300',
    subtextColor: 'text-teal-200/90',
    link: 'https://www.instagram.com/mute.mardelplata',
    titleSizeClass: 'text-2xl sm:text-3xl lg:text-4xl font-black tracking-[0.3em]',
    addressSizeClass: 'text-xs sm:text-sm font-extrabold tracking-[0.25em]',
    effectType: 'mute'
  },
  {
    id: 'radio-city',
    name: 'TEATRO RADIO CITY',
    address: 'SAN LUIS 1750',
    bgColor: 'bg-gradient-to-br from-[#23093b] via-[#150426] to-[#300c4f]',
    textColor: 'text-fuchsia-200',
    subtextColor: 'text-pink-300/90',
    link: 'https://www.plateanet.com',
    titleSizeClass: 'text-xl sm:text-2xl lg:text-3xl font-black tracking-wider',
    addressSizeClass: 'text-xs sm:text-sm font-extrabold tracking-[0.25em]',
    effectType: 'radio-city'
  }
];

interface AdSenseBannerProps {
  format?: 'horizontal' | 'in-feed' | 'timeline-double';
  className?: string;
  initialOffset?: number;
}

export const AdSenseBanner: React.FC<AdSenseBannerProps> = ({
  className = '',
  initialOffset = 0,
}) => {
  // Rotación suave de los 7 espacios cada 10 segundos con transición de esfumado
  const [rotationIndex, setRotationIndex] = useState(initialOffset);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      // Inicia el esfumado suave (fade-out)
      setIsFading(true);
      setTimeout(() => {
        setRotationIndex((prev) => (prev + 2) % VENUE_SPONSORS.length);
        // Retorna a visible con la nueva sala (fade-in)
        setIsFading(false);
      }, 500); // 500ms para esfumar
    }, 10000); // Cada 10 segundos

    return () => clearInterval(interval);
  }, []);

  // Seleccionamos los dos lugares que se muestran lado a lado en este ciclo
  const firstAd = VENUE_SPONSORS[rotationIndex % VENUE_SPONSORS.length];
  const secondAd = VENUE_SPONSORS[(rotationIndex + 1) % VENUE_SPONSORS.length];

  // Render individual card con nombre en renglón 1 y dirección en renglón 2
  const renderVenueCard = (venue: SponsorVenueAd, heightClass: string) => {
    return (
      <a
        href={venue.link}
        target="_blank"
        rel="noopener noreferrer"
        className={`relative ${heightClass} rounded-2xl overflow-hidden transition-all duration-500 group block cursor-pointer select-none ${venue.bgColor} hover:scale-[1.01] ${
          isFading ? 'opacity-0 scale-[0.98]' : 'opacity-100 scale-100'
        }`}
        style={{
          border: '1.5px solid rgba(245, 158, 11, 0.85)',
          boxShadow: '0 0 14px -2px rgba(245, 158, 11, 0.35)'
        }}
        title={`${venue.name} — ${venue.address} (Clic para visitar)`}
      >
        {/* Textura sutil y viñeta de fondo */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />

        {/* Contenido tipográfico centrado en dos renglones */}
        <div className="absolute inset-0 p-3 sm:p-4 flex flex-col items-center justify-center text-center z-10 overflow-hidden">
          <div className="flex flex-col items-center justify-center transition-transform duration-300 group-hover:scale-105 w-full">
            
            {/* LUGAR 1: BRUTO */}
            {venue.effectType === 'bruto' && (
              <>
                <h3 className={`${venue.titleSizeClass} ${venue.textColor} uppercase font-sans drop-shadow-lg leading-tight select-none`}>
                  {venue.name.split('').map((char, index) => (
                    <span
                      key={index}
                      className="animate-bruto-letter"
                      style={{ animationDelay: `${index * 0.12}s` }}
                    >
                      {char}
                    </span>
                  ))}
                </h3>
                <div className="animate-bruto-location mt-1 sm:mt-1.5">
                  <p className={`${venue.addressSizeClass} ${venue.subtextColor} uppercase drop-shadow-md`}>
                    {venue.address}
                  </p>
                </div>
              </>
            )}

            {/* LUGAR 2: ABBEY ROAD */}
            {venue.effectType === 'abbey-road' && (
              <div className="animate-abbey-road flex flex-col items-center leading-tight">
                <h3 className={`${venue.titleSizeClass} ${venue.textColor} uppercase font-black drop-shadow-md`}>
                  {venue.name}
                </h3>
                <p className={`${venue.addressSizeClass} ${venue.subtextColor} uppercase drop-shadow-md mt-1 sm:mt-1.5`}>
                  {venue.address}
                </p>
              </div>
            )}

            {/* LUGAR 3: BENDU ARENA */}
            {venue.effectType === 'bendu' && (
              <div className="animate-bendu flex flex-col items-center leading-tight">
                <h3 className={`${venue.titleSizeClass} ${venue.textColor} uppercase font-black drop-shadow-lg`}>
                  {venue.name}
                </h3>
                <p className={`${venue.addressSizeClass} ${venue.subtextColor} uppercase drop-shadow-md mt-1 sm:mt-1.5 text-center`}>
                  {venue.address}
                </p>
              </div>
            )}

            {/* LUGAR 4: ARENA MAR DEL PLATA */}
            {venue.effectType === 'arena-mdp' && (
              <div className="animate-arena-mdp flex flex-col items-center leading-tight">
                <h3 className={`${venue.titleSizeClass} ${venue.textColor} uppercase font-black drop-shadow-md`}>
                  {venue.name}
                </h3>
                <p className={`${venue.addressSizeClass} ${venue.subtextColor} uppercase drop-shadow-md mt-1 sm:mt-1.5`}>
                  {venue.address}
                </p>
              </div>
            )}

            {/* LUGAR 5: PLAZA DE LA MÚSICA */}
            {venue.effectType === 'plaza-musica' && (
              <div className="animate-plaza-musica flex flex-col items-center leading-tight">
                <h3 className={`${venue.titleSizeClass} ${venue.textColor} uppercase font-black drop-shadow-lg`}>
                  {venue.name}
                </h3>
                <p className={`${venue.addressSizeClass} ${venue.subtextColor} uppercase drop-shadow-md mt-1 sm:mt-1.5`}>
                  {venue.address}
                </p>
              </div>
            )}

            {/* LUGAR 6: MUTE */}
            {venue.effectType === 'mute' && (
              <div className="animate-mute-wave flex flex-col items-center leading-tight">
                <h3 className={`${venue.titleSizeClass} ${venue.textColor} uppercase font-black drop-shadow-lg`}>
                  {venue.name}
                </h3>
                <p className={`${venue.addressSizeClass} ${venue.subtextColor} uppercase drop-shadow-md mt-1 sm:mt-1.5`}>
                  {venue.address}
                </p>
              </div>
            )}

            {/* LUGAR 7: TEATRO RADIO CITY */}
            {venue.effectType === 'radio-city' && (
              <div className="animate-radio-city flex flex-col items-center leading-tight">
                <h3 className={`${venue.titleSizeClass} ${venue.textColor} uppercase font-black drop-shadow-lg`}>
                  {venue.name}
                </h3>
                <p className={`${venue.addressSizeClass} ${venue.subtextColor} uppercase drop-shadow-md mt-1 sm:mt-1.5`}>
                  {venue.address}
                </p>
              </div>
            )}

          </div>
        </div>
      </a>
    );
  };

  // Formato a lo ancho: 2 columnas limpias lado a lado
  return (
    <aside 
      aria-label="Espacio de Teatros y Estadios"
      className={`w-full my-6 ${className}`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {renderVenueCard(firstAd, 'h-28 sm:h-32')}
        {renderVenueCard(secondAd, 'h-28 sm:h-32')}
      </div>
    </aside>
  );
};
