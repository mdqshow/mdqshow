import React, { useEffect, useRef, useState } from 'react';
import { Sponsor } from '../types';
import { trackBannerImpression } from '../services/metricsService';

interface ImpressionTrackerProps {
  sponsor: Sponsor;
  children: React.ReactNode;
}

/**
 * Cuenta una visualización de banner SOLO cuando de verdad se está viendo:
 * al menos la mitad del banner dentro de la pantalla, durante 1 segundo seguido, con la pestaña activa.
 */
export const ImpressionTracker: React.FC<ImpressionTrackerProps> = ({ sponsor, children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [tabActive, setTabActive] = useState(() => (typeof document === 'undefined' ? true : !document.hidden));

  useEffect(() => {
    const onVisibility = () => setTabActive(!document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting && entry.intersectionRatio >= 0.5),
      { threshold: [0, 0.5, 1] }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || !tabActive || !sponsor?.id) return;
    const timer = window.setTimeout(() => {
      trackBannerImpression(sponsor.id, sponsor.name, sponsor.address || '');
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [inView, tabActive, sponsor?.id, sponsor?.name, sponsor?.address]);

  return <div ref={ref}>{children}</div>;
};
