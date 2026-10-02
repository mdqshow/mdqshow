import React, { useState, useEffect } from 'react';
import { Sponsor } from '../types';
import { SponsorCard } from './SponsorCard';
import { trackBannerImpression } from '../services/metricsService';
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
    const list = (sponsors && sponsors.length > 0) ? sponsors : INITIAL_SPONSORS;
    
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

  const poolLength = activeSponsorsList.length;

  // Rotación desfasada independiente para cada columna (izq y der)
  // Tarjeta Izquierda (columna 1): arranca en initialOffset
  const [leftIndex, setLeftIndex] = useState(() => (poolLength > 0 ? initialOffset % poolLength : 0));
  const [isLeftFading, setIsLeftFading] = useState(false);

  // Tarjeta Derecha (columna 2): arranca desfasada respecto a la izquierda
  const [rightIndex, setRightIndex] = useState(() => (poolLength > 1 ? (initialOffset + 1) % poolLength : 0));
  const [isRightFading, setIsRightFading] = useState(false);

  // Reset indices when pool changes
  useEffect(() => {
    if (poolLength > 0) {
      setLeftIndex(initialOffset % poolLength);
      setRightIndex(poolLength > 1 ? (initialOffset + 1) % poolLength : 0);
    }
  }, [poolLength, initialOffset]);

  // Si hay más de 1 sponsor disponible, alternamos con rotación suave
  // Ciclo para la tarjeta IZQUIERDA: cambia cada 10 segundos
  useEffect(() => {
    if (poolLength <= 2 && isTopBanner) return; // Si en los dos primeros hay exactamente los marcados fijos, no rotan agresivamente
    if (poolLength <= 1) return;

    const leftInterval = setInterval(() => {
      setIsLeftFading(true);
      setTimeout(() => {
        setLeftIndex((prev) => (prev + 2) % poolLength);
        setIsLeftFading(false);
      }, 500);
    }, 10000);

    return () => clearInterval(leftInterval);
  }, [poolLength, isTopBanner]);

  // Ciclo para la tarjeta DERECHA: desfasado 5 segundos
  useEffect(() => {
    if (poolLength <= 2 && isTopBanner) return;
    if (poolLength <= 1) return;

    let rightInterval: NodeJS.Timeout;
    const timeout = setTimeout(() => {
      setIsRightFading(true);
      setTimeout(() => {
        setRightIndex((prev) => (prev + 2) % poolLength);
        setIsRightFading(false);
      }, 500);

      rightInterval = setInterval(() => {
        setIsRightFading(true);
        setTimeout(() => {
          setRightIndex((prev) => (prev + 2) % poolLength);
          setIsRightFading(false);
        }, 500);
      }, 10000);
    }, 5000);

    return () => {
      clearTimeout(timeout);
      if (rightInterval) clearInterval(rightInterval);
    };
  }, [poolLength, isTopBanner]);

  const firstSponsor = activeSponsorsList[leftIndex % poolLength] || activeSponsorsList[0];
  const secondSponsor = activeSponsorsList[rightIndex % poolLength] || activeSponsorsList[Math.min(1, poolLength - 1)] || firstSponsor;

  // Registrar impresiones en métricas
  useEffect(() => {
    if (firstSponsor) {
      trackBannerImpression(firstSponsor.id, firstSponsor.name, firstSponsor.address || '');
    }
  }, [firstSponsor]);

  useEffect(() => {
    if (secondSponsor && secondSponsor.id !== firstSponsor?.id) {
      trackBannerImpression(secondSponsor.id, secondSponsor.name, secondSponsor.address || '');
    }
  }, [secondSponsor, firstSponsor]);

  if (poolLength === 0) return null;

  return (
    <aside 
      aria-label="Espacio de Sponsors y Publicidad"
      className={`w-full my-6 ${className}`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SponsorCard 
          sponsor={firstSponsor} 
          heightClass="h-28 sm:h-32" 
          isFading={isLeftFading} 
          showBadge={true}
        />
        {/* En caso de que solo haya un único sponsor en la lista, mostramos el segundo o repetimos con estilo */}
        <SponsorCard 
          sponsor={secondSponsor} 
          heightClass="h-28 sm:h-32" 
          isFading={isRightFading} 
          showBadge={true}
        />
      </div>
    </aside>
  );
};
