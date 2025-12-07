import React from 'react';

interface LogoProps {
  size?: 'sm' | 'lg';
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 'lg', className = '' }) => {
  const isLarge = size === 'lg';
  
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {/* Ícone do Funil Cyberpunk Estilizado */}
      <div className={`relative ${isLarge ? 'mb-4' : 'mb-2'}`}>
        {/* Brilho do ícone */}
        <div className="absolute inset-0 bg-emerald-500 blur-xl opacity-40 rounded-full animate-pulse" />
        
        <svg 
          width={isLarge ? "64" : "32"} 
          height={isLarge ? "64" : "32"} 
          viewBox="0 0 64 64" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10"
        >
          {/* Parte superior do funil (entrada de dados/noise) */}
          <path 
            d="M4 12L24 12L32 28L40 12L60 12" 
            stroke="#10b981" 
            strokeWidth="3" 
            strokeLinecap="square"
            className="drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]"
          />
          <circle cx="4" cy="12" r="3" fill="#10b981" />
          <circle cx="60" cy="12" r="3" fill="#10b981" />
          
          {/* Corpo do funil (processamento) */}
          <path 
            d="M32 28V52" 
            stroke="#10b981" 
            strokeWidth="3" 
            strokeDasharray="4 2"
            className="animate-pulse"
          />
          
          {/* Saída (resultado/foco) */}
          <path 
            d="M24 52H40" 
            stroke="#10b981" 
            strokeWidth="3" 
          />
          <circle cx="32" cy="58" r="4" fill="#10b981" className="animate-bounce" />
          
          {/* Detalhes Tech */}
          <path d="M16 12L26 32" stroke="#10b981" strokeWidth="1" strokeOpacity="0.5" />
          <path d="M48 12L38 32" stroke="#10b981" strokeWidth="1" strokeOpacity="0.5" />
        </svg>
      </div>

      {/* Logotipo Texto */}
      <h1 className={`${isLarge ? 'text-4xl' : 'text-xl'} font-bold tracking-[0.2em] leading-none filter drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]`}>
        <span className="text-emerald-500 font-black">NOISE</span>
        <span className="text-white font-black">GATE</span>
      </h1>
    </div>
  );
};

export default Logo;