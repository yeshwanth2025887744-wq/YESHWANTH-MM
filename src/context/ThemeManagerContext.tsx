import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'auto' | 'night_amber' | 'night_obsidian' | 'day_clear';

interface ThemeManagerContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  sunriseTime: string; // "06:45"
  setSunriseTime: (time: string) => void;
  sunsetTime: string; // "19:15"
  setSunsetTime: (time: string) => void;
  simulatedHour: number | null; // 0 to 24 or null for live clock
  setSimulatedHour: (hour: number | null) => void;
  lowBlueFilter: boolean;
  setLowBlueFilter: (enabled: boolean) => void;
  effectiveTheme: 'night_amber' | 'night_obsidian' | 'day_clear';
  isNightTime: boolean;
  solarStatusText: string;
  isThemeModalOpen: boolean;
  setIsThemeModalOpen: (open: boolean) => void;
}

const ThemeManagerContext = createContext<ThemeManagerContextType | undefined>(undefined);

export const ThemeManagerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>('auto');
  const [sunriseTime, setSunriseTime] = useState<string>('06:45');
  const [sunsetTime, setSunsetTime] = useState<string>('19:15');
  const [simulatedHour, setSimulatedHour] = useState<number | null>(null);
  const [lowBlueFilter, setLowBlueFilter] = useState(true);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

  // Parse sunrise & sunset into decimal hours (e.g. "06:45" -> 6.75)
  const parseTimeToDecimal = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) + (m || 0) / 60;
  };

  const sunriseDecimal = parseTimeToDecimal(sunriseTime);
  const sunsetDecimal = parseTimeToDecimal(sunsetTime);

  // Current hour (either simulated or actual local time)
  const now = new Date();
  const currentDecimalHour =
    simulatedHour !== null ? simulatedHour : now.getHours() + now.getMinutes() / 60;

  // Determine whether current solar time is night
  const isNightTime =
    currentDecimalHour < sunriseDecimal || currentDecimalHour >= sunsetDecimal;

  // Compute effective theme based on mode and solar time
  let effectiveTheme: 'night_amber' | 'night_obsidian' | 'day_clear' = 'night_obsidian';

  if (mode === 'auto') {
    effectiveTheme = isNightTime ? 'night_amber' : 'day_clear';
  } else if (mode === 'night_amber') {
    effectiveTheme = 'night_amber';
  } else if (mode === 'night_obsidian') {
    effectiveTheme = 'night_obsidian';
  } else if (mode === 'day_clear') {
    effectiveTheme = 'day_clear';
  }

  // Generate readable solar status message
  let solarStatusText = '';
  if (isNightTime) {
    solarStatusText = `Night Mode Active · Sunset was ${sunsetTime} · Sunrise at ${sunriseTime}`;
  } else {
    solarStatusText = `Day Mode Active · Sunrise was ${sunriseTime} · Sunset at ${sunsetTime}`;
  }

  // Apply root CSS classes and filters dynamically
  useEffect(() => {
    const root = document.documentElement;

    root.classList.remove('theme-night-amber', 'theme-day-clear', 'theme-night-obsidian');

    if (effectiveTheme === 'night_amber') {
      root.classList.add('theme-night-amber');
    } else if (effectiveTheme === 'day_clear') {
      root.classList.add('theme-day-clear');
    } else {
      root.classList.add('theme-night-obsidian');
    }
  }, [effectiveTheme, lowBlueFilter]);

  return (
    <ThemeManagerContext.Provider
      value={{
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
      }}
    >
      {children}
    </ThemeManagerContext.Provider>
  );
};

export const useThemeManager = () => {
  const context = useContext(ThemeManagerContext);
  if (!context) {
    throw new Error('useThemeManager must be used within a ThemeManagerProvider');
  }
  return context;
};
