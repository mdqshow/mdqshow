import React, { useEffect } from 'react';
import { MdqBrandIcon } from './MdqBrandIcon';

const STYLES = `
@keyframes mdqBeamSweep {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
@keyframes mdqSoonIn {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
.mdq-soon-beam  { animation: mdqBeamSweep 16s linear infinite; }
.mdq-soon-copy  { animation: mdqSoonIn 1.1s cubic-bezier(0.22, 1, 0.36, 1) 0.2s both; }
@media (prefers-reduced-motion: reduce) {
  .mdq-soon-beam, .mdq-soon-copy { animation: none; }
}
`;

/**
 * Pantalla provisoria de MDQSHOW mientras la web principal no está operativa.
 * Un haz de luz de faro barre toda la pantalla desde el ícono.
 */
export const ComingSoon: React.FC = () => {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'MDQSHOW | En breve';
    return () => {
      document.title = previousTitle;
    };
  }, []);

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[#0e1117] text-slate-100 flex items-center justify-center px-6">
      <style>{STYLES}</style>

      <div className="relative z-10 flex flex-col items-center text-center max-w-xl">
        {/* Faro + haz de luz que gira sobre toda la pantalla */}
        <div className="relative w-32 h-32 sm:w-40 sm:h-40">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 w-[240vmax] h-[240vmax] -translate-x-1/2 -translate-y-1/2"
            style={{
              WebkitMaskImage: 'radial-gradient(circle closest-side, #000 6%, transparent 62%)',
              maskImage: 'radial-gradient(circle closest-side, #000 6%, transparent 62%)',
            }}
          >
            <div
              className="mdq-soon-beam w-full h-full"
              style={{
                background:
                  'conic-gradient(from 0deg, rgba(255,240,205,0.20) 0deg, rgba(255,240,205,0.07) 14deg, transparent 34deg, transparent 360deg)',
              }}
            />
          </div>

          <div className="relative w-full h-full rounded-3xl bg-slate-950 border border-rose-500/50 shadow-2xl shadow-rose-950/60 p-2 overflow-hidden">
            <MdqBrandIcon className="w-full h-full" />
          </div>
        </div>

        <div className="mdq-soon-copy">
          <h1 className="mt-10 font-mono font-black tracking-tight leading-none text-5xl sm:text-7xl text-white">
            MDQ<span className="text-rose-500">SHOW</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-200 leading-relaxed">
            En breve, toda la cartelera de recitales y shows de Mar del Plata en un solo lugar.
          </p>
          <p className="mt-3 text-sm text-slate-400">Estamos terminando los últimos detalles.</p>
        </div>
      </div>
    </main>
  );
};

export default ComingSoon;
