import React, { useState, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import { Show } from '../types';

interface HeroShowcaseProps {
  shows?: Show[];
  onSelectShow?: (show: Show) => void;
}

import havannaImg from '../assets/images/havanna_alfajores_mdq_1790203121209.jpg';
import luccianosImg from '../assets/images/luccianos_icecream_mdq_1790203132465.jpg';
import saoImg from '../assets/images/sao_medialunas_mdq_1790203141833.jpg';
import antaresImg from '../assets/images/antares_cerveza_mdq_1790203152818.jpg';
import manoloImg from '../assets/images/manolo_churros_mdq_1790203532686.jpg';
import brutoImg from '../assets/images/bruto_playa_grande_mdq_1790548238336.jpg';
import laFonteDoroImg from '../assets/images/la_fonte_doro_mdq_1790601235619.jpg';

interface BrandSlide {
  id: string;
  name: string;
  tagline: string;
  origin: string;
  image: string;
  url: string;
  badgeColor: string;
}

const MDQ_HERO_BRANDS: BrandSlide[] = [
  {
    id: 'bruto',
    name: 'BRUTO Playa Grande',
    tagline: 'El Templo de la Noche Marplatense • Música & Fiestas junto al Mar',
    origin: 'Playa Grande • La Noche de MDQ',
    image: brutoImg,
    url: 'https://www.instagram.com/bruto.playagrande',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40'
  },
  {
    id: 'havanna',
    name: 'Havanna',
    tagline: 'Alfajores & Havannets frente al Mar',
    origin: 'Emblema Marplatense • Desde 1948',
    image: havannaImg,
    url: 'https://www.havanna.com.ar',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
  },
  {
    id: 'sao',
    name: 'SÃO Medialunas',
    tagline: 'Medialunas Calientes con Almíbar & Café',
    origin: 'Tradición de La Feliz • Desde 1952',
    image: saoImg,
    url: 'https://www.sao.com.ar',
    badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/40'
  },
  {
    id: 'luccianos',
    name: "Lucciano's",
    tagline: 'Il Maestro del Gelato & Icepops',
    origin: 'Nacido en Mar del Plata • Orgullo MDQ',
    image: luccianosImg,
    url: 'https://www.luccianos.net',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
  },
  {
    id: 'la-fonte-doro',
    name: "La Fonte D'Oro",
    tagline: 'Café de Especialidad, Medialunas & Tostados frente al Mar',
    origin: 'Clásico Marplatense • Desde 1920',
    image: laFonteDoroImg,
    url: 'https://lafontedoro.com',
    badgeColor: 'bg-amber-600/20 text-amber-200 border-amber-500/40'
  },
  {
    id: 'antares',
    name: 'Cervecería Antares',
    tagline: 'La Previa Cervecera de tus Recitales',
    origin: 'Cuna Artesanal en MDQ • Desde 1998',
    image: antaresImg,
    url: 'https://www.cervezaantares.com',
    badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
  },
  {
    id: 'manolo',
    name: 'Churros Manolo',
    tagline: 'Los Famosos Churros Rellenos con Dulce de Leche',
    origin: 'Clásico Costero en Rivadavia y Alem',
    image: manoloImg,
    url: 'https://churrosmanolo.com.ar',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40'
  }
];

export const HeroShowcase: React.FC<HeroShowcaseProps> = () => {
  const [brandIndex, setBrandIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Rotación automática continua cada 30 segundos (con pausa al pasar el cursor)
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setBrandIndex((prev) => (prev + 1) % MDQ_HERO_BRANDS.length);
        setIsFading(false);
      }, 400);
    }, 30000);

    return () => clearInterval(interval);
  }, [isPaused]);

  const currentBrand = MDQ_HERO_BRANDS[brandIndex];
  const nextBrand = MDQ_HERO_BRANDS[(brandIndex + 1) % MDQ_HERO_BRANDS.length];

  const handleCardClick = () => {
    window.open(currentBrand.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div 
      className="relative w-full h-72 sm:h-80 lg:h-84 flex items-center justify-center select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Resplandor ambiental de luz detrás de la imagen */}
      <div className="absolute inset-0 bg-gradient-to-tr from-rose-600/20 via-amber-500/15 to-transparent rounded-full blur-3xl pointer-events-none transform -rotate-3 scale-110" />

      <div className="relative w-full h-full flex items-center justify-end">
        {/* Tarjeta decorativa de fondo (próxima marca que asoma sutilmente en perspectiva) */}
        <div className="hidden sm:block absolute right-2 top-2 w-[90%] h-[92%] rounded-3xl overflow-hidden opacity-25 transform rotate-3 scale-95 pointer-events-none blur-[0.5px]">
          <img 
            src={nextBrand.image} 
            alt="" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/70 to-transparent" />
        </div>

        {/* Tarjeta principal con la foto de la marca y fundido orgánico con el degradé del encabezado */}
        <div 
          onClick={handleCardClick}
          className={`relative z-10 w-full sm:w-[94%] h-full rounded-3xl overflow-hidden cursor-pointer transition-all duration-500 shadow-2xl border border-white/15 hover:border-rose-500/50 group ${
            isFading ? 'opacity-30 scale-[0.99] blur-xs' : 'opacity-100 scale-100 blur-0'
          }`}
          style={{
            background: 'linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,41,59,0.5))'
          }}
          title={`Visitar sitio oficial de ${currentBrand.name}`}
        >
          {/* Foto con sutil zoom continuo al pasar el cursor */}
          <img 
            src={currentBrand.image} 
            alt={currentBrand.name} 
            className="w-full h-full object-cover object-center transform scale-105 group-hover:scale-110 transition-transform duration-700"
          />

          {/* Máscaras de degradé que integran la foto al encabezado oscuro */}
          <div className="absolute inset-y-0 left-0 w-28 sm:w-44 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-slate-950/60 to-transparent pointer-events-none" />

          {/* Nombre, origen, descripción y link oficial */}
          <div className="absolute bottom-0 inset-x-0 p-5 sm:p-6 z-20 space-y-1.5 pointer-events-none">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border backdrop-blur-md ${currentBrand.badgeColor}`}>
                {currentBrand.origin}
              </span>
              <span className="text-[11px] text-slate-300 flex items-center gap-1 font-semibold group-hover:text-rose-300 transition-colors">
                <ExternalLink className="w-3 h-3 text-rose-400" />
                <span>Sitio Oficial</span>
              </span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight drop-shadow-lg group-hover:text-rose-200 transition-colors">
              {currentBrand.name}
            </h3>

            <p className="text-xs sm:text-sm text-slate-200/90 font-medium drop-shadow leading-snug line-clamp-1">
              {currentBrand.tagline}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
