interface KeralaEmblemProps {
  className?: string;
  size?: number;
}

export default function KeralaEmblem({ className = 'w-9 h-9', size = 36 }: KeralaEmblemProps) {
  return (
    <div
      className={`relative flex items-center justify-center shrink-0 rounded-xl bg-gradient-to-br from-[#236e44] via-[#14532d] to-[#0a331a] p-1.5 shadow-md shadow-black/25 ring-1 ring-[#e5c060]/30 group-hover:ring-[#e5c060]/70 group-hover:shadow-emerald-950/40 transition-all duration-300 ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Outer subtle gold glow */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-[#c9a227]/0 via-[#e5c060]/15 to-[#ffd977]/25 opacity-70 group-hover:opacity-100 transition-opacity" />

      {/* Crisp Official Crest SVG */}
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full relative z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]"
      >
        <defs>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fff3b0" />
            <stop offset="45%" stopColor="#f5c242" />
            <stop offset="100%" stopColor="#b8860b" />
          </linearGradient>
          <linearGradient id="shieldGrad" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#25784c" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0a2916" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {/* Shield contour */}
        <path
          d="M24 4L39 9.5V22C39 31.8 32.6 40.5 24 44C15.4 40.5 9 31.8 9 22V9.5L24 4Z"
          fill="url(#shieldGrad)"
          stroke="url(#goldGrad)"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />

        {/* Inner pediment / roof */}
        <path
          d="M24 11L33 16H15L24 11Z"
          fill="url(#goldGrad)"
        />

        {/* Roof entablature */}
        <rect
          x="14"
          y="16.5"
          width="20"
          height="1.8"
          rx="0.9"
          fill="url(#goldGrad)"
        />

        {/* 4 Pillars representing democratic public service */}
        <rect x="16" y="19.5" width="2.2" height="11" rx="0.6" fill="url(#goldGrad)" />
        <rect x="21" y="19.5" width="2.2" height="11" rx="0.6" fill="url(#goldGrad)" />
        <rect x="25" y="19.5" width="2.2" height="11" rx="0.6" fill="url(#goldGrad)" />
        <rect x="30" y="19.5" width="2.2" height="11" rx="0.6" fill="url(#goldGrad)" />

        {/* Base podium */}
        <rect
          x="13.5"
          y="31.5"
          width="21"
          height="2"
          rx="0.8"
          fill="url(#goldGrad)"
        />

        {/* Apex star of governance */}
        <circle cx="24" cy="8" r="1.3" fill="url(#goldGrad)" />
      </svg>
    </div>
  );
}
