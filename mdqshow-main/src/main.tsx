import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { ComingSoon } from './components/ComingSoon.tsx';
import './index.css';

// La web completa se carga solo cuando hace falta (así la pantalla "En breve" es liviana)
const App = lazy(() => import('./App.tsx'));

/**
 * INTERRUPTOR DE LANZAMIENTO
 * false = la web pública (/) muestra solo la pantalla "En breve"; la cartelera completa se ve en /test y el panel en /admin
 * true  = la cartelera completa se ve en todo el sitio (lanzamiento oficial)
 */
const SITE_PUBLIC = false;

// Rutas que muestran la cartelera completa aunque la web todavía no sea pública:
// /test (pruebas) y /admin (panel de administración)
function isOpenRoute(): boolean {
  const path = window.location.pathname.toLowerCase().replace(/\/+$/, '');
  const isTest = path === '/test' || path.startsWith('/test/');
  const isAdmin = path === '/admin' || path.endsWith('/admin') || window.location.hash.toLowerCase() === '#admin';
  return isTest || isAdmin;
}

const showFullSite = SITE_PUBLIC || isOpenRoute();

// La versión de pruebas y el admin no tienen que aparecer en Google
if (showFullSite && !SITE_PUBLIC) {
  const meta = document.createElement('meta');
  meta.name = 'robots';
  meta.content = 'noindex, nofollow';
  document.head.appendChild(meta);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      {showFullSite ? (
        <Suspense fallback={<div className="min-h-screen bg-[#0e1117]" />}>
          <App />
        </Suspense>
      ) : (
        <ComingSoon />
      )}
    </ErrorBoundary>
  </StrictMode>,
);
