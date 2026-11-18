import React, { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Sparkles, Image as ImageIcon } from 'lucide-react';
import { Sponsor, SponsorEffectType } from '../types';
import { trackBannerClick } from '../services/metricsService';
import { safeHttpUrl } from '../utils/safeUrl';

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

// Dirección escrita a máquina: se escribe, queda unos segundos, se borra y vuelve a empezar.
// El texto completo se reserva (invisible) para que no se mueva mientras se escribe.
const TypedAddress: React.FC<{ text: string }> = ({ text }) => {
  const [shown, setShown] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const reduce = typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setReduceMotion(reduce);
    if (reduce) {
      setShown(text.length);
      return;
    }
    let cancelled = false;
    let timer: number | undefined;
    let i = 0;
    let typing = true;
    const tick = () => {
      if (cancelled) return;
      if (typing) {
        i += 1;
        setShown(i);
        if (i >= text.length) {
          typing = false;
          timer = window.setTimeout(tick, 3800);
          return;
        }
        timer = window.setTimeout(tick, 70);
      } else {
        i -= 1;
        setShown(i);
        if (i <= 0) {
          typing = true;
          timer = window.setTimeout(tick, 700);
          return;
        }
        timer = window.setTimeout(tick, 22);
      }
    };
    setShown(0);
    timer = window.setTimeout(tick, 600);
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [text]);

  return (
    <span className="relative inline-block">
      <span className="invisible">{text}</span>
      <span className="absolute left-0 top-0 whitespace-nowrap">
        {text.slice(0, shown)}
        {!reduceMotion && (
          <span
            aria-hidden="true"
            className="animate-sponsor-caret inline-block bg-current ml-[2px]"
            style={{ width: '0.09em', height: '1em', verticalAlign: '-0.12em' }}
          />
        )}
      </span>
    </span>
  );
};

// Sponsor con imagen completa: encuadre (zoom y desplazamiento), flote suave, brillo y dirección a máquina.
const SponsorArt: React.FC<{ sponsor: Sponsor }> = ({ sponsor }) => {
  const [ratio, setRatio] = useState<number | null>(null);
  // Color de fondo del arte (si la imagen tiene el fondo liso, se usa ese mismo color para rellenar los costados)
  const [bgColor, setBgColor] = useState<string | null>(null);
  // Color elegido a mano en el admin (#rrggbb): si existe, manda sobre la detección automática
  const manualBg = /^#[0-9a-fA-F]{6}$/.test(sponsor.imageBg ?? '') ? (sponsor.imageBg as string) : null;
  const fillColor = manualBg ?? bgColor;
  const address = (sponsor.address || '').trim();
  const showTyped = !!sponsor.typeAddress && address.length > 0;

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: fillColor ?? '#dfd3c5' }}>
      {/* Sin color elegido ni detectado: se rellena con el color de la esquina superior izquierda de la propia imagen
          (se amplía esa esquina hasta cubrir todo; es CSS puro y no depende de leer los píxeles) */}
      {!fillColor && (
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${JSON.stringify(sponsor.image)})`,
            backgroundSize: '2500% 2500%',
            backgroundPosition: '0% 0%',
            backgroundRepeat: 'no-repeat',
          }}
        />
      )}
      {/* Encuadre elegido en el admin: zoom y desplazamiento (en % del marco, sirve para cualquier tamaño de tarjeta) */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          containerType: 'size',
          transform: `translate(${sponsor.imageOffsetX ?? 0}%, ${sponsor.imageOffsetY ?? 0}%) scale(${sponsor.imageZoom ?? 1})`,
          transformOrigin: 'center',
        }}
      >
        {/* Caja con la proporción real de la imagen: así la dirección queda siempre sobre el mismo lugar del arte */}
        <div
          className="relative"
          style={
            ratio
              ? { containerType: 'inline-size', aspectRatio: String(ratio), width: `min(100cqw, calc(100cqh * ${ratio}))` }
              : { width: '100%', height: '100%' }
          }
        >
          <img
            src={sponsor.image}
            alt={sponsor.name}
            draggable={false}
            onLoad={(e) => {
              const img = e.currentTarget;
              const { naturalWidth, naturalHeight } = img;
              if (naturalWidth && naturalHeight) setRatio(naturalWidth / naturalHeight);
              // Lee el color de las 4 esquinas de la imagen: si son parecidas, el fondo es liso y se usa ese color
              try {
                const N = 32;
                const canvas = document.createElement('canvas');
                canvas.width = N;
                canvas.height = N;
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                if (!ctx) return;
                ctx.drawImage(img, 0, 0, N, N);
                const corners = [
                  ctx.getImageData(0, 0, 1, 1).data,
                  ctx.getImageData(N - 1, 0, 1, 1).data,
                  ctx.getImageData(0, N - 1, 1, 1).data,
                  ctx.getImageData(N - 1, N - 1, 1, 1).data,
                ];
                const avg = [0, 1, 2].map(i => Math.round(corners.reduce((sum, c) => sum + c[i], 0) / 4));
                const similar = corners.every(c => [0, 1, 2].every(i => Math.abs(c[i] - avg[i]) <= 12) && c[3] === 255);
                setBgColor(similar ? `rgb(${avg[0]}, ${avg[1]}, ${avg[2]})` : null);
              } catch {
                // Imagen de otro sitio que no permite leer sus píxeles: queda el fondo desenfocado
                setBgColor(null);
              }
            }}
            className="absolute inset-0 w-full h-full object-contain animate-sponsor-art"
            referrerPolicy="no-referrer"
          />
          {showTyped && ratio && (
            <div
              className="absolute left-0 right-0 text-center uppercase pointer-events-none"
              style={{
                top: '79%',
                lineHeight: 1,
                fontFamily: 'Verdana, Geneva, sans-serif',
                fontWeight: 700,
                letterSpacing: '0.03em',
                color: '#1d1a17',
                fontSize: 'max(10px, 2.6cqw)',
                whiteSpace: 'nowrap',
              }}
            >
              <TypedAddress text={address} />
            </div>
          )}
        </div>
      </div>
      {/* Brillo dorado que cruza de costado */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="animate-sponsor-sheen absolute top-0 -left-[30%] h-full w-[22%]" />
      </div>
      {sponsor.link && (
        <span className="absolute bottom-1.5 right-2 z-10 p-1 px-1.5 rounded-lg bg-black/55 backdrop-blur-md text-amber-300 border border-amber-500/40 text-[10px] font-bold flex items-center gap-1 group-hover:bg-amber-500 group-hover:text-black transition-colors">
          <span>Ver</span>
          <ExternalLink className="w-3 h-3" />
        </span>
      )}
    </div>
  );
};

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

  // Colores personalizados: se guardan como HEX (#rrggbb). El fondo puede ser "#color1" o "#color1|#color2" (degradado).
  const isHex = (v: string) => /^#[0-9a-fA-F]{3,8}$/.test(v.trim());
  const customBg = bgColor.startsWith('#');
  const [bgFrom, bgTo] = customBg ? bgColor.split('|') : ['', ''];
  const bgClass = customBg ? '' : bgColor;
  const bgStyle: React.CSSProperties = customBg && isHex(bgFrom)
    ? { background: bgTo && isHex(bgTo) ? `linear-gradient(135deg, ${bgFrom}, ${bgTo})` : bgFrom }
    : {};
  const titleClass = isHex(textColor) ? '' : textColor;
  const titleStyle: React.CSSProperties | undefined = isHex(textColor) ? { color: textColor } : undefined;
  const subtitleClass = isHex(subtextColor) ? '' : subtextColor;
  const subtitleStyle: React.CSSProperties | undefined = isHex(subtextColor) ? { color: subtextColor } : undefined;

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
      className={`relative w-full ${heightClass} rounded-2xl overflow-hidden transition-all duration-500 group select-none ${bgClass} ${
        isFading ? 'opacity-0 scale-[0.98]' : 'opacity-100 scale-100'
      } ${className}`}
      style={{
        ...bgStyle,
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
      ) : isImageSponsor && sponsor.imageFit === 'contain' ? (
        <SponsorArt sponsor={sponsor} />
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
                  <h3 className={`text-xl sm:text-2xl lg:text-3xl font-black tracking-widest ${titleClass} uppercase font-sans drop-shadow-lg leading-tight select-none`} style={titleStyle}>
                    {(() => {
                      // Cada palabra va en un bloque propio y entre palabras queda un espacio normal
                      // (un espacio suelto dentro de un <span> en línea se perdía y las palabras salían pegadas)
                      let letterIndex = 0;
                      return (sponsor.name || '')
                        .trim()
                        .split(/\s+/)
                        .map((word, wordIndex) => {
                          const letters = word.split('').map((char) => {
                            const i = letterIndex++;
                            return (
                              <span
                                key={i}
                                className="animate-bruto-letter"
                                style={{ animationDelay: `${i * 0.12}s` }}
                              >
                                {char}
                              </span>
                            );
                          });
                          letterIndex++; // el espacio también ocupa un lugar en el ritmo de la animación
                          return (
                            <React.Fragment key={wordIndex}>
                              {wordIndex > 0 ? ' ' : null}
                              <span className="inline-block whitespace-nowrap">{letters}</span>
                            </React.Fragment>
                          );
                        });
                    })()}
                  </h3>
                  {sponsor.address && (
                    <div className="animate-bruto-location mt-1 sm:mt-1.5">
                      <p className={`text-xs sm:text-sm font-extrabold tracking-[0.25em] ${subtitleClass} uppercase drop-shadow-md`} style={subtitleStyle}>
                        {sponsor.address}
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* EFECTO: ABBEY ROAD (destello neón rock retro) */}
              {activeEffect === 'abbey-road' && (
                <div className="animate-abbey-road flex flex-col items-center leading-tight">
                  <h3 className={`text-xl sm:text-2xl lg:text-3xl font-black tracking-widest ${titleClass} uppercase drop-shadow-md`} style={titleStyle}>
                    {sponsor.name}
                  </h3>
                  {sponsor.address && (
                    <p className={`text-xs sm:text-sm font-extrabold tracking-[0.2em] ${subtitleClass} uppercase drop-shadow-md mt-1 sm:mt-1.5`} style={subtitleStyle}>
                      {sponsor.address}
                    </p>
                  )}
                </div>
              )}

              {/* EFECTO: BENDU ARENA (balanceo 3D y resplandor áureo) */}
              {activeEffect === 'bendu' && (
                <div className="animate-bendu flex flex-col items-center leading-tight">
                  <h3 className={`text-xl sm:text-2xl lg:text-3xl font-black tracking-widest ${titleClass} uppercase drop-shadow-lg`} style={titleStyle}>
                    {sponsor.name}
                  </h3>
                  {sponsor.address && (
                    <p className={`text-[11px] sm:text-xs font-extrabold tracking-[0.18em] ${subtitleClass} uppercase drop-shadow-md mt-1 sm:mt-1.5 text-center`} style={subtitleStyle}>
                      {sponsor.address}
                    </p>
                  )}
                </div>
              )}

              {/* EFECTO: ARENA MDP (expansión rítmica de tracking) */}
              {activeEffect === 'arena-mdp' && (
                <div className="animate-arena-mdp flex flex-col items-center leading-tight">
                  <h3 className={`text-lg sm:text-2xl lg:text-3xl font-black tracking-wider ${titleClass} uppercase drop-shadow-md`} style={titleStyle}>
                    {sponsor.name}
                  </h3>
                  {sponsor.address && (
                    <p className={`text-xs sm:text-sm font-extrabold tracking-[0.22em] ${subtitleClass} uppercase drop-shadow-md mt-1 sm:mt-1.5`} style={subtitleStyle}>
                      {sponsor.address}
                    </p>
                  )}
                </div>
              )}

              {/* EFECTO: PLAZA DE LA MÚSICA (pulso musical ecualizador) */}
              {activeEffect === 'plaza-musica' && (
                <div className="animate-plaza-musica flex flex-col items-center leading-tight">
                  <h3 className={`text-lg sm:text-2xl lg:text-3xl font-black tracking-wider ${titleClass} uppercase drop-shadow-lg`} style={titleStyle}>
                    {sponsor.name}
                  </h3>
                  {sponsor.address && (
                    <p className={`text-xs sm:text-sm font-extrabold tracking-[0.22em] ${subtitleClass} uppercase drop-shadow-md mt-1 sm:mt-1.5`} style={subtitleStyle}>
                      {sponsor.address}
                    </p>
                  )}
                </div>
              )}

              {/* EFECTO: MUTE (ola marina esmeralda) */}
              {activeEffect === 'mute' && (
                <div className="animate-mute-wave flex flex-col items-center leading-tight">
                  <h3 className={`text-xl sm:text-2xl lg:text-3xl font-black tracking-[0.25em] ${titleClass} uppercase drop-shadow-lg`} style={titleStyle}>
                    {sponsor.name}
                  </h3>
                  {sponsor.address && (
                    <p className={`text-xs sm:text-sm font-extrabold tracking-[0.22em] ${subtitleClass} uppercase drop-shadow-md mt-1 sm:mt-1.5`} style={subtitleStyle}>
                      {sponsor.address}
                    </p>
                  )}
                </div>
              )}

              {/* EFECTO: RADIO CITY (marquesina broadway) */}
              {activeEffect === 'radio-city' && (
                <div className="animate-radio-city flex flex-col items-center leading-tight">
                  <h3 className={`text-lg sm:text-2xl lg:text-3xl font-black tracking-wider ${titleClass} uppercase drop-shadow-lg`} style={titleStyle}>
                    {sponsor.name}
                  </h3>
                  {sponsor.address && (
                    <p className={`text-xs sm:text-sm font-extrabold tracking-[0.22em] ${subtitleClass} uppercase drop-shadow-md mt-1 sm:mt-1.5`} style={subtitleStyle}>
                      {sponsor.address}
                    </p>
                  )}
                </div>
              )}

              {/* EFECTO: CYBER NEON (pulso eléctrico futurista) */}
              {activeEffect === 'cyber-neon' && (
                <div className="animate-cyber-neon flex flex-col items-center leading-tight">
                  <h3 className={`text-xl sm:text-2xl lg:text-3xl font-black tracking-widest text-cyan-300 uppercase drop-shadow-lg`} style={titleStyle}>
                    {sponsor.name}
                  </h3>
                  {sponsor.address && (
                    <p className={`text-xs sm:text-sm font-extrabold tracking-[0.2em] text-pink-300 uppercase drop-shadow-md mt-1 sm:mt-1.5`} style={subtitleStyle}>
                      {sponsor.address}
                    </p>
                  )}
                </div>
              )}

              {/* EFECTO: GOLDEN SHIMMER (resplandor dorado prestigioso) */}
              {activeEffect === 'golden-shimmer' && (
                <div className="animate-golden-shimmer flex flex-col items-center leading-tight">
                  <h3 className={`text-xl sm:text-2xl lg:text-3xl font-black tracking-widest text-amber-300 uppercase drop-shadow-lg`} style={titleStyle}>
                    {sponsor.name}
                  </h3>
                  {sponsor.address && (
                    <p className={`text-xs sm:text-sm font-extrabold tracking-[0.2em] text-amber-100 uppercase drop-shadow-md mt-1 sm:mt-1.5`} style={subtitleStyle}>
                      {sponsor.address}
                    </p>
                  )}
                </div>
              )}

              {/* EFECTO: RETRO BOUNCE (rebote cinético) */}
              {activeEffect === 'retro-bounce' && (
                <div className="animate-retro-bounce flex flex-col items-center leading-tight">
                  <h3 className={`text-xl sm:text-2xl lg:text-3xl font-black tracking-widest ${titleClass} uppercase drop-shadow-md`} style={titleStyle}>
                    {sponsor.name}
                  </h3>
                  {sponsor.address && (
                    <p className={`text-xs sm:text-sm font-extrabold tracking-[0.18em] ${subtitleClass} uppercase drop-shadow-md mt-1 sm:mt-1.5`} style={subtitleStyle}>
                      {sponsor.address}
                    </p>
                  )}
                </div>
              )}

              {/* EFECTO: FLOAT GLOW (flotación mística) */}
              {activeEffect === 'float-glow' && (
                <div className="animate-float-glow flex flex-col items-center leading-tight">
                  <h3 className={`text-xl sm:text-2xl lg:text-3xl font-black tracking-widest ${titleClass} uppercase drop-shadow-lg`} style={titleStyle}>
                    {sponsor.name}
                  </h3>
                  {sponsor.address && (
                    <p className={`text-xs sm:text-sm font-extrabold tracking-[0.2em] ${subtitleClass} uppercase drop-shadow-md mt-1 sm:mt-1.5`} style={subtitleStyle}>
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
  const safeLink = safeHttpUrl(sponsor.link);
  if (safeLink && variant !== 'preview') {
    return (
      <a
        href={safeLink}
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
