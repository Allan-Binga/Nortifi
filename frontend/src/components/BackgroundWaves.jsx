function BackgroundWaves() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Top wave */}
      <svg
        className="absolute top-0 left-0 w-full h-[200px] opacity-10"
        viewBox="0 0 1000 200"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="wave1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" /> {/* violet */}
            <stop offset="100%" stopColor="#6D28D9" /> {/* deeper violet */}
          </linearGradient>
        </defs>
        <path
          d="M0,200 Q250,50 500,200 T1000,200 L1000,0 L0,0 Z"
          fill="url(#wave1)"
          className="animate-pulse"
        />
      </svg>

      {/* Bottom wave */}
      <svg
        className="absolute bottom-0 left-0 w-full h-[200px] opacity-5"
        viewBox="0 0 1000 200"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="wave2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" /> {/* amber */}
            <stop offset="100%" stopColor="#D97706" /> {/* darker amber */}
          </linearGradient>
        </defs>
        <path
          d="M0,0 Q250,150 500,0 T1000,0 L1000,200 L0,200 Z"
          fill="url(#wave2)"
          className="animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </svg>

      {/* Floating Particles */}
      <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full animate-bounce opacity-40"></div>
      <div
        className="absolute bottom-1/3 right-1/3 w-4 h-4 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full animate-pulse opacity-35"
        style={{ animationDelay: "1.5s" }}
      ></div>
      <div
        className="absolute top-1/2 left-1/2 w-2 h-2 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full animate-bounce opacity-30"
        style={{ animationDelay: "2.2s" }}
      ></div>
    </div>
  );
}

export default BackgroundWaves;
