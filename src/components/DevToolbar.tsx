import React, { useState } from 'react';
import {
  Bell,
  Footprints,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  Moon,
  Sun,
  PackageCheck,
  ChevronDown,
  ChevronUp,
  Cpu,
  Radio,
  Sparkles,
  Zap,
  MapPin,
  Navigation,
  Home,
  Car,
} from 'lucide-react';
import { ringAudio } from '../utils/audio.ts';

interface DevToolbarProps {
  onSimulateDing: () => void;
  onSimulateMotion: () => void;
  alarmMode: 'disarmed' | 'home' | 'away';
  onCycleAlarmMode: () => void;
  isLocked: boolean;
  onToggleLock: () => void;
  onTriggerNightWandering: () => void;
  onTriggerInactivityAlert: () => void;
  onSimulateDelivery: () => void;
  onTriggerWebhook: (eventKind: 'ding' | 'motion') => void;
  // Geofencing props
  isInsideGeofence: boolean;
  geofenceDistance: number;
  onToggleGeofence: () => void;
  onChangeGeofenceDistance: (meters: number) => void;
  geofenceAutoDisarm: boolean;
  onToggleGeofenceAutoDisarm: () => void;
}

export const DevToolbar: React.FC<DevToolbarProps> = ({
  onSimulateDing,
  onSimulateMotion,
  alarmMode,
  onCycleAlarmMode,
  isLocked,
  onToggleLock,
  onTriggerNightWandering,
  onTriggerInactivityAlert,
  onSimulateDelivery,
  onTriggerWebhook,
  isInsideGeofence,
  geofenceDistance,
  onToggleGeofence,
  onChangeGeofenceDistance,
  geofenceAutoDisarm,
  onToggleGeofenceAutoDisarm,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTriggerLabel, setActiveTriggerLabel] = useState<string | null>(null);

  const notifyTrigger = (label: string) => {
    setActiveTriggerLabel(label);
    setTimeout(() => setActiveTriggerLabel(null), 2500);
  };

  const handleDing = () => {
    ringAudio.playChime();
    notifyTrigger('Doorbell Ring ("ding") Triggered');
    onSimulateDing();
  };

  const handleMotion = () => {
    ringAudio.playKeypadBeep();
    notifyTrigger('Motion Stream Event Triggered');
    onSimulateMotion();
  };

  const handleLockToggle = () => {
    ringAudio.playLockSound(!isLocked);
    notifyTrigger(`Smart Deadbolt: ${!isLocked ? 'Locked' : 'Unlocked'}`);
    onToggleLock();
  };

  const handleAlarmToggle = () => {
    ringAudio.playKeypadBeep();
    onCycleAlarmMode();
  };

  const getAlarmBadge = () => {
    switch (alarmMode) {
      case 'away':
        return { label: 'Away (Armed)', color: 'text-rose-400 border-rose-500/40 bg-rose-950/60' };
      case 'home':
        return { label: 'Home (Armed)', color: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/60' };
      default:
        return { label: 'Disarmed', color: 'text-slate-400 border-slate-700 bg-slate-900' };
    }
  };

  const alarmBadge = getAlarmBadge();

  return (
    <aside aria-label="Ring Hardware Dev Toolbar" className="fixed bottom-4 right-4 z-50 max-w-md w-full sm:w-auto">
      <div className="bg-slate-900/95 backdrop-blur-md border border-sky-500/40 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden transition-all">
        {/* Header Bar */}
        <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 ring-led-active" />
            <span className="text-xs font-bold tracking-wider uppercase text-white font-mono">
              Ring Dev Toolbar
            </span>
            <span className="text-[10px] text-sky-400 bg-sky-950/80 px-1.5 py-0.5 rounded border border-sky-800 font-mono">
              Hardware Sim
            </span>
          </div>

          <div className="flex items-center gap-2">
            {activeTriggerLabel && (
              <span className="text-[11px] font-medium text-emerald-300 animate-pulse hidden sm:inline">
                {activeTriggerLabel}
              </span>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title={isExpanded ? 'Minimize Toolbar' : 'Expand Toolbar'}
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Expandable Controls */}
        {isExpanded && (
          <div className="p-3.5 space-y-3">
            {/* Primary Hardware Events Grid */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleDing}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer active:scale-95"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Simulate Doorbell Ring</span>
              </button>

              <button
                onClick={handleMotion}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-amber-600/90 hover:bg-amber-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer active:scale-95"
              >
                <Footprints className="w-3.5 h-3.5" />
                <span>Simulate Motion Stream</span>
              </button>

              <button
                onClick={handleAlarmToggle}
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${alarmBadge.color} active:scale-95`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Alarm: {alarmBadge.label}</span>
              </button>

              <button
                onClick={handleLockToggle}
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer active:scale-95 ${
                  isLocked
                    ? 'bg-slate-800 text-emerald-400 border-emerald-500/40 hover:bg-slate-750'
                    : 'bg-emerald-600 text-white border-emerald-500'
                }`}
              >
                {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                <span>{isLocked ? 'Lock: LOCKED' : 'Lock: UNLOCKED'}</span>
              </button>
            </div>

            {/* Quick Safety & Webhook Scenario Buttons */}
            <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="text-slate-500 font-mono text-[10px] mr-1">SCENARIOS:</span>

              <button
                onClick={() => {
                  ringAudio.playSirenShort();
                  notifyTrigger('Night Wandering Rule Triggered (12 AM - 5 AM)');
                  onTriggerNightWandering();
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer flex items-center gap-1"
              >
                <Moon className="w-3 h-3 text-sky-400" />
                <span>Night Wandering</span>
              </button>

              <button
                onClick={() => {
                  ringAudio.playKeypadBeep();
                  notifyTrigger('Morning Inactivity Check-in Evaluated');
                  onTriggerInactivityAlert();
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer flex items-center gap-1"
              >
                <Sun className="w-3 h-3 text-amber-400" />
                <span>Inactivity Check</span>
              </button>

              <button
                onClick={() => {
                  ringAudio.playLockSound(false);
                  notifyTrigger('Amazon Key Courier Scheduled Dropoff');
                  onSimulateDelivery();
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer flex items-center gap-1"
              >
                <PackageCheck className="w-3 h-3 text-emerald-400" />
                <span>Courier Window</span>
              </button>

              <button
                onClick={() => {
                  notifyTrigger('Ring Webhook Dispatched to Server');
                  onTriggerWebhook('ding');
                }}
                className="px-2.5 py-1 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 text-indigo-200 border border-indigo-700/60 transition-colors cursor-pointer flex items-center gap-1 font-mono"
              >
                <Zap className="w-3 h-3 text-indigo-400" />
                <span>Webhook Ding</span>
              </button>
            </div>

            {/* Geofencing Mobile Perimeter Simulation Section */}
            <div className="pt-2.5 border-t border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-white">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Mobile Geofence Perimeter (150m Radius)</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    isInsideGeofence
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}
                >
                  {isInsideGeofence
                    ? `Inside Home (${geofenceDistance}m)`
                    : `Outside Away (${geofenceDistance}m)`}
                </span>
              </div>

              {/* Geofence Ingress & Egress Trigger Actions */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => {
                    notifyTrigger('Simulated Arrival: User Device Crosses 150m Home Boundary -> Auto-Disarm');
                    onChangeGeofenceDistance(35);
                  }}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg border font-medium transition-all cursor-pointer ${
                    isInsideGeofence
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                >
                  <Home className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Enter Perimeter (35m)</span>
                </button>

                <button
                  onClick={() => {
                    notifyTrigger('Simulated Departure: User Device Exits Home Perimeter (260m)');
                    onChangeGeofenceDistance(260);
                  }}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg border font-medium transition-all cursor-pointer ${
                    !isInsideGeofence
                      ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                >
                  <Car className="w-3.5 h-3.5 text-amber-300" />
                  <span>Exit Perimeter (260m)</span>
                </button>
              </div>

              {/* Interactive Distance Slider */}
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Simulated Distance from Home:</span>
                  <span
                    className={
                      geofenceDistance <= 150
                        ? 'text-emerald-400 font-bold'
                        : 'text-amber-400 font-bold'
                    }
                  >
                    {geofenceDistance}m {geofenceDistance <= 150 ? '(Inside Boundary)' : '(Outside Radius)'}
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="400"
                  step="10"
                  value={geofenceDistance}
                  onChange={(e) => onChangeGeofenceDistance(parseInt(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer h-1.5"
                />
                <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono">
                  <span>10m (Driveway)</span>
                  <span className="text-sky-400 font-bold">150m Perimeter Threshold</span>
                  <span>400m (Away)</span>
                </div>
              </div>

              {/* Auto-Disarm Toggle */}
              <div className="flex items-center justify-between text-[11px] text-slate-300 px-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={geofenceAutoDisarm}
                    onChange={onToggleGeofenceAutoDisarm}
                    className="w-3.5 h-3.5 rounded accent-emerald-500 bg-slate-900 border-slate-700"
                  />
                  <span>Auto-Disarm Alarm when entering home perimeter</span>
                </label>
                <span className="text-[10px] text-emerald-400 font-mono font-semibold">
                  {geofenceAutoDisarm ? 'ENABLED' : 'DISABLED'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
