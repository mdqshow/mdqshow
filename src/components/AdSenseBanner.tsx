import React, { useState, useEffect } from 'react';
import { ExternalLink, Sparkles } from 'lucide-react';
import havannaImg from '../assets/images/havanna_alfajores_mdq_1790203121209.jpg';
import luccianosImg from '../assets/images/luccianos_icecream_mdq_1790203132465.jpg';
import saoImg from '../assets/images/sao_medialunas_mdq_1790203141833.jpg';
import antaresImg from '../assets/images/antares_cerveza_mdq_1790203152818.jpg';
import brutoImg from '../assets/images/bruto_playa_grande_mdq_1790548238336.jpg';
import laFonteDoroImg from '../assets/images/la_fonte_doro_mdq_1790601235619.jpg';

interface AdSenseBannerProps {
  format?: 'horizontal' | 'in-feed' | 'compact';
  slotId?: string;
  adClient?: string;
  className?: string;
  simulationVariant?: 'random' | 'direct_sponsor';
  onOpenContact?: () => void;
}

/**
 * Publicidad Propia MDQSHOW (Sponsors Locales).
 * Publicidades rotativas cada 10 segundos con animación de transición fluida
 * y borde dorado distinguido. La imagen ocupa todo el contenedor y es 100% cliqueable.
 */
export const AdSenseBanner: React.FC<AdSenseBannerProps> = ({
  format = 'horizontal',
  className = ''
}) => {
  // Lista de marcas rotativas reales de Mar del Plata
  const localSponsors = [
    {
      id: 'bruto',
      tag: 'Playa Grande',
      title: 'BRUTO Playa Grande',
      subtitle: 'La Previa y el After de los Recitales',
      desc: 'El punto de encuentro en Playa Grande para cenar, tomar tragos y seguir la noche junto al mar.',
      image: brutoImg,
      link: 'https://www.instagram.com/bruto.playagrande'
    },
    {
      id: 'antares',
      tag: 'Cervecería MDQ',
      title: 'Cervecería Antares',
      subtitle: 'Cuna Artesanal en Mar del Plata',
      desc: 'Nacida en 1998. Cervezas tiradas y picadas en Güemes, Olavarría y Córdoba.',
      image: antaresImg,
      link: 'https://www.cervezaantares.com'
    },
    {
      id: 'havanna',
      tag: 'Sabor Marplatense',
      title: 'Havanna',
      subtitle: 'El Clásico de Mar del Plata',
      desc: 'Alfajores, Havannets y cafetería frente a la costa después de tu recital.',
      image: havannaImg,
      link: 'https://www.havanna.com.ar'
    },
    {
      id: 'sao',
      tag: 'Tradición de MDQ',
      title: 'SÃO Medialunas',
      subtitle: 'Calientes y con Almíbar todo el año',
      desc: 'Las medialunas más famosas de la costa atlántica.',
      image: saoImg,
      link: 'https://www.sao.com.ar'
    },
    {
      id: 'luccianos',
      tag: 'Heladería Artesanal',
      title: "Lucciano's",
      subtitle: 'Orgullo y Pasión Marplatense',
      desc: 'El verdadero helado artesanal italiano y los famosos Icepops nacidos en Mar del Plata.',
      image: luccianosImg,
      link: 'https://www.luccianos.net'
    },
    {
      id: 'la-fonte-doro',
      tag: 'Café & Encuentro',
      title: "La Fonte D'Oro",
      subtitle: 'Café de Especialidad frente al Mar',
      desc: 'Clásico marplatense desde 1920 con los mejores tostados, medialunas y café de calidad.',
      image: laFonteDoroImg,
      link: 'https://lafontedoro.com'
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Rotación automática con efecto de transición cada 10 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 2) % localSponsors.length);
        setIsTransitioning(false);
      }, 500); // 500ms de desvanecimiento
    }, 10000); // 10 segundos de visualización

    return () => clearInterval(interval);
  }, [localSponsors.length]);

  const ad = localSponsors[currentIndex % localSponsors.length];
  const secondAd = localSponsors[(currentIndex + 1) % localSponsors.length];

  // Formato Horizontal (Banner adaptable superior o de footer)
  if (format === 'horizontal') {
    return (
      <aside 
        aria-label="Espacio publicitario de sponsors locales"
        className={`w-full my-6 ${className}`}
      >
        <div className="bg-slate-900/80 border-2 border-amber-500/60 hover:border-amber-400 rounded-2xl p-3 sm:p-4 backdrop-blur-md transition-all duration-500 overflow-hidden relative group shadow-xl shadow-amber-950/20">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-amber-400 font-bold mb-2.5 px-1">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-300" />
              Sponsor Destacado
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <a 
              href={ad.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto min-w-0 cursor-pointer group/item flex-1"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 bg-slate-950 border border-amber-500/40 shadow-md">
                <img 
                  src={ad.image} 
                  alt={ad.title} 
                  className={`w-full h-full object-cover group-hover/item:scale-105 transition-all duration-700 ${
                    isTransitioning ? 'opacity-30 scale-95' : 'opacity-100 scale-100'
                  }`}
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="inline-block text-[10px] font-black text-amber-400 uppercase tracking-wider mb-0.5">
                  {ad.tag}
                </div>
                <h4 className="text-sm sm:text-base font-bold text-white leading-snug truncate max-w-xl group-hover/item:text-amber-200 transition-colors">
                  {ad.title} — {ad.subtitle}
                </h4>
                <p className="text-xs text-slate-300 line-clamp-1 sm:line-clamp-2 mt-0.5 max-w-2xl leading-relaxed">
                  {ad.desc}
                </p>
              </div>
            </a>

            <div className="w-full sm:w-auto shrink-0 flex items-center justify-end">
              <a 
                href={ad.link}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/40 hover:border-amber-400 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
              >
                <span>Conocer más</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  // Formato In-Feed: Dos cuadraditos de mitad de tamaño con BORDE DORADO,
  // duración de 10 segundos, efecto de transición y foto al 100% cliqueable.
  if (format === 'in-feed') {
    const sponsorsPair = [ad, secondAd];

    return (
      <aside 
        aria-label="Espacio publicitario de sponsors locales"
        className={`h-full min-h-[480px] flex flex-col justify-between gap-4 ${className}`}
      >
        {sponsorsPair.map((item, idx) => (
          <a
            key={`${item.id}-${idx}`}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 relative rounded-2xl overflow-hidden border-2 border-amber-500/70 hover:border-amber-400 shadow-xl shadow-amber-950/20 hover:shadow-2xl hover:shadow-amber-900/40 transition-all duration-500 group block cursor-pointer bg-slate-950"
            title={`${item.title} — Clic para abrir`}
          >
            {/* La imagen ocupa TODO el contenedor del cuadrado, con efecto de transición al rotar */}
            <img 
              src={item.image} 
              alt={item.title} 
              className={`absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-all duration-700 ease-in-out ${
                isTransitioning ? 'opacity-20 scale-95 blur-xs' : 'opacity-100 scale-100 blur-0'
              }`}
            />

            {/* Máscara de degradé suave para apreciar la foto y leer sutilmente el título */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent pointer-events-none" />

            {/* Insignia dorada en la esquina superior para diferenciar de los recitales */}
            <div className="absolute top-3 left-3 z-10">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950/85 backdrop-blur-md border border-amber-500/60 text-[9px] font-black text-amber-300 uppercase tracking-wider shadow-sm">
                <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                {item.tag}
              </span>
            </div>

            {/* Título integrado sutil en el pie de la imagen */}
            <div className={`absolute bottom-0 inset-x-0 p-3.5 z-10 pointer-events-none transition-opacity duration-500 ${
              isTransitioning ? 'opacity-0' : 'opacity-100'
            }`}>
              <h4 className="text-sm sm:text-base font-black text-white group-hover:text-amber-200 transition-colors drop-shadow-md truncate">
                {item.title}
              </h4>
              <p className="text-[11px] text-amber-200/90 drop-shadow line-clamp-1">
                {item.subtitle}
              </p>
            </div>
          </a>
        ))}
      </aside>
    );
  }

  return null;
};
