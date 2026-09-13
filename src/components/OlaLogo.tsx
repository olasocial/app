import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Heart } from 'lucide-react';

interface OlaLogoProps {
  variant?: 'hero' | 'compact' | 'icon-only' | 'badge';
  animate?: boolean;
  className?: string;
  onClick?: () => void;
}

export const OlaLogo: React.FC<OlaLogoProps> = ({
  variant = 'compact',
  animate = true,
  className = '',
  onClick
}) => {
  if (variant === 'icon-only') {
    return (
      <div
        onClick={onClick}
        className={`relative inline-flex items-center justify-center cursor-pointer group ${className}`}
      >
        <motion.div
          animate={animate ? { y: [0, -3, 0], rotate: [0, 1, 0, -1, 0] } : {}}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="relative"
        >
          <img
            src="/logo.png"
            alt="Ola Social"
            className="w-10 h-10 object-contain rounded-2xl drop-shadow-md transition-transform duration-300 group-hover:scale-105"
          />
          {animate && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
          )}
        </motion.div>
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <div
        onClick={onClick}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-cyan-100 shadow-sm hover:shadow-md transition-all cursor-pointer ${className}`}
      >
        <motion.img
          src="/logo.png"
          alt="Ola Social"
          className="w-7 h-7 object-contain"
          animate={animate ? { rotate: [0, 3, -3, 0] } : {}}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="flex flex-col">
          <span className="text-xs font-bold bg-gradient-to-r from-sky-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent leading-none">
            Ola Social
          </span>
          <span className="text-[10px] text-slate-500 leading-none">Abrazos que conectan</span>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div
        onClick={onClick}
        className={`flex items-center gap-2.5 cursor-pointer select-none group ${className}`}
      >
        {/* Animated wave logo emblem container */}
        <div className="relative">
          <motion.div
            animate={
              animate
                ? {
                    y: [0, -2, 0],
                    filter: [
                      'drop-shadow(0 2px 6px rgba(14,165,233,0.25))',
                      'drop-shadow(0 4px 10px rgba(16,185,129,0.35))',
                      'drop-shadow(0 2px 6px rgba(14,165,233,0.25))'
                    ]
                  }
                : {}
            }
            transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
            className="relative"
          >
            <img
              src="/logo.png"
              alt="Ola Social"
              className="w-10 h-10 md:w-11 md:h-11 object-contain rounded-2xl transition-transform duration-300 group-hover:scale-105"
            />

            {/* Glowing animated heart micro-badge */}
            <motion.div
              animate={{ scale: [1, 1.25, 1], opacity: [0.85, 1, 0.85] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-gradient-to-tr from-rose-500 to-amber-500 rounded-full flex items-center justify-center border-2 border-white shadow-xs"
            >
              <Heart className="w-2 h-2 text-white fill-white" />
            </motion.div>
          </motion.div>
        </div>

        {/* Brand Text Typography */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <span className="font-['Outfit',sans-serif] text-xl font-extrabold tracking-tight bg-gradient-to-r from-sky-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent">
              Ola Social
            </span>
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          </div>
          <span className="text-[10px] tracking-wider uppercase font-semibold text-sky-700/80 -mt-0.5 hidden sm:inline-block">
            Abrazos que conectan
          </span>
        </div>
      </div>
    );
  }

  // Hero variant (Expanded, animated for hero banner)
  return (
    <div
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center text-center px-3 py-2 sm:p-4 select-none max-w-full overflow-hidden ${className}`}
    >
      {/* Animated aura rings */}
      <div className="relative flex items-center justify-center">
        <motion.div
          animate={
            animate
              ? {
                  scale: [1, 1.08, 1],
                  opacity: [0.35, 0.65, 0.35],
                  rotate: [0, 180, 360]
                }
              : {}
          }
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
          className="absolute -inset-4 sm:-inset-6 rounded-full bg-gradient-to-tr from-sky-300/40 via-emerald-300/30 to-amber-300/30 blur-xl sm:blur-2xl pointer-events-none"
        />

        {/* Center Logo Image with Floating Motion */}
        <motion.div
          animate={
            animate
              ? {
                  y: [0, -6, 0],
                  rotate: [0, 1.5, -1.5, 0]
                }
              : {}
          }
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="relative z-10"
        >
          <img
            src="/logo.png"
            alt="Ola Social - Abrazos que conectan personas"
            className="w-24 h-24 sm:w-36 sm:h-36 md:w-48 md:h-48 object-contain drop-shadow-xl sm:drop-shadow-2xl rounded-2xl sm:rounded-3xl"
          />

          {/* Pulsing heart spotlight */}
          <motion.div
            animate={
              animate
                ? {
                    scale: [1, 1.25, 1],
                    opacity: [0.7, 1, 0.7]
                  }
                : {}
            }
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 sm:w-12 sm:h-12 bg-rose-500/20 rounded-full blur-md pointer-events-none"
          />
        </motion.div>
      </div>

      {/* Hero Brand Title and Slogan */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="mt-2.5 sm:mt-3 relative z-10 max-w-full px-2"
      >
        <div className="inline-flex items-center gap-1.5 sm:gap-2">
          <h1 className="font-['Outfit',sans-serif] text-2xl sm:text-3xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-sky-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent">
            Ola Social
          </h1>
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 animate-bounce shrink-0" />
        </div>
        <p className="mt-0.5 sm:mt-1 text-xs sm:text-base font-medium text-slate-600 max-w-md mx-auto">
          "Abrazos que conectan personas."
        </p>
        <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200/70 max-w-[95vw]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
          <span className="truncate">Descubrimiento y apoyo mutuo entre creadores</span>
        </div>
      </motion.div>
    </div>
  );
};
