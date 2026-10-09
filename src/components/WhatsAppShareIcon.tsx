import React from 'react';

interface WhatsAppShareIconProps {
  className?: string;
}

// Flecha de "compartir" (solo contorno). Toma el color del texto del botón (verde WhatsApp).
export const WhatsAppShareIcon: React.FC<WhatsAppShareIconProps> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M13 4v4c-6.575 1.028 -9.02 6.788 -10 12c-.037 .206 5.384 -5.962 10 -6v4l8 -7l-8 -7z" />
  </svg>
);
