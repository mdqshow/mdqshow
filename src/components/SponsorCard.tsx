import React, { useMemo } from 'react';
import { ExternalLink, Sparkles, Image as ImageIcon } from 'lucide-react';
import { Sponsor, SponsorEffectType } from '../types';
import { trackBannerClick } from '../services/metricsService';

const AVAILABLE_EFFECTS: SponsorEffectType[] = [
  'bruto',
  'abbey-road',
  'bendu',
  'arena-mdp',
  'plaza-musica',
  'mute',
  'radio-city',
  'cyber-neon',
  'golden-shimmer',
  'retro-bounce',
  'float-glow',
];

interface SponsorCardProps {
  sponsor: Sponsor;
  heightClass?: string;
  isFading?: boolean;
  className?: string;
  showBadge?: boolean;
  variant?: 'banner' | 'popup' | 'preview';
  onClick?: () => void;
}

export const SponsorCard: React.FC<SponsorCardProps> = ({
  sponsor,
  heightClass = 'h-28 sm:h-32',
  isFading = false,
  className = '',
  showBadge = false,
  variant = 'banner',
  onClick,
}) => {
  // Resolver el efecto: si es 'random' o no está definido, asignar uno estable basado en el ID/nombre
  const activeEffect: SponsorEffectType = useMemo(() => {
    if (sponsor.effectType && sponsor.effectType !== 'random') {
      return sponsor.effectType;
    }
    // Generar un índice pseudo-aleatorio estable a partir de los caracteres del ID
    let hash = 0;
    const key = (sponsor.id || sponsor.name || 'mdq');
    for (let i = 0; i < key.length; i++) {
      hash = key.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % AVAILABLE_EFFECTS.length;
    return AVAILABLE_EFFECTS[idx];
  }, [sponsor.id, sponsor.name, sponsor.effectType]);

  // Colores por defecto elegantes y oscuros estilo Mar del Plata nocturna
  const bgColor = sponsor.bgColor || 'bg-gradient-to-br from-[#0f172a] via-[#020617] to-black';
  const textColor = sponsor.textColor || 'text-amber-300';
  const subtextColor = sponsor.subtextColor || 'text-zinc-300';

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick();
    }
    if (sponsor.id && sponsor.name) {
      trackBannerClick(sponsor.id, sponsor.name);
    }
  };

  const isImageSponsor = sponsor.type === 'image' && Boolean(sponsor.image);
  const isVideoSponsor = sponsor.type === 'video' && Boolean(sponsor.video);

  const cardContent = (
    <div
      className={`relative w-full ${heightClass} rounded-2xl overflow-hidden transition-all duration-500 group select-none ${bgColor} ${
        isFading ? 'opacity-0 scale-[0.98]' : 'opacity-100 scale-100'
      } ${className}`}
      style={{
        border: '1.5px solid rgba(245, 158, 11, 0.85)',
        boxShadow: '0 0 16px -2px rgba(245, 158, 11, 0.35)',
      }}
    >
      {/* Si es sponsor con video (se reproduce solo, sin sonido y en bucle) */}
      {isVideoSponsor ? (
        <div className="relative w-full h-full bg-black">
          <video
            src={sponsor.video}
            poster={sponsor.image || undefined}
            className="w-full h-full object-cover object-center"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />

          {(sponsor.name || sponsor.address) && (
            <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between z-10">
              <div className="truncate pr-2">
                <span className="block text-sm sm:text-base font-black text-white drop-shadow-md truncate uppercase tracking-wider">
                  {sponsor.name}
                </span>
                {sponsor.address && (
                  <span className="block text-[10px] sm:text-xs font-bold text-amber-300 drop-shadow-sm truncate tracking-wide uppercase">
                    {sponsor.address}
                  </span>
                )}
              </div>
              {sponsor.link && (
                <span className="shrink-0 p-1.5 rounded-lg bg-black/60 backdrop-blur-md text-amber-300 border border-amber-500/40 text-[10px] font-bold flex items-center gap-1 group-hover:bg-amber-500 group-hover:text-black transition-colors">
                  <span>Ver</span>
                  <ExternalLink className="w-3 h-3" />
                </span>
              )}
            </div>
          )}
        </div>
      ) : isImageSponsor ? (
        <div className="relative w-full h-full">
          <img
            src={sponsor.image}
            alt={sponsor.name}
            className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
          {/* Overlay de contraste y gradiente para legibilidad */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/20 pointer-events-none" />

          {/* Información superpuesta del sponsor */}
          <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between z-10">
            <div className="truncate pr-2">
              <span className="block text-sm sm:text-base font-black text-white drop-shadow-md truncate uppercase tracking-wider">
                {sponsor.name}
              </span>
              {sponsor.address && (
                <span className="block text-[10px] sm:text-xs font-bold text-amber-300 drop-shadow-sm truncate tracking-wide uppercase">
                  {sponsor.address}
                </span>
              )}
            </div>
            {sponsor.link && (
              <span className="shrink-0 p-1.5 rounded-lg bg-black/60 backdrop-blur-md text-amber-300 border border-amber-500/40 text-[10px] font-bold flex items-center gap-1 group-hover:bg-amber-500 group-hover:text-black transition-colors">
                <span>Ver</span>
                <ExternalLink className="w-3 h-3" />
              </span>
            )}
          </div>
        </div>
      ) : (
        /* Si es sponsor de solo texto con dos renglones y transiciones dinámicas */
        <>
          {/* Viñeta sutil y destellos radiales de fondo */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />

          {/* Contenido tipográfico centrado en dos renglones */}
          <div className="absolute inset-0 p-3 sm:p-4 flex flex-col items-center justify-center text-center z-10 overflow-hidden">
            <div className="flex flex-col items-center justify-center transition-transform duration-300 group-hover:scale-105 w-full">
              
              {/* EFECTO: BRUTO (giro 3D letra por letra + latido) */}
              {activeEffect === 'bruto' && (
                <>
                  <h3 className={`text-xl sm:text-2xl lg:text-3xl font-black tracking-widest ${textColor} uppercase font-sans drop-shadow-lg leading-tight select-none`}>
                    {(sponsor.name || '').split('').map((char, index) => (
                      <span
                        key={index}
                        className="animate-bruto-letter"
                        style={{ animationDelay: `${index * 0.12}s` }}
                      >
                        {char}
                      </span>
                    ))}
                  </h3>
                  {sponsor.address && (
                    <div className="animate-bruto-location mt-1 sm:mt-1.5">
                      <p className={`text-xs sm:text-sm font-extrabold tracking-[0.25em] ${subtextColor} uppercase drop-shadow-md`}>
                        {sponsor.address}
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* EFECTO: ABBEY ROAD (destello neón rock retro) */}
              {activeEffect === 'abbey-road' && (
                <div className="animate-abbey-road flex flex-col items-center leading-tight">
                  <h3 className={`text-xl sm:text-2xl lg:text-3xl font-black tracking-widest ${textColor} uppercase drop-shadow-md`}>
                    {sponsor.name}
                  </h3>
                  {sponsor.address && (
                    <p className={`text-xs sm:text-sm font-extrabold tracking-[0.2em] ${subtextColor} uppercase drop-shadow-md mt-1 sm:mt-1.5`}>
                      {sponsor.address}
                    </p>
                  )}
                </div>
              )}

              {/* EFECTO: BENDU ARENA (balanceo 3D y resplandor áureo) */}
              {activeEffect === 'bendu' && (
                <div className="animate-bendu flex flex-col items-center leading-tight">
                  <h3 className={`text-xl sm:text-2xl lg:text-3xl font-black tracking-widest ${textColor} uppercase drop-shadow-lg`}>
                    {sponsor.name}
                  </h3>
                  {sponsor.address && (
                    <p className={`text-[11px] sm:text-xs font-extrabold tracking-[0.18em] ${subtextColor} uppercase drop-shadow-md mt-1 sm:mt-1.5 text-center`}>
                      {sponsor.address}
                    </p>
                  )}
                </div>
              )}

              {/* EFECTO: ARENA MDP (expansión rítmica de tracking) */}
              {activeEffect === 'arena-mdp' && (
                <div className="animate-arena-mdp flex flex-col items-center leading-tight">
                  <h3 className={`text-lg sm:text-2xl lg:text-3xl font-black tracking-wider ${textColor} uppercase drop-shadow-md`}>
                    {sponsor.name}
                  </h3>
                  {sponsor.address && (
                    <p className={`text-xs sm:text-sm font-extrabold tracking-[0.22em] ${subtextColor} uppercase drop-shadow-md mt-1 sm:mt-1.5`}>
                      {sponsor.address}
                    </p>
                  )}
                </div>
              )}

              {/* EFECTO: PLAZA DE LA MÚSICA (pulso musical ecualizador) */}
              {activeEffect === 'plaza-musica' && (
                <div className="animate-plaza-musica flex flex-col items-center leading-tight">
                  <h3 className={`text-lg sm:text-2xl lg:text-3xl font-black tracking-wider ${textColor} uppercase drop-shadow-lg`}>
                    {sponsor.name}
                  </h3>
                  {sponsor.address && (
                    <p className={`text-xs sm:text-sm font-extrabold tracking-[0.22em] ${subtextColor} uppercase drop-shadow-md mt-1 sm:mt-1.5`}>
                      {sponsor.address}
                    </p>
                  )}
                </div>
              )}

              {/* EFECTO: MUTE (ola marina esmeralda) */}
              {activeEffect === 'mute' && (
                <div className="animate-mute-wave flex flex-col items-center leading-tight">
                  <h3 className={`text-xl sm:text-2xl lg:text-3xl font-black tracking-[0.25em] ${textColor} uppercase drop-shadow-lg`}>
                    {sponsor.name}
                  </h3>
                  {sponsor.address && (
                    <p className={`text-xs sm:text-sm font-extrabold tracking-[0.22em] ${subtextColor} uppercase drop-shadow-md mt-1 sm:mt-1.5`}>
                      {sponsor.address}
                    </p>
                  )}
                </div>
              )}

              {/* EFECTO: RADIO CITY (marquesina broadway) */}
              {activeEffect === 'radio-city' && (
                <div className="animate-radio-city flex flex-col items-center leading-tight">
                  <h3 className={`text-lg sm:text-2xl lg:text-3xl font-black tracking-wider ${textColor} uppercase drop-shadow-lg`}>
                    {sponsor.name}
                  </h3>
                  {sponsor.address && (
                    <p className={`text-xs sm:text-sm font-extrabold tracking-[0.22em] ${subtextColor} uppercase drop-shadow-md mt-1 sm:mt-1.5`}>
                      {sponsor.address}
                    </p>
                  )}
                </div>
              )}

              {/* EFECTO: CYBER NEON (pulso eléctrico futurista) */}
              {activeEffect === 'cyber-neon' && (
                <div className="animate-cyber-neon flex flex-col items-center leading-tight">
                  <h3 className={`text-xl sm:text-2xl lg:text-3xl font-black tracking-widest text-cyan-300 uppercase drop-shadow-lg`}>
                    {sponsor.name}
                  </h3>
                  {sponsor.address && (
                    <p className={`text-xs sm:text-sm font-extrabold tracking-[0.2em] text-pink-300 uppercase drop-shadow-md mt-1 sm:mt-1.5`}>
                      {sponsor.address}
                    </p>
                  )}
                </div>
              )}

              {/* EFECTO: GOLDEN SHIMMER (resplandor dorado prestigioso) */}
              {activeEffect === 'golden-shimmer' && (
                <div className="animate-golden-shimmer flex flex-col items-center leading-tight">
                  <h3 className={`text-xl sm:text-2xl lg:text-3xl font-black tracking-widest text-amber-300 uppercase drop-shadow-lg`}>
                    {sponsor.name}
                  </h3>
                  {sponsor.address && (
                    <p className={`text-xs sm:text-sm font-extrabold tracking-[0.2em] text-amber-100 uppercase drop-shadow-md mt-1 sm:mt-1.5`}>
                      {sponsor.address}
                    </p>
                  )}
                </div>
              )}

              {/* EFECTO: RETRO BOUNCE (rebote cinético) */}
              {activeEffect === 'retro-bounce' && (
                <div className="animate-retro-bounce flex flex-col items-center leading-tight">
                  <h3 className={`text-xl sm:text-2xl lg:text-3xl font-black tracking-widest ${textColor} uppercase drop-shadow-md`}>
                    {sponsor.name}
                  </h3>
                  {sponsor.address && (
                    <p className={`text-xs sm:text-sm font-extrabold tracking-[0.18em] ${subtextColor} uppercase drop-shadow-md mt-1 sm:mt-1.5`}>
                      {sponsor.address}
                    </p>
                  )}
                </div>
              )}

              {/* EFECTO: FLOAT GLOW (flotación mística) */}
              {activeEffect === 'float-glow' && (
                <div className="animate-float-glow flex flex-col items-center leading-tight">
                  <h3 className={`text-xl sm:text-2xl lg:text-3xl font-black tracking-widest ${textColor} uppercase drop-shadow-lg`}>
                    {sponsor.name}
                  </h3>
                  {sponsor.address && (
                    <p className={`text-xs sm:text-sm font-extrabold tracking-[0.2em] ${subtextColor} uppercase drop-shadow-md mt-1 sm:mt-1.5`}>
                      {sponsor.address}
                    </p>
                  )}
                </div>
              )}

            </div>
          </div>
        </>
      )}

      {/* Indicador de Espacio Publicitario / Sponsor */}
      {showBadge && (
        <div className="absolute top-2 right-2 z-20 pointer-events-none">
          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-black/60 text-amber-300/90 border border-amber-500/30 backdrop-blur-md uppercase tracking-wider">
            Sponsor
          </span>
        </div>
      )}
    </div>
  );

  // Si tiene link de destino, lo envuelve en enlace <a> accesible
  if (sponsor.link && variant !== 'preview') {
    return (
      <a
        href={sponsor.link}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className="block cursor-pointer"
        title={`${sponsor.name} — ${sponsor.address || 'Sponsor Oficial'} (Clic para visitar)`}
      >
        {cardContent}
      </a>
    );
  }

  return (
    <div onClick={handleClick} className={onClick ? 'cursor-pointer' : ''}>
      {cardContent}
    </div>
  );
};
