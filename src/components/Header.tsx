import React from 'react';
import { ShieldCheck, ShieldAlert, Shield, Cpu, Sliders, Sun, Moon } from 'lucide-react';
import { useThemeManager } from '../context/ThemeManagerContext.tsx';

export type NavTab =
  | 'dashboard'
  | 'access'
  | 'caretaking'
  | 'accessibility'
  | 'automation'
  | 'analytics'
  | 'api';

interface HeaderProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  alarmMode: 'disarmed' | 'home' | 'away';
  onChangeAlarmMode: (mode: 'disarmed' | 'home' | 'away') => void;
  isSimulatorOpen: boolean;
  onToggleSimulator: () => void;
  isRinging?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  alarmMode,
  onChangeAlarmMode,
  isSimulatorOpen,
  onToggleSimulator,
  isRinging,
}) => {
  const getAlarmIcon = () => {
    switch (alarmMode) {
      case 'away':
        return <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />;
      case 'home':
        return <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Shield className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getAlarmLabel = () => {
    switch (alarmMode) {
      case 'away':
        return 'Away (Armed)';
      case 'home':
        return 'Home (Armed)';
      default:
        return 'Disarmed';
    }
  };

  const cycleAlarmMode = () => {
    if (alarmMode === 'disarmed') onChangeAlarmMode('home');
    else if (alarmMode === 'home') onChangeAlarmMode('away');
    else onChangeAlarmMode('disarmed');
  };

  const { mode, isNightTime, effectiveTheme, setIsThemeModalOpen } = useThemeManager();

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 md:px-8 py-3 flex items-center justify-between">
      {/* Zone 1: Single text element wordmark */}
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          onSelectTab('dashboard');
        }}
        className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded"
      >
        <span
          className={`w-3.5 h-3.5 rounded-full border-2 border-sky-400 bg-sky-950 ${
            isRinging ? 'animate-ping ring-4 ring-sky-400' : 'ring-led-active'
          }`}
        />
        <span className="tracking-tight">Ring Pulse</span>
      </a>

      {/* Zone 2: 5-6 clean text navigation links */}
      <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-300">
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`cursor-pointer whitespace-nowrap transition-colors py-1 ${
            activeTab === 'dashboard'
              ? 'text-white border-b-2 border-sky-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Live Dashboard
        </button>
        <button
          onClick={() => onSelectTab('access')}
          className={`cursor-pointer whitespace-nowrap transition-colors py-1 ${
            activeTab === 'access'
              ? 'text-white border-b-2 border-sky-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Access Control
        </button>
        <button
          onClick={() => onSelectTab('caretaking')}
          className={`cursor-pointer whitespace-nowrap transition-colors py-1 ${
            activeTab === 'caretaking'
              ? 'text-white border-b-2 border-sky-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Caretaking &amp; Rules
        </button>
        <button
          onClick={() => onSelectTab('accessibility')}
          className={`cursor-pointer whitespace-nowrap transition-colors py-1 ${
            activeTab === 'accessibility'
              ? 'text-white border-b-2 border-sky-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Accessibility
        </button>
        <button
          onClick={() => onSelectTab('automation')}
          className={`cursor-pointer whitespace-nowrap transition-colors py-1 ${
            activeTab === 'automation'
              ? 'text-white border-b-2 border-sky-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Smart Automation
        </button>
        <button
          onClick={() => onSelectTab('analytics')}
          className={`cursor-pointer whitespace-nowrap transition-colors py-1 ${
            activeTab === 'analytics'
              ? 'text-white border-b-2 border-sky-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Analytics
        </button>
        <button
          onClick={() => onSelectTab('api')}
          className={`cursor-pointer whitespace-nowrap transition-colors py-1 ${
            activeTab === 'api'
              ? 'text-white border-b-2 border-sky-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          API Studio
        </button>
      </nav>

      {/* Zone 3: 1-2 primary actions */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Solar Theme Manager Quick Trigger */}
        <button
          onClick={() => setIsThemeModalOpen(true)}
          title="Solar Circadian Theme Manager (Click to configure)"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
            effectiveTheme === 'night_amber'
              ? 'bg-amber-950/60 border-amber-500/50 text-amber-300 hover:bg-amber-900/60'
              : effectiveTheme === 'day_clear'
              ? 'bg-sky-950/60 border-sky-500/50 text-sky-300 hover:bg-sky-900/60'
              : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
          }`}
        >
          {isNightTime ? (
            <Moon className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Sun className="w-3.5 h-3.5 text-sky-400" />
          )}
          <span className="hidden sm:inline">
            {mode === 'auto'
              ? isNightTime
                ? 'Night Guard'
                : 'Daylight'
              : effectiveTheme === 'night_amber'
              ? 'Night Amber'
              : 'Dark'}
          </span>
        </button>

        <button
          onClick={cycleAlarmMode}
          title="Click to cycle Ring Alarm Mode (Home / Away / Disarmed)"
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-700/80 bg-slate-900/90 hover:bg-slate-800 transition-colors text-slate-200 cursor-pointer whitespace-nowrap"
        >
          {getAlarmIcon()}
          <span>{getAlarmLabel()}</span>
        </button>

        <button
          onClick={onToggleSimulator}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
            isSimulatorOpen
              ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
              : 'bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-500/30'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Dev Toolbar</span>
        </button>
      </div>
    </header>
  );
};
