import React, { useState, useEffect } from 'react';
import { ExternalLink, Sparkles, MessageCircle } from 'lucide-react';
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
}

/**
 * Publicidad Propia MDQSHOW (Sponsors Locales & Espacio Publicitario).
 * Reemplaza los anuncios genéricos de Google Ads por publicidad directa
 * de grandes marcas de Mar del Plata e invitación a patrocinadores.
 */
export const AdSenseBanner: React.FC<AdSenseBannerProps> = ({
  format = 'horizontal',
  className = ''
}) => {
  const localSponsors = [
    {
      id: 'bruto',
      tag: 'Noche en La Feliz',
      title: 'BRUTO Playa Grande',
      subtitle: 'La Previa y el After de los Recitales',
      desc: 'El punto de encuentro obligado en Playa Grande para cenar, tomar tragos de autor y seguir la noche junto al mar.',
      cta: 'Instagram',
      url: 'instagram.com/bruto.playagrande',
      image: brutoImg,
      link: 'https://www.instagram.com/bruto.playagrande'
    },
    {
      id: 'antares',
      tag: 'Cervecería MDQ',
      title: 'Cervecería Antares',
      subtitle: 'Cuna Artesanal en Mar del Plata',
      desc: 'Nacida en 1998. Las mejores cervezas tiradas y picadas en Güemes, Olavarría y Córdoba.',
      cta: 'Ver Locales',
      url: 'cervezaantares.com',
      image: antaresImg,
      link: 'https://www.cervezaantares.com'
    },
    {
      id: 'havanna',
      tag: 'Sabor Marplatense',
      title: 'Havanna',
      subtitle: 'El Clásico de Mar del Plata',
      desc: 'Alfajores, Havannets y cafetería frente a la costa después de tu recital.',
      cta: 'Cafeterías',
      url: 'havanna.com.ar',
      image: havannaImg,
      link: 'https://www.havanna.com.ar'
    },
    {
      id: 'sao',
      tag: 'Tradición de MDQ',
      title: 'SÃO Medialunas',
      subtitle: 'Calientes y con Almíbar todo el año',
      desc: 'Las medialunas más famosas de la costa atlántica. Desayunos y meriendas artesanales.',
      cta: 'Conocer SÃO',
      url: 'sao.com.ar',
      image: saoImg,
      link: 'https://www.sao.com.ar'
    },
    {
      id: 'luccianos',
      tag: 'Heladería Artesanal',
      title: "Lucciano's",
      subtitle: 'Orgullo y Pasión Marplatense',
      desc: 'El verdadero helado artesanal italiano y los famosos Icepops nacidos en Mar del Plata.',
      cta: 'Ver Sabores',
      url: 'luccianos.net',
      image: luccianosImg,
      link: 'https://www.luccianos.net'
    },
    {
      id: 'la-fonte-doro',
      tag: 'Café & Encuentro',
      title: "La Fonte D'Oro",
      subtitle: 'Café de Especialidad frente al Mar',
      desc: 'Clásico marplatense desde 1920 con los mejores tostados, medialunas y café de calidad.',
      cta: 'Visitar Web',
      url: 'lafontedoro.com',
      image: laFonteDoroImg,
      link: 'https://lafontedoro.com'
    },
    {
      id: 'anunciar',
      tag: 'Espacio Exclusivo',
      title: 'Anunciá en MDQSHOW',
      subtitle: 'Tu marca o producción ante miles de personas',
      desc: 'Llegá directo al público que busca shows en Mar del Plata. Contactanos para ser sponsor.',
      cta: 'WhatsApp',
      url: 'mdqshow.com.ar/anunciar',
      image: manoloImg,
      link: 'https://wa.me/5492235942475?text=Hola!%20Me%20interesa%20anunciar%20mi%20marca/show%20en%20MDQSHOW'
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  // Rotación suave de sponsors cada 12 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % localSponsors.length);
    }, 12000);
    return () => clearInterval(interval);
  }, [localSponsors.length]);

  const ad = localSponsors[currentIndex];
  const secondAd = localSponsors[(currentIndex + 1) % localSponsors.length];

  // Formato Horizontal (Banner adaptable)
  if (format === 'horizontal') {
    return (
      <aside 
        aria-label="Espacio publicitario destacado"
        className={`w-full my-6 ${className}`}
      >
        <div className="bg-slate-900/80 border border-slate-800 hover:border-rose-500/40 rounded-2xl p-3 sm:p-4 backdrop-blur-md transition-all duration-300 overflow-hidden relative group shadow-lg">
          {/* Cabecera Publicitaria Propia */}
          <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-2.5 px-1">
            <span className="flex items-center gap-1.5 text-rose-400 font-bold">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Sponsor Destacado • MDQSHOW
            </span>
            <a 
              href="https://wa.me/5492235942475?text=Hola!%20Quiero%20anunciar%20en%20MDQSHOW" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-slate-400 hover:text-rose-300 transition-colors"
              title="Publicitar mi marca o show aquí"
            >
              <MessageCircle className="w-3 h-3 text-emerald-400" />
              <span>Anunciar aquí</span>
            </a>
          </div>

          {/* Contenido del Banner Horizontal */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto min-w-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 bg-slate-950 border border-slate-700/60 shadow-md">
                <img 
                  src={ad.image} 
                  alt={ad.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="inline-block text-[10px] font-black text-rose-400 uppercase tracking-wider mb-0.5">
                  {ad.tag}
                </div>
                <h4 className="text-sm sm:text-base font-bold text-white leading-snug truncate max-w-xl group-hover:text-rose-200 transition-colors">
                  {ad.title} — {ad.subtitle}
                </h4>
                <p className="text-xs text-slate-300 line-clamp-1 sm:line-clamp-2 mt-0.5 max-w-2xl leading-relaxed">
                  {ad.desc}
                </p>
                <div className="text-[11px] text-slate-500 mt-1 font-mono">
                  {ad.url}
                </div>
              </div>
            </div>

            <div className="w-full sm:w-auto shrink-0 flex items-center justify-end">
              <a 
                href={ad.link}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white border border-slate-700 hover:border-rose-500 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
              >
                <span>{ad.cta}</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors" />
              </a>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  // Formato In-Feed: Ocupa el espacio exacto de una tarjeta de show en la grilla,
  // dividido en DOS cuadraditos apilados de la mitad de altura para mayor dinamismo y estética.
  if (format === 'in-feed') {
    const sponsorsPair = [ad, secondAd];

    return (
      <aside 
        aria-label="Espacio de publicidad de sponsors"
        className={`h-full min-h-[480px] flex flex-col justify-between gap-3.5 ${className}`}
      >
        {sponsorsPair.map((item, idx) => (
          <div
            key={`${item.id}-${idx}`}
            className="flex-1 bg-slate-900/90 border border-slate-800 hover:border-rose-500/50 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col justify-between group shadow-lg hover:shadow-xl hover:shadow-rose-950/20"
          >
            {/* Header del cuadradito */}
            <div className="px-3.5 py-1.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-[10px] font-bold tracking-wider uppercase">
              <span className="flex items-center gap-1 text-rose-400">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Sponsor MDQ
              </span>
              <a 
                href="https://wa.me/5492235942475?text=Hola!%20Quiero%20anunciar%20en%20MDQSHOW"
                target="_blank" 
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-emerald-400 flex items-center gap-1 font-semibold"
                title="Pautar aquí"
              >
                <span>Anunciar</span>
                <MessageCircle className="w-3 h-3 text-emerald-400" />
              </a>
            </div>

            {/* Cuerpo del cuadradito: Imagen compacta + Info */}
            <div className="p-3.5 flex gap-3.5 items-center flex-1">
              {/* Imagen cuadrada */}
              <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-slate-800 group-hover:border-rose-500/40 relative shadow-inner">
                <img 
                  src={item.image} 
                  alt={item.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent pointer-events-none" />
              </div>

              {/* Textos */}
              <div className="min-w-0 flex-1 space-y-1">
                <span className="text-[9px] font-black text-rose-400 uppercase tracking-wider block">
                  {item.tag}
                </span>
                <h4 className="text-sm font-black text-white group-hover:text-rose-200 transition-colors leading-tight truncate">
                  {item.title}
                </h4>
                <p className="text-[11px] text-slate-300 line-clamp-2 leading-snug">
                  {item.subtitle || item.desc}
                </p>
                <div className="text-[10px] text-slate-400 font-mono truncate">
                  {item.url}
                </div>
              </div>
            </div>

            {/* Footer con botón CTA */}
            <div className="px-3.5 pb-3">
              <a 
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-1.5 px-3 rounded-xl bg-slate-800/90 hover:bg-rose-600 text-slate-200 hover:text-white border border-slate-700/80 hover:border-rose-500 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <span>{item.cta}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ))}
      </aside>
    );
  }

  return null;
};
