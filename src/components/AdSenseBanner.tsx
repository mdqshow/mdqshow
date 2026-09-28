import React, { useState, useEffect } from 'react';
import { ExternalLink, Info } from 'lucide-react';

interface AdSenseBannerProps {
  format?: 'horizontal' | 'in-feed' | 'compact';
  slotId?: string;
  adClient?: string;
  className?: string;
  simulationVariant?: 'hotel' | 'cerveza' | 'transporte' | 'random';
}

/**
 * Componente Google AdSense / Espacio Publicitario para MDQSHOW.
 * Diseñado según los estándares de Google AdSense (anuncio responsivo,
 * indicador 'Publicidad' / Google Ads / AdChoices) y estilizado para integrarse
 * de forma limpia y armónica en la web.
 */
export const AdSenseBanner: React.FC<AdSenseBannerProps> = ({
  format = 'horizontal',
  slotId = '1234567890',
  adClient = 'ca-pub-XXXXXXXXXXXXXXXX',
  className = '',
  simulationVariant = 'random'
}) => {
  // Anuncios de simulación AdSense con rotación aleatoria
  const mockAds = {
    hotel: {
      tag: 'Alojamiento en MDQ',
      title: 'Hoteles frente al Mar en La Feliz — Tarifas Especiales para Recitales',
      desc: 'Hospedate a minutos de Plaza de la Música, Silos del Puerto, Mute y el Arena Mar del Plata. Cancelación gratuita.',
      cta: 'Ver Disponibilidad',
      url: 'www.booking-mardelplata.com.ar',
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&auto=format&fit=crop&q=80'
    },
    cerveza: {
      tag: 'Gastronomía Marplatense',
      title: 'Ruta Cervecera en Güemes y Olavarría — Previa de Shows',
      desc: 'Happy Hour y tapeo marplatense antes de cada recital en la ciudad. Descubrí las mejores canillas locales.',
      cta: 'Ver Bares',
      url: 'www.cervezasmdq.com.ar',
      image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=500&auto=format&fit=crop&q=80'
    },
    transporte: {
      tag: 'Viajes a Mar del Plata',
      title: 'Micros y Trenes directos a La Feliz — Salidas Diarias',
      desc: 'Vení a ver a tu banda favorita en Mar del Plata. Conexiones diarias desde Retiro, La Plata, Tandil y Rosario.',
      cta: 'Buscar Pasajes',
      url: 'www.plataforma10.com.ar',
      image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=500&auto=format&fit=crop&q=80'
    }
  };

  const adKeys: ('hotel' | 'cerveza' | 'transporte')[] = ['hotel', 'cerveza', 'transporte'];

  const [activeKey, setActiveKey] = useState<'hotel' | 'cerveza' | 'transporte'>(() => {
    if (simulationVariant !== 'random' && mockAds[simulationVariant]) {
      return simulationVariant;
    }
    return adKeys[Math.floor(Math.random() * adKeys.length)];
  });

  // Rotación aleatoria / periódica si es modo random
  useEffect(() => {
    if (simulationVariant !== 'random') return;
    const interval = setInterval(() => {
      setActiveKey((prev) => {
        const remaining = adKeys.filter(k => k !== prev);
        return remaining[Math.floor(Math.random() * remaining.length)];
      });
    }, 9000);
    return () => clearInterval(interval);
  }, [simulationVariant]);

  const ad = mockAds[activeKey];

  // Formato Horizontal (Banner adaptable)
  if (format === 'horizontal') {
    return (
      <aside 
        aria-label="Espacio publicitario patrocinado"
        className={`w-full my-6 ${className}`}
      >
        <div className="bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-3 sm:p-4 backdrop-blur-xs transition-colors overflow-hidden relative group">
          {/* Cabecera AdSense oficial */}
          <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2 px-1">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
              Anuncio patrocinado
            </span>
            <span className="flex items-center gap-1 hover:text-slate-400 cursor-pointer" title="Google AdChoices">
              <span>Google Ads</span>
              <Info className="w-3 h-3" />
            </span>
          </div>

          {/* Contenido del Banner Horizontal */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
              {/* Imagen miniatura */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 bg-slate-800 border border-slate-700/50">
                <img 
                  src={ad.image} 
                  alt="Publicidad" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Textos */}
              <div className="min-w-0 flex-1">
                <div className="inline-block text-[10px] font-bold text-amber-400/90 tracking-wide uppercase mb-0.5">
                  {ad.tag}
                </div>
                <h4 className="text-sm sm:text-base font-bold text-white leading-snug truncate max-w-xl">
                  {ad.title}
                </h4>
                <p className="text-xs text-slate-400 line-clamp-1 sm:line-clamp-2 mt-0.5 max-w-2xl">
                  {ad.desc}
                </p>
                <div className="text-[11px] text-slate-500 mt-1 font-mono">
                  {ad.url}
                </div>
              </div>
            </div>

            {/* Botón CTA */}
            <div className="w-full sm:w-auto shrink-0 flex items-center justify-end">
              <a 
                href={`https://${ad.url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer group-hover:border-rose-500/40"
              >
                <span>{ad.cta}</span>
                <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-rose-400 transition-colors" />
              </a>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  // Formato In-Feed (Tarjeta que se integra en la grilla de shows)
  if (format === 'in-feed') {
    return (
      <aside 
        aria-label="Espacio publicitario"
        className={`bg-slate-900/50 border border-slate-800/80 rounded-2xl overflow-hidden hover:border-slate-700 transition-all flex flex-col justify-between group ${className}`}
      >
        <div>
          {/* Header AdSense */}
          <div className="px-4 py-2.5 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              Anuncio patrocinado
            </span>
            <span className="flex items-center gap-1 hover:text-slate-400 cursor-pointer">
              <span>Google Ads</span>
              <Info className="w-3 h-3" />
            </span>
          </div>

          {/* Imagen */}
          <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
            <img 
              src={ad.image} 
              alt="Publicidad" 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
            <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700 text-[10px] font-bold text-amber-300">
              {ad.tag}
            </div>
          </div>

          {/* Texto y contenido */}
          <div className="p-5 space-y-2">
            <h4 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-2">
              {ad.title}
            </h4>
            <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
              {ad.desc}
            </p>
          </div>
        </div>

        {/* Footer con URL y CTA */}
        <div className="p-5 pt-0">
          <div className="text-[11px] text-slate-500 font-mono mb-3">
            {ad.url}
          </div>
          <a 
            href={`https://${ad.url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/80 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>{ad.cta}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </aside>
    );
  }

  return null;
};
