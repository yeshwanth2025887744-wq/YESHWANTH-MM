import React from 'react';
import {
  Sun,
  Moon,
  Sparkles,
  Clock,
  Eye,
  Sliders,
  X,
  CheckCircle2,
  Sunset,
  Sunrise,
  ShieldAlert,
} from 'lucide-react';
import { useThemeManager, ThemeMode } from '../context/ThemeManagerContext.tsx';

export const ThemeManagerModal: React.FC = () => {
  const {
    mode,
    setMode,
    sunriseTime,
    setSunriseTime,
    sunsetTime,
    setSunsetTime,
    simulatedHour,
    setSimulatedHour,
    lowBlueFilter,
    setLowBlueFilter,
    effectiveTheme,
    isNightTime,
    solarStatusText,
    isThemeModalOpen,
    setIsThemeModalOpen,
  } = useThemeManager();

  if (!isThemeModalOpen) return null;

  const currentDisplayHour =
    simulatedHour !== null
      ? `${Math.floor(simulatedHour).toString().padStart(2, '0')}:${Math.floor(
          (simulatedHour % 1) * 60
        )
          .toString()
          .padStart(2, '0')}`
      : 'Live System Clock';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-950/80 border border-amber-500/40 text-amber-400">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Solar Circadian Theme Manager</span>
                <span className="text-[10px] bg-amber-950 text-amber-300 px-2 py-0.5 rounded font-mono uppercase font-bold border border-amber-800">
                  {effectiveTheme.replace('_', ' ')}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Dynamically shifts UI spectrum based on local solar angles to reduce night vision fatigue.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsThemeModalOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Active Mode Banner */}
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
            effectiveTheme === 'night_amber'
              ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
              : effectiveTheme === 'day_clear'
              ? 'bg-sky-950/40 border-sky-500/50 text-sky-200'
              : 'bg-slate-950 border-slate-800 text-slate-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {isNightTime ? (
              <Moon className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <Sun className="w-4 h-4 text-sky-400 shrink-0" />
            )}
            <div>
              <div className="font-bold">
                {isNightTime ? 'Night Eye-Strain Guard Active' : 'Daylight High-Contrast Mode Active'}
              </div>
              <div className="text-[11px] opacity-80">{solarStatusText}</div>
            </div>
          </div>

          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-black/40 border border-white/10 uppercase font-semibold">
            {mode === 'auto' ? 'Auto-Solar' : 'Manual'}
          </span>
        </div>

        {/* Theme Mode Selector Cards */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
            Palette Mode:
          </label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              {
                id: 'auto' as ThemeMode,
                label: 'Auto Solar Circadian',
                desc: 'Switches automatically at sunrise & sunset',
                icon: Sparkles,
                badge: 'Recommended',
              },
              {
                id: 'night_amber' as ThemeMode,
                label: 'Night Vision Guard',
                desc: 'Warm amber tones, zero blue glare',
                icon: Moon,
                badge: 'Low-Blue',
              },
              {
                id: 'night_obsidian' as ThemeMode,
                label: 'Obsidian Ring Dark',
                desc: 'Standard deep slate & Ring sky blue',
                icon: Eye,
                badge: 'Default',
              },
              {
                id: 'day_clear' as ThemeMode,
                label: 'Daylight Clear',
                desc: 'Maximum daylight contrast & clarity',
                icon: Sun,
                badge: 'High Contrast',
              },
            ].map((item) => {
              const Icon = item.icon;
              const isSelected = mode === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setMode(item.id)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                    isSelected
                      ? 'bg-slate-950 border-amber-500 shadow-md ring-1 ring-amber-500/40'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-400' : 'text-slate-400'}`} />
                      <span className={`font-semibold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                        {item.label}
                      </span>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">{item.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Solar Time Schedule Inputs */}
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
              Local Solar Windows
            </span>
            <span className="text-[10px] text-slate-400 font-mono">GPS-Calibrated</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="flex items-center gap-1 text-[11px] text-slate-400 mb-1">
                <Sunrise className="w-3.5 h-3.5 text-amber-400" />
                <span>Sunrise Time (AM)</span>
              </label>
              <input
                type="time"
                value={sunriseTime}
                onChange={(e) => setSunriseTime(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="flex items-center gap-1 text-[11px] text-slate-400 mb-1">
                <Sunset className="w-3.5 h-3.5 text-rose-400" />
                <span>Sunset Time (PM)</span>
              </label>
              <input
                type="time"
                value={sunsetTime}
                onChange={(e) => setSunsetTime(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>

          {/* Interactive Solar Scrub Slider (0h to 24h) */}
          <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Interactive Time Simulation:</span>
              <span className="text-amber-400 font-bold">{currentDisplayHour}</span>
            </div>

            <input
              type="range"
              min="0"
              max="24"
              step="0.5"
              value={simulatedHour !== null ? simulatedHour : 12}
              onChange={(e) => setSimulatedHour(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />

            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span>00:00 (Midnight)</span>
              <button
                type="button"
                onClick={() => setSimulatedHour(null)}
                className="text-sky-400 hover:underline cursor-pointer"
              >
                Reset to Live Clock
              </button>
              <span>23:59 (Night)</span>
            </div>
          </div>
        </div>

        {/* Low Blue Light Filter Toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
          <div>
            <div className="text-xs font-medium text-slate-200">Melatonin Guard (Low-Blue Spectrum)</div>
            <div className="text-[11px] text-slate-500">
              Softens harsh 450nm wavelength blue emissions for night monitoring
            </div>
          </div>
          <input
            type="checkbox"
            checked={lowBlueFilter}
            onChange={(e) => setLowBlueFilter(e.target.checked)}
            className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700 cursor-pointer"
          />
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={() => setIsThemeModalOpen(false)}
            className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors cursor-pointer shadow-md"
          >
            Apply &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
};
