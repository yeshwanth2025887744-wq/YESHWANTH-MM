import React, { useState } from 'react';
import {
  X,
  Bell,
  Footprints,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  Moon,
  Camera,
  CheckCircle2,
  Copy,
  Check,
  Radio,
  Sparkles,
  Sliders,
  Terminal,
  Volume2,
  AlertTriangle,
} from 'lucide-react';
import { ringAudio } from '../utils/audio.ts';

export type SimEventKind =
  | 'doorbot_ding'
  | 'motion'
  | 'alarm_mode_change'
  | 'smart_lock_toggle'
  | 'caretaking_inactivity';

export interface RingSimulatedEventPayload {
  eventId: string;
  kind: SimEventKind;
  deviceName: string;
  deviceId: string;
  timestamp: string;
  snapshotUrl?: string;
  details: string;
  metadata?: Record<string, any>;
}

export interface SimulatorPanelProps {
  isOpen: boolean;
  onClose: () => void;
  alarmMode: 'disarmed' | 'home' | 'away';
  onChangeAlarmMode: (mode: 'disarmed' | 'home' | 'away') => void;
  isLocked: boolean;
  onToggleLock: () => void;
  onDispatchEvent: (event: RingSimulatedEventPayload) => void;
  onTriggerDoorbellDing?: (speech?: string) => void;
  onTriggerMotionEvent?: (cameraLocation: 'Front Door' | 'Backyard Loading Dock') => void;
  onTriggerInactivityAlert?: () => void;
}

export const SimulatorPanel: React.FC<SimulatorPanelProps> = ({
  isOpen,
  onClose,
  alarmMode,
  onChangeAlarmMode,
  isLocked,
  onToggleLock,
  onDispatchEvent,
  onTriggerDoorbellDing,
  onTriggerMotionEvent,
  onTriggerInactivityAlert,
}) => {
  const [selectedMotionCamera, setSelectedMotionCamera] = useState<'Front Door' | 'Backyard Loading Dock'>('Front Door');
  const [visitorSpeechInput, setVisitorSpeechInput] = useState('Hello, I have a package delivery from Amazon for Eleanor.');
  const [lastDispatchedPayload, setLastDispatchedPayload] = useState<RingSimulatedEventPayload | null>(null);
  const [hasCopied, setHasCopied] = useState(false);
  const [activeFeedback, setActiveFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const showFeedback = (msg: string) => {
    setActiveFeedback(msg);
    setTimeout(() => setActiveFeedback(null), 3000);
  };

  // 1. Trigger Doorbell Ring (Ding)
  const handleTriggerDoorbellDing = () => {
    ringAudio.playChime();
    const eventPayload: RingSimulatedEventPayload = {
      eventId: `ding_${Date.now()}`,
      kind: 'doorbot_ding',
      deviceName: 'Ring Video Doorbell Pro 2',
      deviceId: 'dev_doorbell_front',
      timestamp: new Date().toLocaleTimeString(),
      snapshotUrl: '/src/assets/images/ring_doorbell_cam_feed_1790696834179.jpg',
      details: `Push button pressed at Front Entryway. Visitor Speech: "${visitorSpeechInput}"`,
      metadata: {
        battery_level: 98,
        firmware: '3.18.42',
        chime_strobe_activated: true,
        visitor_audio_prompt: visitorSpeechInput,
      },
    };

    setLastDispatchedPayload(eventPayload);
    onDispatchEvent(eventPayload);
    if (onTriggerDoorbellDing) {
      onTriggerDoorbellDing(visitorSpeechInput);
    }
    showFeedback('Doorbell Ding ("ding") event dispatched!');
  };

  // 2. Trigger Motion Event
  const handleTriggerMotion = () => {
    ringAudio.playKeypadBeep();
    const isFront = selectedMotionCamera === 'Front Door';
    const eventPayload: RingSimulatedEventPayload = {
      eventId: `motion_${Date.now()}`,
      kind: 'motion',
      deviceName: isFront ? 'Ring Video Doorbell Pro 2' : 'Ring Floodlight Cam Wired Pro',
      deviceId: isFront ? 'dev_doorbell_front' : 'dev_floodlight_dock',
      timestamp: new Date().toLocaleTimeString(),
      snapshotUrl: isFront
        ? '/src/assets/images/ring_doorbell_cam_feed_1790696834179.jpg'
        : '/src/assets/images/ring_warehouse_dock_cam_1790696848723.jpg',
      details: `PIR 3D radar motion stream detected on ${selectedMotionCamera}. Spotlights illuminated.`,
      metadata: {
        zone: isFront ? 'Zone 1 (Front Porch)' : 'Loading Bay 4 Perimeter',
        spotlights_active: true,
        confidence: 0.96,
      },
    };

    setLastDispatchedPayload(eventPayload);
    onDispatchEvent(eventPayload);
    if (onTriggerMotionEvent) {
      onTriggerMotionEvent(selectedMotionCamera);
    }
    showFeedback(`Motion stream event dispatched on ${selectedMotionCamera}!`);
  };

  // 3. Cycle Alarm Mode (Disarmed / Home / Away)
  const handleAlarmModeChange = (targetMode: 'disarmed' | 'home' | 'away') => {
    ringAudio.playKeypadBeep();
    onChangeAlarmMode(targetMode);

    const eventPayload: RingSimulatedEventPayload = {
      eventId: `alarm_${Date.now()}`,
      kind: 'alarm_mode_change',
      deviceName: 'Ring Alarm Base Station Pro',
      deviceId: 'dev_alarm_base',
      timestamp: new Date().toLocaleTimeString(),
      details: `Ring Alarm mode shifted to ${targetMode.toUpperCase()}. Keypad tone confirmed.`,
      metadata: {
        previous_mode: alarmMode,
        new_mode: targetMode,
        cellular_backup: true,
        zwave_sensors_armed: targetMode !== 'disarmed',
      },
    };

    setLastDispatchedPayload(eventPayload);
    onDispatchEvent(eventPayload);
    showFeedback(`Alarm mode changed to ${targetMode.toUpperCase()}!`);
  };

  // 4. Toggle Smart Lock
  const handleSmartLockToggle = () => {
    const nextLocked = !isLocked;
    ringAudio.playLockSound(nextLocked);
    onToggleLock();

    const eventPayload: RingSimulatedEventPayload = {
      eventId: `lock_${Date.now()}`,
      kind: 'smart_lock_toggle',
      deviceName: 'Ring Smart Deadbolt Plus',
      deviceId: 'dev_smart_lock_front',
      timestamp: new Date().toLocaleTimeString(),
      snapshotUrl: '/src/assets/images/ring_doorbell_cam_feed_1790696834179.jpg',
      details: `Motorized deadbolt ${nextLocked ? 'BOLTED (Locked)' : 'UNLATCHED (Unlocked)'}.`,
      metadata: {
        locked: nextLocked,
        auto_relock_seconds: 60,
        door_contact_closed: true,
        zwave_signal_rssi: -58,
      },
    };

    setLastDispatchedPayload(eventPayload);
    onDispatchEvent(eventPayload);
    showFeedback(`Smart Deadbolt ${nextLocked ? 'Locked' : 'Unlocked'}!`);
  };

  // 5. Simulate Night Inactivity Alert (Caretaking Rule)
  const handleTriggerInactivity = () => {
    ringAudio.playSirenShort();
    const eventPayload: RingSimulatedEventPayload = {
      eventId: `care_${Date.now()}`,
      kind: 'caretaking_inactivity',
      deviceName: 'Senior Hallway & Entry Motion Sensor',
      deviceId: 'dev_motion_hallway',
      timestamp: '08:45 AM (Simulated Check-In)',
      snapshotUrl: '/src/assets/images/ring_interior_care_livingroom_1790696861770.jpg',
      details: 'Inactivity Rule Alert: Zero morning hallway motion detected during waking window (07:00 AM - 10:00 AM).',
      metadata: {
        resident_name: 'Eleanor Vance (Age 78)',
        caregiver_notified: '+1 (408) 555-0192 (Sarah Vance)',
        severity: 'Caregiver Check-In Recommended',
        contact_sensors_quiet: true,
      },
    };

    setLastDispatchedPayload(eventPayload);
    onDispatchEvent(eventPayload);
    if (onTriggerInactivityAlert) {
      onTriggerInactivityAlert();
    }
    showFeedback('Caretaking Inactivity Alert triggered & caregiver notified!');
  };

  const handleCopyPayload = () => {
    if (!lastDispatchedPayload) return;
    navigator.clipboard.writeText(JSON.stringify(lastDispatchedPayload, null, 2));
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
      {/* Side Drawer Container */}
      <div className="w-full max-w-md bg-slate-950 border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-sky-400 ring-led-active" />
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <span>Ring Hardware Simulator</span>
                <span className="text-[10px] bg-sky-950 text-sky-300 px-1.5 py-0.5 rounded border border-sky-800 font-mono">
                  Dev Panel
                </span>
              </h2>
              <div className="text-xs text-slate-400 mt-0.5">Judge &amp; Developer Test Bench</div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close Simulator Panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Feedback Toast Bar */}
        {activeFeedback && (
          <div className="bg-sky-950 border-b border-sky-800/80 px-4 py-2 flex items-center gap-2 text-xs text-sky-200 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
            <span className="truncate font-medium">{activeFeedback}</span>
          </div>
        )}

        {/* Drawer Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Section 1: Doorbell Ring (Ding) Simulator */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-sky-950 border border-sky-800 text-sky-400">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Doorbell Ring (Ding)</h3>
                  <div className="text-xs text-slate-400">Doorbot push event with dual-tone audio</div>
                </div>
              </div>
              <span className="text-[10px] text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded font-mono">
                1536p HDR
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Simulated Visitor Speech (for AAC / Strobe):
              </label>
              <input
                type="text"
                value={visitorSpeechInput}
                onChange={(e) => setVisitorSpeechInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
                placeholder="What visitor says when ringing..."
              />
            </div>

            <button
              onClick={handleTriggerDoorbellDing}
              className="w-full py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs tracking-wide transition-all cursor-pointer shadow-md shadow-sky-600/20 active:scale-98 flex items-center justify-center gap-2"
            >
              <Bell className="w-4 h-4" />
              <span>Trigger Doorbell Ring (Ding)</span>
            </button>
          </div>

          {/* Section 2: Motion Event Stream Simulator */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-950 border border-amber-800 text-amber-400">
                  <Footprints className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Motion Stream Event</h3>
                  <div className="text-xs text-slate-400">PIR radar trigger with spotlight activation</div>
                </div>
              </div>
              <span className="text-[10px] text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded font-mono">
                3D Radar
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Select Camera Detection Zone:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['Front Door', 'Backyard Loading Dock'] as const).map((loc) => (
                  <button
                    key={loc}
                    onClick={() => setSelectedMotionCamera(loc)}
                    className={`py-1.5 px-2.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                      selectedMotionCamera === loc
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleTriggerMotion}
              className="w-full py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs tracking-wide transition-all cursor-pointer shadow-md shadow-amber-600/20 active:scale-98 flex items-center justify-center gap-2"
            >
              <Footprints className="w-4 h-4" />
              <span>Trigger Motion on {selectedMotionCamera}</span>
            </button>
          </div>

          {/* Section 3: Alarm Mode Controls (Disarmed / Home / Away) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-sky-400">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Ring Alarm Base Mode</h3>
                  <div className="text-xs text-slate-400">Arm or disarm perimeter sensors</div>
                </div>
              </div>
              <span className="text-[10px] text-slate-400 font-mono capitalize">
                Current: {alarmMode}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleAlarmModeChange('disarmed')}
                className={`py-2 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  alarmMode === 'disarmed'
                    ? 'bg-slate-800 text-white border-slate-500 shadow-sm'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <Shield className="w-4 h-4 text-slate-400" />
                <span>Disarmed</span>
              </button>

              <button
                onClick={() => handleAlarmModeChange('home')}
                className={`py-2 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  alarmMode === 'home'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-500 shadow-sm'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-emerald-400'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Home Armed</span>
              </button>

              <button
                onClick={() => handleAlarmModeChange('away')}
                className={`py-2 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  alarmMode === 'away'
                    ? 'bg-rose-950 text-rose-300 border-rose-500 shadow-sm'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-rose-400'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>Away Armed</span>
              </button>
            </div>
          </div>

          {/* Section 4: Smart Deadbolt State Toggle */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`p-2 rounded-lg border ${
                    isLocked
                      ? 'bg-emerald-950 border-emerald-800 text-emerald-400'
                      : 'bg-amber-950 border-amber-800 text-amber-400'
                  }`}
                >
                  {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Smart Deadbolt State</h3>
                  <div className="text-xs text-slate-400">Z-Wave / Amazon Key motorized latch</div>
                </div>
              </div>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                  isLocked ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                }`}
              >
                {isLocked ? 'LOCKED' : 'UNLOCKED'}
              </span>
            </div>

            <button
              onClick={handleSmartLockToggle}
              className={`w-full py-2.5 rounded-lg font-semibold text-xs tracking-wide transition-all cursor-pointer border shadow-md flex items-center justify-center gap-2 ${
                isLocked
                  ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border-emerald-500/40'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500'
              }`}
            >
              {isLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              <span>{isLocked ? 'Switch to UNLOCKED' : 'Switch to LOCKED'}</span>
            </button>
          </div>

          {/* Section 5: Caretaking Inactivity Alert */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-950 border border-indigo-800 text-indigo-400">
                  <Moon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Caretaking Inactivity Rule</h3>
                  <div className="text-xs text-slate-400">Elderly wellness routine anomaly alert</div>
                </div>
              </div>
              <span className="text-[10px] text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded font-mono">
                Senior Safety
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Simulates zero movement detected in the hallway during Eleanor's waking window (07:00 AM - 10:00 AM) and notifies family caregiver.
            </p>

            <button
              onClick={handleTriggerInactivity}
              className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs tracking-wide transition-all cursor-pointer shadow-md shadow-indigo-600/20 active:scale-98 flex items-center justify-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Simulate Night/Morning Inactivity Alert</span>
            </button>
          </div>

          {/* Section 6: Live Dispatched Payload Inspector */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                  Event Dispatch Inspector
                </span>
              </div>

              {lastDispatchedPayload && (
                <button
                  onClick={handleCopyPayload}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {hasCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{hasCopied ? 'Copied' : 'Copy'}</span>
                </button>
              )}
            </div>

            {lastDispatchedPayload ? (
              <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] font-mono text-sky-200 overflow-x-auto max-h-48 leading-relaxed">
                {JSON.stringify(lastDispatchedPayload, null, 2)}
              </pre>
            ) : (
              <div className="text-[11px] text-slate-500 italic p-3 text-center bg-slate-950 rounded-lg border border-slate-800/60 font-mono">
                Click any trigger button above to observe the dispatched Ring payload object in real-time.
              </div>
            )}
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>Ring Cloud Simulator: ONLINE</span>
          <button
            onClick={onClose}
            className="text-sky-400 hover:text-sky-300 font-medium cursor-pointer"
          >
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
};
