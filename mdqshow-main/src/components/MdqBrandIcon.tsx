import React from 'react';

interface MdqBrandIconProps {
  className?: string;
  size?: number;
  variant?: 'classic' | 'rocker';
}

/**
 * Ícono oficial de MDQSHOW:
 * Faro de Punta Mogotes con haz de luz blanco 3D girando sobre el eje del faro,
 * con óptica realista, perspectiva volumétrica y destello frontal.
 */
export const MdqBrandIcon: React.FC<MdqBrandIconProps> = ({ 
  className = "w-full h-full", 
  size = 32,
  variant = 'classic'
}) => {
  if (variant === 'rocker') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 54 54"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label="MDQSHOW - El Faro Rockero de Mar del Plata"
      >
        <style>{`
          @keyframes faroDanceSmooth {
            0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }
            30% { transform: translate3d(0, -2px, 0) rotate(-4deg); }
            70% { transform: translate3d(0, -2px, 0) rotate(4deg); }
          }
          @keyframes leftArmGroove {
            0%, 100% { transform: rotate(-10deg); }
            50% { transform: rotate(-28deg); }
          }
          @keyframes rightArmGroove {
            0%, 100% { transform: rotate(10deg); }
            50% { transform: rotate(28deg); }
          }
          .faro-body-groove {
            transform-origin: 27px 46px;
            animation: faroDanceSmooth 1.8s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
            will-change: transform;
          }
          .faro-left-arm {
            transform-origin: 20px 26px;
            animation: leftArmGroove 1.8s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
            will-change: transform;
          }
          .faro-right-arm {
            transform-origin: 34px 26px;
            animation: rightArmGroove 1.8s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite 0.15s;
            will-change: transform;
          }
        `}</style>
        <defs>
          <linearGradient id="sunglassesGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="45%" stopColor="#1e1b4b" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>
          <linearGradient id="micGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#64748b" />
          </linearGradient>
        </defs>
        <g className="faro-body-groove">
          <path d="M14 47 Q 20 44 27 47 T 40 47" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
          <path d="M17 50 Q 23 48 27 50 T 37 50" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
          <rect x="18" y="44" width="18" height="4" rx="2" fill="#334155" stroke="#1e293b" strokeWidth="1" />
          <path d="M23 15 L19 44 H35 L31 15 Z" fill="#e11d48" />
          <path d="M22.2 21 L21.5 26.5 H32.5 L31.8 21 Z" fill="#f8fafc" />
          <path d="M20.7 32.5 L20 38.5 H34 L33.3 32.5 Z" fill="#f8fafc" />
          <g className="faro-left-arm">
            <path d="M20 26 Q 10 24 9 17" stroke="#f8fafc" strokeWidth="3.2" strokeLinecap="round" />
            <rect x="7" y="16.5" width="4" height="2.5" rx="0.8" fill="#0f172a" transform="rotate(-25 9 17)" />
            <circle cx="9" cy="14" r="2.2" fill="#fb7185" />
            <path d="M7.5 13 L6.5 9" stroke="#fb7185" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M10.5 13 L11.5 9" stroke="#fb7185" strokeWidth="1.6" strokeLinecap="round" />
          </g>
          <g className="faro-right-arm">
            <path d="M34 26 Q 44 24 45 18" stroke="#f8fafc" strokeWidth="3.2" strokeLinecap="round" />
            <rect x="43" y="17.5" width="4" height="2.5" rx="0.8" fill="#0f172a" transform="rotate(25 45 18)" />
            <circle cx="45" cy="15" r="2.2" fill="#fb7185" />
            <path d="M45 17 L48 23" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
            <ellipse cx="44.2" cy="13.2" rx="2.5" ry="3" fill="url(#micGrad)" stroke="#0f172a" strokeWidth="0.8" />
            <line x1="42.5" y1="13.2" x2="46" y2="13.2" stroke="#475569" strokeWidth="0.7" />
          </g>
          <g id="rocker-sunglasses">
            <rect x="21" y="22" width="5.4" height="4.5" rx="1.5" fill="url(#sunglassesGrad)" stroke="#020617" strokeWidth="1" />
            <rect x="27.6" y="22" width="5.4" height="4.5" rx="1.5" fill="url(#sunglassesGrad)" stroke="#020617" strokeWidth="1" />
            <line x1="26.4" y1="23.8" x2="27.6" y2="23.8" stroke="#020617" strokeWidth="1.2" />
            <line x1="22.2" y1="25.2" x2="24.2" y2="23.2" stroke="#38bdf8" strokeWidth="1" strokeLinecap="round" opacity="0.8" />
            <line x1="28.8" y1="25.2" x2="30.8" y2="23.2" stroke="#38bdf8" strokeWidth="1" strokeLinecap="round" opacity="0.8" />
          </g>
          <path d="M24.5 28.5 Q 27 31 29.5 28.5" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <rect x="21" y="14" width="12" height="2" rx="0.8" fill="#1e293b" stroke="#f43f5e" strokeWidth="0.6" />
          <rect x="23" y="8" width="8" height="6.5" rx="1.5" fill="#0f172a" stroke="#fbbf24" strokeWidth="1" />
          <rect x="24" y="9" width="6" height="4.5" rx="1" fill="#fef08a" />
          <circle cx="27" cy="11.2" r="2.2" fill="#ffffff" />
          <path d="M22 8 Q 27 2 32 8 Z" fill="#e11d48" />
          <line x1="27" y1="2.5" x2="27" y2="0.8" stroke="#fbbf24" strokeWidth="1" />
          <circle cx="27" cy="0.6" r="1" fill="#fbbf24" />
        </g>
      </svg>
    );
  }

  // --- FARO OFICIAL DEFINITIVO: LUZ GIRATORIA BLANCA 3D REALISTA ---
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 52 52"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="MDQSHOW - El Faro de la Música en Mar del Plata"
    >
      <style>{`
        /* Rotación horizontal realista sobre el eje del faro (efecto 3D óptico) */
        @keyframes lighthouseSweep {
          0% {
            transform: scaleX(-1) skewY(-3deg);
            opacity: 0.85;
          }
          25% {
            transform: scaleX(-0.15) skewY(0deg);
            opacity: 0.2;
          }
          45% {
            transform: scaleX(0.4) skewY(2deg);
            opacity: 0.1;
          }
          50% {
            transform: scaleX(0) skewY(0deg);
            opacity: 0.05;
          }
          75% {
            transform: scaleX(0.8) skewY(2deg);
            opacity: 0.65;
          }
          92% {
            transform: scaleX(1) skewY(0deg);
            opacity: 0.95;
          }
          100% {
            transform: scaleX(-1) skewY(-3deg);
            opacity: 0.85;
          }
        }

        /* Destello en la linterna cuando el haz apunta al frente */
        @keyframes lensFrontFlash {
          0%, 20%, 60%, 100% {
            opacity: 0.4;
            transform: scale(0.9);
          }
          48%, 52% {
            opacity: 0.15;
            transform: scale(0.7);
          }
          92% {
            opacity: 1;
            transform: scale(1.6);
          }
        }

        .faro-sweeping-beam {
          transform-origin: 26px 14px;
          animation: lighthouseSweep 3.8s ease-in-out infinite;
          will-change: transform, opacity;
        }

        .faro-lens-flash {
          transform-origin: 26px 13px;
          animation: lensFrontFlash 3.8s ease-in-out infinite;
          will-change: transform, opacity;
        }
      `}</style>
      <defs>
        {/* Haz de luz blanco puro con degradé en abanico horizontal hacia la noche */}
        <linearGradient id="whiteBeaconBeam" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="35%" stopColor="#f8fafc" stopOpacity="0.65" />
          <stop offset="70%" stopColor="#94a3b8" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>

        {/* Resplandor blanco puro en el foco */}
        <radialGradient id="pureWhiteGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="40%" stopColor="#e2e8f0" stopOpacity="0.6" />
          <stop offset="80%" stopColor="#38bdf8" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#0e1117" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Resplandor blanco de atmósfera */}
      <circle cx="26" cy="13" r="16" fill="url(#pureWhiteGlow)" opacity="0.75" />

      {/* HAZ DE LUZ BLANCO GIRANDO HORIZONTALMENTE SOBRE EL EJE */}
      <g className="faro-sweeping-beam">
        <polygon
          points="26,12  54,2  54,24  26,14"
          fill="url(#whiteBeaconBeam)"
        />
      </g>

      {/* CUERPO DEL FARO DE PUNTA MOGOTES */}
      {/* Olas al pie */}
      <path d="M12 47 Q 19 44 26 47 T 40 47" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" opacity="0.8" />
      <path d="M15 50 Q 20 48 26 50 T 37 50" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" opacity="0.6" />

      {/* Base */}
      <rect x="17" y="44" width="18" height="3.5" rx="1.5" fill="#334155" stroke="#1e293b" strokeWidth="0.8" />

      {/* Torre cónica roja */}
      <path d="M23 16L19 44H33L29 16H23Z" fill="#e11d48" />

      {/* Bandas blancas horizontales */}
      <path d="M22.2 22L21.4 27.5H30.6L29.8 22H22.2Z" fill="#ffffff" />
      <path d="M20.6 33.5L19.8 39H32.2L31.4 33.5H20.6Z" fill="#ffffff" />

      {/* Balcón y Linterna */}
      <rect x="21" y="15" width="10" height="2" rx="0.8" fill="#1e293b" stroke="#f43f5e" strokeWidth="0.6" />
      <rect x="22.5" y="9" width="7" height="6.5" rx="1.5" fill="#0f172a" stroke="#cbd5e1" strokeWidth="1" />
      <rect x="23.5" y="10" width="5" height="4.5" rx="0.8" fill="#f8fafc" opacity="0.9" />

      {/* Cúpula roja superior */}
      <path d="M22 9 Q 26 3.5 30 9 Z" fill="#e11d48" />
      <line x1="26" y1="3.5" x2="26" y2="1.5" stroke="#cbd5e1" strokeWidth="1" />
      <circle cx="26" cy="1.2" r="0.9" fill="#f8fafc" />

      {/* Lente con destello blanco brillante cuando barre hacia el frente */}
      <g className="faro-lens-flash">
        <circle cx="26" cy="12.2" r="3.2" fill="#ffffff" />
        <line x1="22" y1="12.2" x2="30" y2="12.2" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="26" y1="8.2" x2="26" y2="16.2" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
      </g>
    </svg>
  );
};
