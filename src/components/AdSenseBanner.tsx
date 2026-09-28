import React, { useState, useEffect } from 'react';
import { ExternalLink, Sparkles } from 'lucide-react';
import havannaImg from '../assets/images/havanna_alfajores_mdq_1790203121209.jpg';
import luccianosImg from '../assets/images/luccianos_icecream_mdq_1790203132465.jpg';
import saoImg from '../assets/images/sao_medialunas_mdq_1790203141833.jpg';
import antaresImg from '../assets/images/antares_cerveza_mdq_1790203152818.jpg';
import manoloImg from '../assets/images/manolo_churros_mdq_1790203532686.jpg';
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
 * En la grilla muestra dos cuadraditos donde la imagen ocupa todo el contenedor
 * y al hacer clic en la imagen abre directamente el link del sponsor.
 */
export const AdSenseBanner: React.FC<AdSenseBannerProps> = ({
  format = 'horizontal',
  className = '',
  onOpenContact
}) => {
  const localSponsors = [
    {
      id: 'bruto',
      tag: 'Playa Grande',
      title: 'BRUTO Playa Grande',
      subtitle: 'La Previa y el After de los Recitales',
      desc: 'El punto de encuentro obligado en Playa Grande para cenar, tomar tragos de autor y seguir la noche junto al mar.',
      image: brutoImg,
      link: 'https://www.instagram.com/bruto.playagrande'
    },
    {
      id: 'antares',
      tag: 'Cervecería MDQ',
      title: 'Cervecería Antares',
      subtitle: 'Cuna Artesanal en Mar del Plata',
      desc: 'Nacida en 1998. Las mejores cervezas tiradas y picadas en Güemes, Olavarría y Córdoba.',
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
      desc: 'Las medialunas más famosas de la costa atlántica. Desayunos y meriendas artesanales.',
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
    },
    {
      id: 'anunciar',
      tag: 'Espacio Exclusivo',
      title: 'Anunciá en MDQSHOW',
      subtitle: 'Tu marca o producción ante miles de personas',
      desc: 'Llegá directo al público que busca shows en Mar del Plata. Contactanos a través del formulario.',
      image: manoloImg,
      isContactTrigger: true,
      link: '#contacto'
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  // Rotación suave de sponsors cada 10 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % localSponsors.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [localSponsors.length]);

  const ad = localSponsors[currentIndex];
  const secondAd = localSponsors[(currentIndex + 1) % localSponsors.length];

  // Disparador de enlace o formulario de contacto
  const handleItemClick = (e: React.MouseEvent, item: typeof localSponsors[0]) => {
    if (item.isContactTrigger) {
      e.preventDefault();
      if (onOpenContact) {
        onOpenContact();
      } else {
        const contactBtn = document.getElementById('footer-contact-btn');
        if (contactBtn) contactBtn.click();
      }
    }
  };

  // Formato Horizontal (Banner adaptable superior o de footer)
  if (format === 'horizontal') {
    return (
      <aside 
        aria-label="Espacio publicitario de sponsors locales"
        className={`w-full my-6 ${className}`}
      >
        <div className="bg-slate-900/80 border border-slate-800 hover:border-rose-500/40 rounded-2xl p-3 sm:p-4 backdrop-blur-md transition-all duration-300 overflow-hidden relative group shadow-lg">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-2.5 px-1">
            <span className="flex items-center gap-1.5 text-rose-400 font-bold">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Sponsor Destacado • MDQSHOW
            </span>
            <button 
              onClick={(e) => handleItemClick(e, { ...ad, isContactTrigger: true })}
              className="text-slate-400 hover:text-rose-300 transition-colors cursor-pointer text-[10px] font-semibold"
            >
              Anunciá tu marca
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <a 
              href={ad.link}
              target={ad.isContactTrigger ? '_self' : '_blank'}
              rel="noopener noreferrer"
              onClick={(e) => handleItemClick(e, ad)}
              className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto min-w-0 cursor-pointer group/item flex-1"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 bg-slate-950 border border-slate-700/60 shadow-md">
                <img 
                  src={ad.image} 
                  alt={ad.title} 
                  className="w-full h-full object-cover group-hover/item:scale-105 transition-transform duration-500"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="inline-block text-[10px] font-black text-rose-400 uppercase tracking-wider mb-0.5">
                  {ad.tag}
                </div>
                <h4 className="text-sm sm:text-base font-bold text-white leading-snug truncate max-w-xl group-hover/item:text-rose-200 transition-colors">
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
                target={ad.isContactTrigger ? '_self' : '_blank'}
                rel="noopener noreferrer"
                onClick={(e) => handleItemClick(e, ad)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white border border-slate-700 hover:border-rose-500 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
              >
                <span>Conocer más</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors" />
              </a>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  // Formato In-Feed: Ocupa el espacio de un show en la grilla dividido en DOS cuadraditos apilados.
  // La imagen ocupa TODO el cuadrado y el link es hacer clic directamente sobre la imagen.
  if (format === 'in-feed') {
    const sponsorsPair = [ad, secondAd];

    return (
      <aside 
        aria-label="Espacio de publicidad de sponsors"
        className={`h-full min-h-[480px] flex flex-col justify-between gap-4 ${className}`}
      >
        {sponsorsPair.map((item, idx) => (
          <a
            key={`${item.id}-${idx}`}
            href={item.link}
            target={item.isContactTrigger ? '_self' : '_blank'}
            rel="noopener noreferrer"
            onClick={(e) => handleItemClick(e, item)}
            className="flex-1 relative rounded-2xl overflow-hidden border border-slate-800 hover:border-rose-500/60 shadow-lg hover:shadow-2xl hover:shadow-rose-950/30 transition-all duration-300 group block cursor-pointer bg-slate-950"
            title={`${item.title} — Clic para abrir`}
          >
            {/* La imagen ocupa TODO el contenedor del cuadrado */}
            <img 
              src={item.image} 
              alt={item.title} 
              className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
            />

            {/* Máscara de degradé suave que permite ver la foto en su totalidad y leer el título sutil */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent pointer-events-none" />

            {/* Insignia pequeña en la esquina superior */}
            <div className="absolute top-3 left-3 z-10">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md border border-slate-700/60 text-[9px] font-black text-rose-300 uppercase tracking-wider shadow-sm">
                <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                {item.tag}
              </span>
            </div>

            {/* Título integrado sutil en el pie de la imagen */}
            <div className="absolute bottom-0 inset-x-0 p-3.5 z-10 pointer-events-none">
              <h4 className="text-sm sm:text-base font-black text-white group-hover:text-rose-200 transition-colors drop-shadow-md truncate">
                {item.title}
              </h4>
              <p className="text-[11px] text-slate-300 drop-shadow line-clamp-1">
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
