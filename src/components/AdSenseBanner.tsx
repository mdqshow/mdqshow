import React, { useState, useEffect } from 'react';
import { ExternalLink, Sparkles } from 'lucide-react';
import havannaImg from '../assets/images/havanna_alfajores_mdq_1790203121209.jpg';
import luccianosImg from '../assets/images/luccianos_icecream_mdq_1790203132465.jpg';
import saoImg from '../assets/images/sao_medialunas_mdq_1790203141833.jpg';
import antaresImg from '../assets/images/antares_cerveza_mdq_1790203152818.jpg';
import brutoImg from '../assets/images/bruto_playa_grande_mdq_1790548238336.jpg';
import laFonteDoroImg from '../assets/images/la_fonte_doro_mdq_1790601235619.jpg';

interface AdSenseBannerProps {
  format?: 'horizontal' | 'in-feed' | 'compact' | 'timeline-double';
  slotId?: string;
  adClient?: string;
  className?: string;
  simulationVariant?: 'random' | 'direct_sponsor';
  onOpenContact?: () => void;
  initialOffset?: number;
}

/**
 * Publicidad Propia MDQSHOW (Sponsors Locales).
 * - Horizontal (GoogleAds/Banner general): Borde sutil estándar del mismo color que los shows (border-slate-800).
 * - In-Feed (los cuadraditos en la grilla): Borde dorado exclusivo para diferenciarlo de los shows.
 * - Timeline-Double (en la lista del Cronograma): Dos publicidades lado a lado con altura reducida al 75% (h-32 a h-36), mucho más discretas y armónicas.
 * - Rotación desfasada (cada publicidad cambia de forma independiente en momentos distintos).
 * - Duración de 10s con efecto de transición fade/scale.
 * - Disposición del texto:
 *   * Izquierda: Nombre de la empresa y bajada/subtítulo.
 *   * Derecha: Etiqueta "HELADERÍA ARTESANAL" / "CERVECERÍA MDQ" / etc.
 */
export const AdSenseBanner: React.FC<AdSenseBannerProps> = ({
  format = 'horizontal',
  className = '',
  initialOffset = 0
}) => {
  const localSponsors = [
    {
      id: 'bruto',
      tag: 'Playa Grande',
      title: 'BRUTO',
      subtitle: 'La Previa & After',
      desc: 'El punto de encuentro en Playa Grande para cenar, tomar tragos y seguir la noche junto al mar.',
      image: brutoImg,
      link: 'https://www.instagram.com/bruto.playagrande'
    },
    {
      id: 'antares',
      tag: 'Cervecería MDQ',
      title: 'Antares',
      subtitle: 'Cuna Artesanal',
      desc: 'Nacida en 1998. Cervezas tiradas y picadas en Güemes, Olavarría y Córdoba.',
      image: antaresImg,
      link: 'https://www.cervezaantares.com'
    },
    {
      id: 'havanna',
      tag: 'Sabor Marplatense',
      title: 'Havanna',
      subtitle: 'El Clásico de MDQ',
      desc: 'Alfajores, Havannets y cafetería frente a la costa después de tu recital.',
      image: havannaImg,
      link: 'https://www.havanna.com.ar'
    },
    {
      id: 'sao',
      tag: 'Tradición de MDQ',
      title: 'SÃO Medialunas',
      subtitle: 'Calientes & Almíbar',
      desc: 'Las medialunas más famosas de la costa atlántica.',
      image: saoImg,
      link: 'https://www.sao.com.ar'
    },
    {
      id: 'luccianos',
      tag: 'Heladería Artesanal',
      title: "Lucciano's",
      subtitle: 'Pasión Marplatense',
      desc: 'El verdadero helado artesanal italiano y los famosos Icepops nacidos en Mar del Plata.',
      image: luccianosImg,
      link: 'https://www.luccianos.net'
    },
    {
      id: 'la-fonte-doro',
      tag: 'Café & Encuentro',
      title: "La Fonte D'Oro",
      subtitle: 'Café de Especialidad',
      desc: 'Clásico marplatense desde 1920 con los mejores tostados, medialunas y café de calidad.',
      image: laFonteDoroImg,
      link: 'https://lafontedoro.com'
    }
  ];

  // Índices y estados de transición independientes para cada publicidad
  const [topIndex, setTopIndex] = useState(initialOffset % localSponsors.length);
  const [isTopFading, setIsTopFading] = useState(false);

  const [bottomIndex, setBottomIndex] = useState((initialOffset + 1) % localSponsors.length);
  const [isBottomFading, setIsBottomFading] = useState(false);

  // Cuadradito superior / izquierda: rota cada 10 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setIsTopFading(true);
      setTimeout(() => {
        setTopIndex((prev) => (prev + 2) % localSponsors.length);
        setIsTopFading(false);
      }, 500);
    }, 10000);

    return () => clearInterval(interval);
  }, [localSponsors.length]);

  // Cuadradito inferior / derecha: desfasado 5 segundos para que NUNCA cambien al mismo tiempo
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    const initialDelay = setTimeout(() => {
      setIsBottomFading(true);
      setTimeout(() => {
        setBottomIndex((prev) => (prev + 2) % localSponsors.length);
        setIsBottomFading(false);
      }, 500);

      interval = setInterval(() => {
        setIsBottomFading(true);
        setTimeout(() => {
          setBottomIndex((prev) => (prev + 2) % localSponsors.length);
          setIsBottomFading(false);
        }, 500);
      }, 10000);
    }, 5000);

    return () => {
      clearTimeout(initialDelay);
      if (interval) clearInterval(interval);
    };
  }, [localSponsors.length]);

  const topAd = localSponsors[topIndex % localSponsors.length];
  const bottomAd = localSponsors[bottomIndex % localSponsors.length];

  // Formato Horizontal (Banner adaptable superior o de footer: borde slate-800 original como los shows)
  if (format === 'horizontal') {
    return (
      <aside 
        aria-label="Espacio publicitario de sponsors locales"
        className={`w-full my-6 ${className}`}
      >
        <div className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-3 sm:p-4 backdrop-blur-md transition-all duration-300 overflow-hidden relative group shadow-lg">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-2.5 px-1">
            <span className="flex items-center gap-1.5 text-rose-400 font-bold">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Sponsor Destacado
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <a 
              href={topAd.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto min-w-0 cursor-pointer group/item flex-1"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 bg-slate-950 border border-slate-800 shadow-md">
                <img 
                  src={topAd.image} 
                  alt={topAd.title} 
                  className={`w-full h-full object-cover group-hover/item:scale-105 transition-all duration-700 ${
                    isTopFading ? 'opacity-30 scale-95' : 'opacity-100 scale-100'
                  }`}
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="inline-block text-[10px] font-black text-rose-400 uppercase tracking-wider mb-0.5">
                  {topAd.tag}
                </div>
                <h4 className="text-sm sm:text-base font-bold text-white leading-snug truncate max-w-xl group-hover/item:text-rose-200 transition-colors">
                  {topAd.title} — {topAd.subtitle}
                </h4>
                <p className="text-xs text-slate-300 line-clamp-1 sm:line-clamp-2 mt-0.5 max-w-2xl leading-relaxed">
                  {topAd.desc}
                </p>
              </div>
            </a>

            <div className="w-full sm:w-auto shrink-0 flex items-center justify-end">
              <a 
                href={topAd.link}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white border border-slate-700 hover:border-rose-500 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
              >
                <span>Conocer más</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
              </a>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  // Formato Timeline Double: Dos cuadraditos lado a lado (2 columnas) con altura reducida al 75% (h-32 sm:h-36)
  if (format === 'timeline-double') {
    return (
      <aside 
        aria-label="Espacio publicitario de sponsors locales en cronograma"
        className={`w-full my-3 grid grid-cols-1 sm:grid-cols-2 gap-3.5 ${className}`}
      >
        {/* Publicidad 1 (Izquierda) */}
        <a
          href={topAd.link}
          target="_blank"
          rel="noopener noreferrer"
          className="relative h-32 sm:h-36 rounded-2xl overflow-hidden transition-all duration-500 group block cursor-pointer bg-slate-950 hover:scale-[1.01]"
          style={{
            border: '1.5px solid rgba(245, 158, 11, 0.85)',
            boxShadow: '0 0 12px -2px rgba(245, 158, 11, 0.3)'
          }}
          title={`${topAd.title} — Clic para abrir`}
        >
          <img 
            src={topAd.image} 
            alt={topAd.title} 
            className={`absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-all duration-700 ease-in-out ${
              isTopFading ? 'opacity-20 scale-95 blur-xs' : 'opacity-100 scale-100 blur-0'
            }`}
          />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent pointer-events-none" />
          <div className={`absolute bottom-0 inset-x-0 p-3 z-10 flex items-end justify-between gap-2 pointer-events-none transition-opacity duration-500 ${
            isTopFading ? 'opacity-0' : 'opacity-100'
          }`}>
            <div className="min-w-0 flex-1 text-left">
              <h4 className="text-sm font-black text-white group-hover:text-amber-200 transition-colors drop-shadow-md truncate">
                {topAd.title}
              </h4>
              <p className="text-[10px] text-amber-200/90 drop-shadow line-clamp-1">
                {topAd.subtitle}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <span 
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-950/90 backdrop-blur-md text-[9px] font-black text-amber-300 uppercase tracking-wider shadow-sm"
                style={{ border: '1px solid rgba(245, 158, 11, 0.7)' }}
              >
                <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                {topAd.tag}
              </span>
            </div>
          </div>
        </a>

        {/* Publicidad 2 (Derecha - desfasada 5 segundos) */}
        <a
          href={bottomAd.link}
          target="_blank"
          rel="noopener noreferrer"
          className="relative h-32 sm:h-36 rounded-2xl overflow-hidden transition-all duration-500 group block cursor-pointer bg-slate-950 hover:scale-[1.01]"
          style={{
            border: '1.5px solid rgba(245, 158, 11, 0.85)',
            boxShadow: '0 0 12px -2px rgba(245, 158, 11, 0.3)'
          }}
          title={`${bottomAd.title} — Clic para abrir`}
        >
          <img 
            src={bottomAd.image} 
            alt={bottomAd.title} 
            className={`absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-all duration-700 ease-in-out ${
              isBottomFading ? 'opacity-20 scale-95 blur-xs' : 'opacity-100 scale-100 blur-0'
            }`}
          />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent pointer-events-none" />
          <div className={`absolute bottom-0 inset-x-0 p-3 z-10 flex items-end justify-between gap-2 pointer-events-none transition-opacity duration-500 ${
            isBottomFading ? 'opacity-0' : 'opacity-100'
          }`}>
            <div className="min-w-0 flex-1 text-left">
              <h4 className="text-sm font-black text-white group-hover:text-amber-200 transition-colors drop-shadow-md truncate">
                {bottomAd.title}
              </h4>
              <p className="text-[10px] text-amber-200/90 drop-shadow line-clamp-1">
                {bottomAd.subtitle}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <span 
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-950/90 backdrop-blur-md text-[9px] font-black text-amber-300 uppercase tracking-wider shadow-sm"
                style={{ border: '1px solid rgba(245, 158, 11, 0.7)' }}
              >
                <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                {bottomAd.tag}
              </span>
            </div>
          </div>
        </a>
      </aside>
    );
  }

  // Formato In-Feed: Dos cuadraditos apilados con borde dorado 1.5px (para la grilla de shows)
  if (format === 'in-feed') {
    return (
      <aside 
        aria-label="Espacio publicitario de sponsors locales"
        className={`h-full min-h-[480px] flex flex-col justify-between gap-4 ${className}`}
      >
        {/* Cuadradito 1 (Superior) */}
        <a
          href={topAd.link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 relative rounded-2xl overflow-hidden transition-all duration-500 group block cursor-pointer bg-slate-950 hover:scale-[1.01]"
          style={{
            border: '1.5px solid rgba(245, 158, 11, 0.85)',
            boxShadow: '0 0 14px -2px rgba(245, 158, 11, 0.35)'
          }}
          title={`${topAd.title} — Clic para abrir`}
        >
          {/* Imagen completa con transición propia */}
          <img 
            src={topAd.image} 
            alt={topAd.title} 
            className={`absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-all duration-700 ease-in-out ${
              isTopFading ? 'opacity-20 scale-95 blur-xs' : 'opacity-100 scale-100 blur-0'
            }`}
          />

          {/* Degradé inferior para lectura nítida de ambos extremos */}
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent pointer-events-none" />

          {/* Fila inferior con el texto a la izquierda y la etiqueta a la derecha */}
          <div className={`absolute bottom-0 inset-x-0 p-3.5 z-10 flex items-end justify-between gap-2 pointer-events-none transition-opacity duration-500 ${
            isTopFading ? 'opacity-0' : 'opacity-100'
          }`}>
            {/* Lado Izquierdo: Nombre de la empresa y bajada */}
            <div className="min-w-0 flex-1 text-left">
              <h4 className="text-sm sm:text-base font-black text-white group-hover:text-amber-200 transition-colors drop-shadow-md truncate">
                {topAd.title}
              </h4>
              <p className="text-[10px] sm:text-[11px] text-amber-200/90 drop-shadow line-clamp-1">
                {topAd.subtitle}
              </p>
            </div>

            {/* Lado Derecho: Etiqueta (ej. "Heladería Artesanal") */}
            <div className="shrink-0 text-right">
              <span 
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-950/90 backdrop-blur-md text-[9px] font-black text-amber-300 uppercase tracking-wider shadow-sm"
                style={{ border: '1px solid rgba(245, 158, 11, 0.7)' }}
              >
                <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                {topAd.tag}
              </span>
            </div>
          </div>
        </a>

        {/* Cuadradito 2 (Inferior - desfasado 5 segundos) */}
        <a
          href={bottomAd.link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 relative rounded-2xl overflow-hidden transition-all duration-500 group block cursor-pointer bg-slate-950 hover:scale-[1.01]"
          style={{
            border: '1.5px solid rgba(245, 158, 11, 0.85)',
            boxShadow: '0 0 14px -2px rgba(245, 158, 11, 0.35)'
          }}
          title={`${bottomAd.title} — Clic para abrir`}
        >
          {/* Imagen completa con transición propia */}
          <img 
            src={bottomAd.image} 
            alt={bottomAd.title} 
            className={`absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-all duration-700 ease-in-out ${
              isBottomFading ? 'opacity-20 scale-95 blur-xs' : 'opacity-100 scale-100 blur-0'
            }`}
          />

          {/* Degradé inferior para lectura nítida de ambos extremos */}
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent pointer-events-none" />

          {/* Fila inferior con el texto a la izquierda y la etiqueta a la derecha */}
          <div className={`absolute bottom-0 inset-x-0 p-3.5 z-10 flex items-end justify-between gap-2 pointer-events-none transition-opacity duration-500 ${
            isBottomFading ? 'opacity-0' : 'opacity-100'
          }`}>
            {/* Lado Izquierdo: Nombre de la empresa y bajada */}
            <div className="min-w-0 flex-1 text-left">
              <h4 className="text-sm sm:text-base font-black text-white group-hover:text-amber-200 transition-colors drop-shadow-md truncate">
                {bottomAd.title}
              </h4>
              <p className="text-[10px] sm:text-[11px] text-amber-200/90 drop-shadow line-clamp-1">
                {bottomAd.subtitle}
              </p>
            </div>

            {/* Lado Derecho: Etiqueta (ej. "Heladería Artesanal") */}
            <div className="shrink-0 text-right">
              <span 
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-950/90 backdrop-blur-md text-[9px] font-black text-amber-300 uppercase tracking-wider shadow-sm"
                style={{ border: '1px solid rgba(245, 158, 11, 0.7)' }}
              >
                <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                {bottomAd.tag}
              </span>
            </div>
          </div>
        </a>
      </aside>
    );
  }

  return null;
};
