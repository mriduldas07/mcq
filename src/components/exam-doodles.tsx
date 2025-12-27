"use client";

export function ExamDoodleBackground() {
  return (
    <div className="absolute inset-0 opacity-0 dark:opacity-100 transition-opacity duration-500 pointer-events-none overflow-hidden">
      {/* Premium gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/20 via-transparent to-slate-900/20"></div>
      
      {/* Floating exam elements with refined colors */}
      <div className="absolute top-20 left-10 animate-float">
        <svg width="60" height="60" viewBox="0 0 60 60" fill="none" className="opacity-[0.08] blur-[0.3px]">
          {/* Checkmark */}
          <circle cx="30" cy="30" r="28" stroke="url(#grad1)" strokeWidth="2.5" />
          <path d="M15 30 L25 40 L45 20" stroke="url(#grad1)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.9" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="absolute top-40 right-20 animate-float animation-delay-2000">
        <svg width="50" height="50" viewBox="0 0 50 50" fill="none" className="opacity-[0.07] blur-[0.3px]">
          {/* Lightbulb */}
          <circle cx="25" cy="20" r="12" stroke="url(#grad2)" strokeWidth="2.5" />
          <path d="M20 32 L20 40 L30 40 L30 32" stroke="url(#grad2)" strokeWidth="2" strokeLinecap="round"/>
          <path d="M18 28 L32 28" stroke="url(#grad2)" strokeWidth="2"/>
          <path d="M25 8 L25 3" stroke="url(#grad2)" strokeWidth="2" strokeLinecap="round"/>
          <defs>
            <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.8" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="absolute bottom-40 left-32 animate-float animation-delay-4000">
        <svg width="55" height="55" viewBox="0 0 55 55" fill="none" className="opacity-[0.09] blur-[0.3px]">
          {/* Trophy */}
          <path d="M10 10 L10 20 Q10 25 15 25 L20 25" stroke="url(#grad3)" strokeWidth="2.5" fill="none"/>
          <path d="M45 10 L45 20 Q45 25 40 25 L35 25" stroke="url(#grad3)" strokeWidth="2.5" fill="none"/>
          <rect x="20" y="8" width="15" height="20" rx="2" stroke="url(#grad3)" strokeWidth="2.5" fill="none"/>
          <path d="M24 28 L24 35 L31 35 L31 28" stroke="url(#grad3)" strokeWidth="2.5"/>
          <rect x="20" y="35" width="15" height="3" stroke="url(#grad3)" strokeWidth="2.5" fill="none"/>
          <defs>
            <linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#eab308" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.85" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="absolute top-60 left-[60%] animate-float">
        <svg width="45" height="45" viewBox="0 0 45 45" fill="none" className="opacity-[0.06] blur-[0.3px]">
          {/* Pencil */}
          <path d="M5 40 L15 30 L35 10 L40 15 L20 35 L10 45 Z" stroke="url(#grad4)" strokeWidth="2.5" fill="none"/>
          <path d="M30 15 L35 20" stroke="url(#grad4)" strokeWidth="2.5"/>
          <defs>
            <linearGradient id="grad4" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.8" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="absolute bottom-32 right-[15%] animate-float animation-delay-2000">
        <svg width="50" height="50" viewBox="0 0 50 50" fill="none" className="opacity-[0.08] blur-[0.3px]">
          {/* Book */}
          <rect x="10" y="10" width="30" height="30" rx="2" stroke="url(#grad5)" strokeWidth="2.5" fill="none"/>
          <path d="M25 10 L25 40" stroke="url(#grad5)" strokeWidth="2.5"/>
          <path d="M15 20 L22 20" stroke="url(#grad5)" strokeWidth="2"/>
          <path d="M15 25 L22 25" stroke="url(#grad5)" strokeWidth="2"/>
          <path d="M28 20 L35 20" stroke="url(#grad5)" strokeWidth="2"/>
          <path d="M28 25 L35 25" stroke="url(#grad5)" strokeWidth="2"/>
          <defs>
            <linearGradient id="grad5" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.85" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="absolute top-[70%] left-[10%] animate-float animation-delay-4000">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="opacity-[0.07] blur-[0.3px]">
          {/* Certificate */}
          <rect x="8" y="12" width="32" height="24" rx="2" stroke="url(#grad6)" strokeWidth="2.5" fill="none"/>
          <circle cx="15" cy="24" r="3" stroke="url(#grad6)" strokeWidth="2" fill="none"/>
          <path d="M20 20 L35 20" stroke="url(#grad6)" strokeWidth="2"/>
          <path d="M20 24 L35 24" stroke="url(#grad6)" strokeWidth="2"/>
          <path d="M20 28 L30 28" stroke="url(#grad6)" strokeWidth="2"/>
          <defs>
            <linearGradient id="grad6" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.8" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="absolute top-[30%] right-[40%] animate-float">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="opacity-[0.05] blur-[0.3px]">
          {/* Clock */}
          <circle cx="20" cy="20" r="15" stroke="url(#grad7)" strokeWidth="2.5" fill="none"/>
          <path d="M20 20 L20 10" stroke="url(#grad7)" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M20 20 L28 20" stroke="url(#grad7)" strokeWidth="2.5" strokeLinecap="round"/>
          <defs>
            <linearGradient id="grad7" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.8" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="absolute bottom-[60%] right-[8%] animate-float animation-delay-2000">
        <svg width="52" height="52" viewBox="0 0 52 52" fill="none" className="opacity-[0.07] blur-[0.3px]">
          {/* Star */}
          <path d="M26 8 L30 20 L42 22 L33 30 L36 42 L26 36 L16 42 L19 30 L10 22 L22 20 Z" stroke="url(#grad8)" strokeWidth="2.5" fill="none"/>
          <defs>
            <linearGradient id="grad8" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.85" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Additional doodles for more coverage */}
      <div className="absolute top-[15%] left-[25%] animate-float animation-delay-1000">
        <svg width="42" height="42" viewBox="0 0 42 42" fill="none" className="opacity-[0.06] blur-[0.3px]">
          {/* Graduation cap */}
          <path d="M21 10 L5 16 L21 22 L37 16 L21 10 Z" stroke="url(#grad9)" strokeWidth="2.5" fill="none"/>
          <path d="M21 22 L21 30" stroke="url(#grad9)" strokeWidth="2.5"/>
          <path d="M37 16 L37 24" stroke="url(#grad9)" strokeWidth="2.5"/>
          <defs>
            <linearGradient id="grad9" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="absolute top-[45%] left-[5%] animate-float animation-delay-3000">
        <svg width="46" height="46" viewBox="0 0 46 46" fill="none" className="opacity-[0.08] blur-[0.3px]">
          {/* Calculator */}
          <rect x="8" y="8" width="30" height="30" rx="3" stroke="url(#grad10)" strokeWidth="2.5" fill="none"/>
          <rect x="12" y="12" width="22" height="6" rx="1" stroke="url(#grad10)" strokeWidth="2" fill="none"/>
          <circle cx="15" cy="25" r="2" fill="url(#grad10)" opacity="0.9"/>
          <circle cx="23" cy="25" r="2" fill="url(#grad10)" opacity="0.9"/>
          <circle cx="31" cy="25" r="2" fill="url(#grad10)" opacity="0.9"/>
          <circle cx="15" cy="32" r="2" fill="url(#grad10)" opacity="0.9"/>
          <circle cx="23" cy="32" r="2" fill="url(#grad10)" opacity="0.9"/>
          <circle cx="31" cy="32" r="2" fill="url(#grad10)" opacity="0.9"/>
          <defs>
            <linearGradient id="grad10" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.85" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="absolute top-[25%] right-[10%] animate-float animation-delay-1500">
        <svg width="44" height="44" viewBox="0 0 44 44" fill="none" className="opacity-[0.07] blur-[0.3px]">
          {/* Clipboard */}
          <rect x="10" y="6" width="24" height="32" rx="2" stroke="url(#grad11)" strokeWidth="2.5" fill="none"/>
          <rect x="16" y="4" width="12" height="6" rx="1" stroke="url(#grad11)" strokeWidth="2.5" fill="none"/>
          <path d="M16 16 L28 16" stroke="url(#grad11)" strokeWidth="2"/>
          <path d="M16 22 L28 22" stroke="url(#grad11)" strokeWidth="2"/>
          <path d="M16 28 L24 28" stroke="url(#grad11)" strokeWidth="2"/>
          <defs>
            <linearGradient id="grad11" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.85" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="absolute top-[55%] right-[25%] animate-float animation-delay-2500">
        <svg width="38" height="38" viewBox="0 0 38 38" fill="none" className="opacity-[0.06] blur-[0.3px]">
          {/* Atom/Science */}
          <circle cx="19" cy="19" r="3" fill="url(#grad12)" opacity="0.9"/>
          <ellipse cx="19" cy="19" rx="14" ry="6" stroke="url(#grad12)" strokeWidth="2.5" fill="none" transform="rotate(45 19 19)"/>
          <ellipse cx="19" cy="19" rx="14" ry="6" stroke="url(#grad12)" strokeWidth="2.5" fill="none" transform="rotate(-45 19 19)"/>
          <defs>
            <linearGradient id="grad12" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.8" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="absolute bottom-[20%] left-[18%] animate-float animation-delay-3500">
        <svg width="50" height="50" viewBox="0 0 50 50" fill="none" className="opacity-[0.08] blur-[0.3px]">
          {/* Medal */}
          <circle cx="25" cy="30" r="12" stroke="url(#grad13)" strokeWidth="2.5" fill="none"/>
          <path d="M25 18 L28 24 L34 25 L29 30 L30 36 L25 33 L20 36 L21 30 L16 25 L22 24 Z" stroke="url(#grad13)" strokeWidth="2" fill="none"/>
          <path d="M19 18 L19 8 L25 12 L31 8 L31 18" stroke="url(#grad13)" strokeWidth="2.5" fill="none"/>
          <defs>
            <linearGradient id="grad13" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.85" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="absolute bottom-[10%] right-[35%] animate-float animation-delay-1000">
        <svg width="43" height="43" viewBox="0 0 43 43" fill="none" className="opacity-[0.06] blur-[0.3px]">
          {/* Target/Bullseye */}
          <circle cx="21.5" cy="21.5" r="18" stroke="url(#grad14)" strokeWidth="2.5" fill="none"/>
          <circle cx="21.5" cy="21.5" r="12" stroke="url(#grad14)" strokeWidth="2.5" fill="none"/>
          <circle cx="21.5" cy="21.5" r="6" stroke="url(#grad14)" strokeWidth="2.5" fill="none"/>
          <circle cx="21.5" cy="21.5" r="2" fill="url(#grad14)" opacity="0.9"/>
          <defs>
            <linearGradient id="grad14" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ec4899" stopOpacity="0.8" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="absolute top-[85%] left-[40%] animate-float animation-delay-2000">
        <svg width="47" height="47" viewBox="0 0 47 47" fill="none" className="opacity-[0.07] blur-[0.3px]">
          {/* Rocket */}
          <path d="M23.5 8 L23.5 30" stroke="url(#grad15)" strokeWidth="2.5"/>
          <path d="M23.5 8 L15 20 L23.5 18 L32 20 Z" stroke="url(#grad15)" strokeWidth="2.5" fill="none"/>
          <path d="M15 20 L12 30 L15 28" stroke="url(#grad15)" strokeWidth="2.5" fill="none"/>
          <path d="M32 20 L35 30 L32 28" stroke="url(#grad15)" strokeWidth="2.5" fill="none"/>
          <circle cx="23.5" cy="14" r="2" fill="url(#grad15)" opacity="0.9"/>
          <defs>
            <linearGradient id="grad15" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.85" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="absolute top-[50%] left-[75%] animate-float animation-delay-4000">
        <svg width="41" height="41" viewBox="0 0 41 41" fill="none" className="opacity-[0.06] blur-[0.3px]">
          {/* Brain */}
          <path d="M15 12 Q10 12 10 17 Q10 20 12 22 Q10 24 10 27 Q10 32 15 32 L26 32 Q31 32 31 27 Q31 24 29 22 Q31 20 31 17 Q31 12 26 12" stroke="url(#grad16)" strokeWidth="2.5" fill="none"/>
          <path d="M20.5 12 L20.5 32" stroke="url(#grad16)" strokeWidth="2"/>
          <defs>
            <linearGradient id="grad16" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.85" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="absolute bottom-[45%] right-[5%] animate-float animation-delay-500">
        <svg width="39" height="39" viewBox="0 0 39 39" fill="none" className="opacity-[0.06] blur-[0.3px]">
          {/* Flask */}
          <path d="M14 8 L14 15 L8 28 Q8 32 12 32 L27 32 Q31 32 31 28 L25 15 L25 8" stroke="url(#grad17)" strokeWidth="2.5" fill="none"/>
          <path d="M12 8 L27 8" stroke="url(#grad17)" strokeWidth="2.5"/>
          <circle cx="20" cy="24" r="3" fill="url(#grad17)" opacity="0.7"/>
          <defs>
            <linearGradient id="grad17" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.85" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}
