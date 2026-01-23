import React from 'react';

interface Props {
  className?: string;
  color?: string;
}

const BrandLogo: React.FC<Props> = ({ className = "w-12 h-12", color = "currentColor" }) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={className}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Circle Text Path - Simulated with visual placement for SVG simplicity or real text */}
      {/* Using simplified geometric representation for robustness */}
      
      {/* The "V" Shape */}
      <path 
        d="M35 45 L50 80 L65 45" 
        stroke={color} 
        strokeWidth="8" 
        strokeLinecap="square" 
        strokeLinejoin="miter"
      />
      
      {/* The Crescent/Moon Shape above V */}
      <path 
        d="M40 38 Q50 48 60 38" 
        stroke={color} 
        strokeWidth="8" 
        strokeLinecap="square"
      />
      
      {/* Circular Text Approximation (dots/decoration) to represent the logo ring */}
      <circle cx="50" cy="50" r="42" stroke={color} strokeWidth="1" strokeDasharray="2 4" opacity="0.5" />
      
    </svg>
  );
};

export const BrandLogoFull: React.FC<Props> = ({ className = "h-10", color = "currentColor" }) => (
    <div className={`flex items-center gap-3 ${className}`}>
        <BrandLogo className="w-10 h-10" color={color} />
        <div className="flex flex-col justify-center">
            <span className="text-xl font-black uppercase tracking-[0.2em] leading-none" style={{ color }}>
                Varietal
            </span>
            <span className="text-[8px] font-bold uppercase tracking-[0.3em] opacity-60 leading-tight mt-1" style={{ color }}>
                Desarrolladores de Café
            </span>
        </div>
    </div>
);

export default BrandLogo;
