"use client";

import { useTheme } from "../lib/theme";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";

  const daySceneStyle = {
    backgroundImage: "url(/day.png)",
    backgroundSize: "cover",
    backgroundPosition: "center 80%",
    backgroundRepeat: "no-repeat",
  } as const;

  const nightSceneStyle = {
    backgroundImage: "url(/night.png)",
    backgroundSize: "cover",
    backgroundPosition: "center 80%",
    backgroundRepeat: "no-repeat",
  } as const;

  return (
    <button
      type="button"
      aria-pressed={isLight}
      aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
      onClick={toggleTheme}
      className="group relative flex h-12 w-28 items-center overflow-hidden rounded-full border border-orange-500/60 bg-orange-500/10 shadow-sm transition hover:shadow-md"
    >
      {/* Day scene */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 ${
          isLight ? "opacity-100" : "opacity-0"
        }`}
        style={daySceneStyle}
      >
      </div>

      {/* Night scene */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 ${
          isLight ? "opacity-0" : "opacity-100"
        }`}
        style={nightSceneStyle}
      >
      </div>

      {/* Handle */}
      <div
        className={`relative z-10 ml-1 h-10 w-10 rounded-full bg-white shadow-[0_8px_18px_-8px_rgba(0,0,0,0.45)] transition-transform duration-300 ${
          isLight ? "translate-x-16 bg-amber-50" : "translate-x-0 bg-slate-100"
        }`}
      >
        <div className="absolute inset-0 rounded-full border border-white/70" />
        {isLight ? (
          <div className="absolute left-1.5 top-1.5 h-7 w-7 rounded-full bg-gradient-to-br from-amber-200 to-amber-400 shadow-[0_0_18px_rgba(251,191,36,0.8)]" />
        ) : (
          <div className="absolute left-1.5 top-1.5 h-7 w-7 rounded-full bg-gradient-to-br from-slate-500 to-slate-700 shadow-[0_0_12px_rgba(255,255,255,0.4)]" />
        )}
      </div>
    </button>
  );
}
