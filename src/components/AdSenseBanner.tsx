import React, { useState, useEffect } from 'react';
import { Sponsor } from '../types';
import { SponsorCard } from './SponsorCard';
import { ImpressionTracker } from './ImpressionTracker';
import { INITIAL_SPONSORS } from '../data/mockSponsors';

export const VENUE_SPONSORS = INITIAL_SPONSORS;

interface AdSenseBannerProps {
  format?: 'horizontal' | 'in-feed' | 'timeline-double';
  className?: string;
  initialOffset?: number;
  sponsors?: Sponsor[];
  isTopBanner?: boolean; // Si es true, SOLO muestra los que el admin marcó para "los dos primeros"
}

export const AdSenseBanner: React.FC<AdSenseBannerProps> = ({
  className = '',
  initialOffset = 0,
  sponsors,
  isTopBanner = false,
}) => {
  // Obtener sponsors activos según la ubicación solicitada
  const activeSponsorsList = React.useMemo(() => {
    // Sin sponsors repetidos (por id) en la lista
    const dedupe = (arr: Sponsor[]) => arr.filter((s, i) => arr.findIndex((o) => o.id === s.id) === i);
    const list = dedupe((sponsors && sponsors.length > 0) ? sponsors : INITIAL_SPONSORS);
    
    if (isTopBanner) {
      // "en los dos primeros ( ahi solo tienen que aparecer los que yo marco )"
      const markedForTop = list.filter(s => s.isActive !== false && s.showInTopBanner === true);
      if (markedForTop.length > 0) {
        return markedForTop;
      }
      // Fallback seguro si todavía no marcó ninguno para no dejar el espacio en blanco
      return list.filter(s => s.isActive !== false).slice(0, 2);
    }

    // Para el resto de la página / feed:
    const markedForFeed = list.filter(s => s.isActive !== false && s.showInFeed !== false);
    return markedForFeed.length > 0 ? markedForFeed : list.filter(s => s.isActive !== false);
  }, [sponsors, isTopBanner]);

  // Los sponsors se reparten en dos grupos que NO comparten ningún aviso:
  // la tarjeta izquierda rota entre los de posición par y la derecha entre los de posición impar.
  // Así, los dos banners que van juntos nunca muestran el mismo sponsor.
  const leftPool = React.useMemo(() => activeSponsorsList.filter((_, i) => i % 2 === 0), [activeSponsorsList]);
  const rightPool = React.useMemo(() => activeSponsorsList.filter((_, i) => i % 2 === 1), [activeSponsorsList]);
  const poolLength = activeSponsorsList.length;

  const startOffset = Math.floor(initialOffset / 2);
  const [leftIndex, setLeftIndex] = useState(0);
  const [isLeftFading, setIsLeftFading] = useState(false);
  const [rightIndex, setRightIndex] = useState(0);
  const [isRightFading, setIsRightFading] = useState(false);

  // Reiniciar posiciones cuando cambia la lista de sponsors
  useEffect(() => {
    setLeftIndex(leftPool.length > 0 ? startOffset % leftPool.length : 0);
    setRightIndex(rightPool.length > 0 ? startOffset % rightPool.length : 0);
  }, [leftPool.length, rightPool.length, startOffset]);

  // Rotación ALTERNADA con un único reloj: cada 5 segundos cambia una sola tarjeta,
  // primero la izquierda y 5 segundos después la derecha. Nunca cambian a la vez.
  // Cada banner de la página arranca con un pequeño desfase propio para que tampoco cambien todos juntos.
  useEffect(() => {
    const canRotateLeft = leftPool.length > 1;
    const canRotateRight = rightPool.length > 1;
    if (!canRotateLeft && !canRotateRight) return;

    const phaseMs = (startOffset % 4) * 1250;
    let turn = 0;
    let interval: ReturnType<typeof setInterval> | undefined;
    let fadeTimeout: ReturnType<typeof setTimeout> | undefined;

    const rotateNext = () => {
      const isLeftTurn = turn % 2 === 0;
      turn += 1;
      if (isLeftTurn && canRotateLeft) {
        setIsLeftFading(true);
        fadeTimeout = setTimeout(() => {
          setLeftIndex((prev) => (prev + 1) % leftPool.length);
          setIsLeftFading(false);
        }, 500);
      } else if (!isLeftTurn && canRotateRight) {
        setIsRightFading(true);
        fadeTimeout = setTimeout(() => {
          setRightIndex((prev) => (prev + 1) % rightPool.length);
          setIsRightFading(false);
        }, 500);
      }
    };

    const startTimeout = setTimeout(() => {
      interval = setInterval(rotateNext, 5000);
    }, phaseMs);

    return () => {
      clearTimeout(startTimeout);
      if (interval) clearInterval(interval);
      if (fadeTimeout) clearTimeout(fadeTimeout);
    };
  }, [leftPool.length, rightPool.length, startOffset]);

  const firstSponsor = leftPool[leftIndex % Math.max(leftPool.length, 1)];
  const secondSponsor = rightPool.length > 0 ? rightPool[rightIndex % rightPool.length] : undefined;

  if (poolLength === 0 || !firstSponsor) return null;

  return (
    <aside
      aria-label="Espacio publicitario"
      className={`w-full my-6 ${className}`}
    >
      {/* Con un solo sponsor se muestra una única tarjeta (nunca el mismo aviso dos veces) */}
      <div className={`grid grid-cols-1 gap-4 ${secondSponsor ? 'sm:grid-cols-2' : ''}`}>
        <ImpressionTracker sponsor={firstSponsor}>
          <SponsorCard
            sponsor={firstSponsor}
            heightClass="h-28 sm:h-32"
            isFading={isLeftFading}
            showBadge={false}
          />
        </ImpressionTracker>
        {secondSponsor && (
          <ImpressionTracker sponsor={secondSponsor}>
            <SponsorCard
              sponsor={secondSponsor}
              heightClass="h-28 sm:h-32"
              isFading={isRightFading}
              showBadge={false}
            />
          </ImpressionTracker>
        )}
      </div>
    </aside>
  );
};
