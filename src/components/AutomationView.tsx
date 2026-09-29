import React, { useState } from 'react';
import {
  Cpu,
  Plus,
  Play,
  CheckCircle2,
  Volume2,
  Bell,
  Lock,
  Unlock,
  Lightbulb,
  AlertTriangle,
  Radio,
  Sliders,
  Sparkles,
  Smartphone,
  Moon,
  Clock,
  ArrowRight,
  Shield,
  Layers,
  Zap,
} from 'lucide-react';
import { RingDevice, AutomationRoutine, AutomationCondition } from '../types/ring.ts';
import { ringAudio } from '../utils/audio.ts';

interface AutomationViewProps {
  devices: RingDevice[];
  routines: AutomationRoutine[];
  onToggleRoutine: (id: string) => void;
  onAddRoutine: (routine: AutomationRoutine) => void;
  isLocked: boolean;
  onToggleLock: () => void;
  isSpotlightOn: boolean;
  onToggleSpotlight: () => void;
  isSirenOn: boolean;
  onToggleSiren: () => void;
  alarmMode: 'disarmed' | 'home' | 'away';
  onChangeAlarmMode: (mode: 'disarmed' | 'home' | 'away') => void;
  onOpenLiveCam: (device: RingDevice) => void;
}

export const AutomationView: React.FC<AutomationViewProps> = ({
  devices,
  routines,
  onToggleRoutine,
  onAddRoutine,
  isLocked,
  onToggleLock,
  isSpotlightOn,
  onToggleSpotlight,
  isSirenOn,
  onToggleSiren,
  alarmMode,
  onChangeAlarmMode,
  onOpenLiveCam,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionToast, setActionToast] = useState<string | null>(null);

  // New Routine Form state
  const [newRoutineName, setNewRoutineName] = useState('');
  const [newRoutineDesc, setNewRoutineDesc] = useState('');
  const [newCategory, setNewCategory] = useState<AutomationRoutine['category']>('security');
  
  // WHEN Trigger
  const [newTriggerDevice, setNewTriggerDevice] = useState('dev_doorbell_front');
  const [newTriggerEvent, setNewTriggerEvent] = useState('Doorbell rings');

  // AND Conditions (Combinable)
  const [selectedConditions, setSelectedConditions] = useState<string[]>(['alarm_away']);

  // THEN Actions (Multi-select)
  const [selectedActionTypes, setSelectedActionTypes] = useState<string[]>([
    'switch_on_floodlight',
    'notify_mobile',
  ]);

  const showToast = (msg: string) => {
    setActionToast(msg);
    setTimeout(() => setActionToast(null), 3500);
  };

  const filteredRoutines = routines.filter((r) => {
    if (filterCategory === 'all') return true;
    return r.category === filterCategory;
  });

  const handleTestChime = () => {
    ringAudio.playChime();
  };

  // Test executing a routine based on actual live device states
  const handleTestExecuteRoutine = (routine: AutomationRoutine) => {
    // Evaluate conditions against live state
    let conditionsSatisfied = true;
    let unmetReason = '';

    if (routine.conditions && routine.conditions.length > 0) {
      for (const cond of routine.conditions) {
        if (cond.field === 'alarm_mode') {
          if (alarmMode !== cond.value) {
            conditionsSatisfied = false;
            unmetReason = `Condition failed: Alarm is currently "${alarmMode.toUpperCase()}", but rule requires Alarm to be "${cond.value.toUpperCase()}". Set Alarm to ${cond.value.toUpperCase()} in header and try again!`;
            break;
          }
        }
        if (cond.field === 'lock_state') {
          const reqLocked = cond.value === 'locked';
          if (isLocked !== reqLocked) {
            conditionsSatisfied = false;
            unmetReason = `Condition failed: Deadbolt is currently ${isLocked ? 'Locked' : 'Unlocked'}, but rule requires ${cond.label}.`;
            break;
          }
        }
      }
    }

    if (conditionsSatisfied) {
      // Execute actions!
      ringAudio.playKeypadBeep();
      let actionsSummary: string[] = [];

      routine.actions.forEach((act) => {
        if (act.action.includes('spotlight') || act.action === 'spotlights_on') {
          if (!isSpotlightOn) onToggleSpotlight();
          actionsSummary.push('Floodlight Spotlights Switched ON (100%)');
        }
        if (act.action.includes('notify') || act.action === 'push_notification') {
          actionsSummary.push('Mobile Push Notification Dispatched');
        }
        if (act.action.includes('siren')) {
          onToggleSiren();
          actionsSummary.push('110dB Siren Engaged');
        }
        if (act.action.includes('lock')) {
          if (!isLocked) onToggleLock();
          actionsSummary.push('Smart Deadbolt Auto-Locked');
        }
      });

      routine.executionCount += 1;
      routine.lastRun = 'Just now (Rule Passed)';
      showToast(`SUCCESS: IF-THEN conditions satisfied! [${actionsSummary.join(' · ')}]`);
    } else {
      ringAudio.playSirenShort();
      showToast(`EVALUATION NOTE: ${unmetReason}`);
    }
  };

  // Preset Template Loader
  const handleLoadPreset = (presetKey: 'away_floodlight' | 'night_siren' | 'contact_lock') => {
    if (presetKey === 'away_floodlight') {
      setNewRoutineName('Away Deterrence: Doorbell Ring Floodlight & Mobile Alert');
      setNewRoutineDesc('When Doorbell rings AND Alarm is Away, THEN switch on floodlight and notify mobile.');
      setNewCategory('security');
      setNewTriggerDevice('dev_doorbell_front');
      setNewTriggerEvent('Doorbell rings');
      setSelectedConditions(['alarm_away']);
      setSelectedActionTypes(['switch_on_floodlight', 'notify_mobile']);
    } else if (presetKey === 'night_siren') {
      setNewRoutineName('Night Perimeter Breach Deterrent');
      setNewRoutineDesc('When Motion detected AND Time is Night (10PM - 6AM), THEN switch on floodlight and sound siren.');
      setNewCategory('security');
      setNewTriggerDevice('dev_floodlight_dock');
      setNewTriggerEvent('Motion detected');
      setSelectedConditions(['time_night']);
      setSelectedActionTypes(['switch_on_floodlight', 'sound_siren', 'notify_mobile']);
    } else {
      setNewRoutineName('Home Safe: Auto-Lock on Door Close');
      setNewRoutineDesc('When Door contact closed AND Alarm is Home, THEN auto-lock deadbolt.');
      setNewCategory('convenience');
      setNewTriggerDevice('dev_contact_frontdoor');
      setNewTriggerEvent('Door contact opened');
      setSelectedConditions(['alarm_home']);
      setSelectedActionTypes(['auto_lock_deadbolt']);
    }
    setIsModalOpen(true);
  };

  const handleCreateRoutine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoutineName.trim()) return;

    // Build conditions array
    const conditions: AutomationCondition[] = [];
    if (selectedConditions.includes('alarm_away')) {
      conditions.push({ field: 'alarm_mode', value: 'away', label: 'Alarm is Away' });
    }
    if (selectedConditions.includes('alarm_home')) {
      conditions.push({ field: 'alarm_mode', value: 'home', label: 'Alarm is Home' });
    }
    if (selectedConditions.includes('alarm_disarmed')) {
      conditions.push({ field: 'alarm_mode', value: 'disarmed', label: 'Alarm is Disarmed' });
    }
    if (selectedConditions.includes('lock_locked')) {
      conditions.push({ field: 'lock_state', value: 'locked', label: 'Deadbolt is Locked' });
    }
    if (selectedConditions.includes('time_night')) {
      conditions.push({ field: 'time_window', value: 'night', label: 'Time is Night (10PM - 6AM)' });
    }

    // Build actions array
    const actions: Array<{ deviceId: string; action: string; label: string }> = [];
    if (selectedActionTypes.includes('switch_on_floodlight')) {
      actions.push({
        deviceId: 'dev_floodlight_dock',
        action: 'spotlights_on',
        label: 'Switch on Floodlight Spotlights (100%)',
      });
    }
    if (selectedActionTypes.includes('notify_mobile')) {
      actions.push({
        deviceId: 'mobile_app',
        action: 'push_notification',
        label: 'Notify Mobile Security App',
      });
    }
    if (selectedActionTypes.includes('sound_siren')) {
      actions.push({
        deviceId: 'dev_alarm_base',
        action: 'sound_siren',
        label: 'Sound 110dB Alarm Siren',
      });
    }
    if (selectedActionTypes.includes('auto_lock_deadbolt')) {
      actions.push({
        deviceId: 'dev_smart_lock_front',
        action: 'lock_door',
        label: 'Auto-Lock Smart Deadbolt',
      });
    }

    const conditionText = conditions.map((c) => c.label).join(' AND ') || 'Anytime';

    const routine: AutomationRoutine = {
      id: `rtn_${Date.now()}`,
      name: newRoutineName.trim(),
      description:
        newRoutineDesc.trim() ||
        `When ${newTriggerEvent} AND ${conditionText}, THEN execute ${actions.length} action(s).`,
      enabled: true,
      category: newCategory,
      trigger: {
        deviceId: newTriggerDevice,
        eventType: newTriggerEvent,
        conditionText: `When ${newTriggerEvent}`,
      },
      conditions,
      actions: actions.length > 0 ? actions : [
        { deviceId: 'dev_floodlight_dock', action: 'spotlights_on', label: 'Switch on Floodlight' },
      ],
      executionCount: 0,
    };

    onAddRoutine(routine);
    setIsModalOpen(false);
    setNewRoutineName('');
    setNewRoutineDesc('');
    showToast(`New conditional rule "${routine.name}" created!`);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {actionToast && (
        <div className="fixed top-16 right-6 z-50 bg-slate-900 border border-sky-400 text-sky-200 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs animate-in slide-in-from-top duration-200">
          <Zap className="w-4 h-4 text-sky-400 shrink-0" />
          <span className="font-medium">{actionToast}</span>
        </div>
      )}

      {/* Top Banner: IoT Hub & Routine Rules */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-sky-400" />
            <h1 className="text-xl font-bold tracking-tight text-white">Ring Smart Automation &amp; Rule Engine</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Build multi-device 'If-This-Then-That' conditional rules combining doorbell triggers, alarm modes, smart deadbolts, and floodlights.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleLoadPreset('away_floodlight')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-500/40 font-medium text-xs transition-colors cursor-pointer"
            title="Load: When Doorbell rings AND Alarm is Away, THEN switch on floodlight and notify mobile"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Preset: Away Doorbell Floodlight</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs transition-colors cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Create Conditional Rule</span>
          </button>
        </div>
      </div>

      {/* 'IF-THIS-THEN-THAT' Engine Highlights Card */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-sky-500/30 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 ring-led-active" />
            <span className="text-xs font-bold uppercase tracking-wider text-sky-300 font-mono">
              Ring Conditional Logic Engine (IF-THEN-THAT)
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <span>Live Alarm: <strong className="text-white capitalize">{alarmMode}</strong></span>
            <span>·</span>
            <span>Lock: <strong className={isLocked ? 'text-emerald-400' : 'text-amber-400'}>{isLocked ? 'Locked' : 'Unlocked'}</strong></span>
            <span>·</span>
            <span>Spotlights: <strong className={isSpotlightOn ? 'text-amber-300' : 'text-slate-400'}>{isSpotlightOn ? 'ON' : 'OFF'}</strong></span>
          </div>
        </div>

        {/* Visual Rule Flow Mockup */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          {/* WHEN Trigger */}
          <div className="flex items-center gap-2 bg-slate-900 p-2.5 rounded-lg border border-slate-800 flex-1 w-full md:w-auto">
            <div className="p-1.5 bg-sky-950 text-sky-400 rounded">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-sky-400 font-bold uppercase font-mono">WHEN (Trigger)</div>
              <div className="text-white font-semibold">Doorbell Rings</div>
            </div>
          </div>

          <div className="text-slate-500 font-bold font-mono px-1">AND</div>

          {/* AND Condition */}
          <div className="flex items-center gap-2 bg-slate-900 p-2.5 rounded-lg border border-slate-800 flex-1 w-full md:w-auto">
            <div className="p-1.5 bg-rose-950 text-rose-400 rounded">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-rose-400 font-bold uppercase font-mono">AND (Condition State)</div>
              <div className="text-white font-semibold">Alarm is Away</div>
            </div>
          </div>

          <div className="text-slate-500 font-bold font-mono px-1">THEN</div>

          {/* THEN Actions */}
          <div className="flex items-center gap-2 bg-slate-900 p-2.5 rounded-lg border border-slate-800 flex-1 w-full md:w-auto">
            <div className="p-1.5 bg-amber-950 text-amber-400 rounded">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-amber-400 font-bold uppercase font-mono">THEN (Actions)</div>
              <div className="text-white font-semibold">Switch on Floodlight + Notify Mobile</div>
            </div>
          </div>

          <button
            onClick={() => handleLoadPreset('away_floodlight')}
            className="px-3.5 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors cursor-pointer shrink-0 whitespace-nowrap shadow"
          >
            Load This Rule
          </button>
        </div>
      </div>

      {/* Ring Device Fleet Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-white">Ring Device Fleet</h2>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span>{devices.length} Devices Online</span>
              <span>·</span>
              <span>Ring Bridge &amp; Z-Wave Active</span>
            </div>
          </div>

          {/* Alarm Mode Segmented Control */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800 text-xs">
            {(['disarmed', 'home', 'away'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => onChangeAlarmMode(mode)}
                className={`px-3 py-1 rounded capitalize font-medium transition-colors cursor-pointer ${
                  alarmMode === mode
                    ? mode === 'away'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : mode === 'home'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {devices.map((device) => (
            <div
              key={device.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 ring-led-active" />
                    <span className="text-xs font-semibold text-slate-200 truncate">{device.name}</span>
                  </div>
                  <span className="text-xs text-slate-400 capitalize whitespace-nowrap">{device.kind.replace('_', ' ')}</span>
                </div>

                <div className="text-xs text-slate-400 mt-1">{device.location}</div>

                <div className="flex items-center gap-2 text-xs text-slate-500 mt-2 font-mono tabular-nums">
                  {device.batteryLevel ? (
                    <span>Bat: {device.batteryLevel}%</span>
                  ) : (
                    <span>Hardwired 16-24VAC</span>
                  )}
                  <span>·</span>
                  <span>{device.wifiSignalRssi} dBm</span>
                </div>
              </div>

              {/* Dynamic Quick Actions on Card */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                {device.kind === 'doorbell' && (
                  <button
                    onClick={() => onOpenLiveCam(device)}
                    className="w-full py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 font-medium transition-colors cursor-pointer"
                  >
                    Open Live Video
                  </button>
                )}

                {device.kind === 'floodlight_cam' && (
                  <div className="flex items-center gap-2 w-full">
                    <button
                      onClick={onToggleSpotlight}
                      className={`flex-1 py-1.5 rounded font-medium transition-colors cursor-pointer ${
                        isSpotlightOn
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      Light: {isSpotlightOn ? 'ON' : 'OFF'}
                    </button>
                    <button
                      onClick={() => onOpenLiveCam(device)}
                      className="py-1.5 px-2.5 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 font-medium transition-colors cursor-pointer"
                    >
                      Live
                    </button>
                  </div>
                )}

                {device.kind === 'smart_lock' && (
                  <button
                    onClick={() => {
                      ringAudio.playLockSound(!isLocked);
                      onToggleLock();
                    }}
                    className={`w-full py-1.5 rounded font-semibold transition-colors cursor-pointer ${
                      isLocked
                        ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {isLocked ? 'Locked (Tap to Open)' : 'Unlocked (Tap to Lock)'}
                  </button>
                )}

                {device.kind === 'chime' && (
                  <button
                    onClick={handleTestChime}
                    className="w-full py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-sky-400" />
                    <span>Test Chime Tone</span>
                  </button>
                )}

                {device.kind === 'alarm_base' && (
                  <button
                    onClick={onToggleSiren}
                    className={`w-full py-1.5 rounded font-medium transition-colors cursor-pointer ${
                      isSirenOn
                        ? 'bg-rose-600 text-white font-bold'
                        : 'bg-slate-800 hover:bg-slate-700 text-rose-300'
                    }`}
                  >
                    {isSirenOn ? 'Siren Active' : 'Siren Test'}
                  </button>
                )}

                {device.kind === 'contact_sensor' && (
                  <div className="w-full py-1 text-center text-slate-400 font-medium">
                    State: <span className="text-slate-200">Closed &amp; Guarded</span>
                  </div>
                )}

                {device.kind === 'motion_sensor' && (
                  <div className="w-full py-1 text-center text-slate-400 font-medium">
                    Status: <span className="text-emerald-400">Idle / Clear</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ring Routines Automation Engine List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 md:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-white">Active Ring Conditional Routines</h2>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span>{routines.length} Configured Rules</span>
              <span>·</span>
              <span>Conditional Logic Evaluated at Edge</span>
            </div>
          </div>

          {/* Category filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs">
            {(['all', 'security', 'caretaking', 'access', 'convenience'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1 rounded capitalize font-medium transition-colors cursor-pointer ${
                  filterCategory === cat
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Routines List */}
        <div className="space-y-3">
          {filteredRoutines.map((routine) => (
            <div
              key={routine.id}
              className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700/80 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-sm font-semibold text-white">{routine.name}</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase bg-slate-800 text-sky-400 border border-slate-700">
                    {routine.category}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-sans">{routine.description}</p>

                {/* Structured Logic Pill Breakdown */}
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono pt-1">
                  <span className="text-[11px] text-sky-400 bg-sky-950/70 border border-sky-800/60 px-2 py-0.5 rounded">
                    WHEN: {routine.trigger.eventType}
                  </span>

                  {routine.conditions && routine.conditions.length > 0 && (
                    <span className="text-[11px] text-rose-300 bg-rose-950/70 border border-rose-800/60 px-2 py-0.5 rounded">
                      AND: {routine.conditions.map((c) => c.label).join(' & ')}
                    </span>
                  )}

                  <span className="text-[11px] text-emerald-300 bg-emerald-950/70 border border-emerald-800/60 px-2 py-0.5 rounded">
                    THEN: {routine.actions.map((a) => a.label).join(', ')}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono tabular-nums">
                  <span>Executed: {routine.executionCount} times</span>
                  <span>·</span>
                  <span>Last status: {routine.lastRun || 'Monitoring'}</span>
                </div>
              </div>

              {/* Action Buttons: Test Rule & Enable/Disable */}
              <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
                <button
                  onClick={() => handleTestExecuteRoutine(routine)}
                  className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                  title="Simulate trigger and evaluate live device state conditions"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Test Rule</span>
                </button>

                <button
                  onClick={() => onToggleRoutine(routine.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    routine.enabled
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                      : 'bg-slate-800 text-slate-500 border border-slate-700'
                  }`}
                >
                  {routine.enabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: New Conditional 'IF-THIS-THEN-THAT' Rule Builder */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-white mb-1">Create Conditional Ring Rule (IF-THEN)</h2>
            <p className="text-xs text-slate-400 mb-4">
              Combine sensor events with device states (e.g. Alarm Away, Locked) to trigger multi-device actions.
            </p>

            <form onSubmit={handleCreateRoutine} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Rule Name</label>
                <input
                  type="text"
                  required
                  value={newRoutineName}
                  onChange={(e) => setNewRoutineName(e.target.value)}
                  placeholder="e.g. Away Deterrence: Doorbell Ring Floodlight &amp; Mobile Alert"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* 1. WHEN (Trigger Event) */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-sky-400 uppercase font-mono">1. WHEN (Trigger Event)</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Trigger Device</label>
                    <select
                      value={newTriggerDevice}
                      onChange={(e) => setNewTriggerDevice(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
                    >
                      <option value="dev_doorbell_front">Ring Video Doorbell Pro 2</option>
                      <option value="dev_floodlight_dock">Ring Floodlight Cam Wired Pro</option>
                      <option value="dev_contact_frontdoor">Front Door Contact Sensor</option>
                      <option value="dev_smart_lock_front">Ring Smart Deadbolt</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Device Event</label>
                    <select
                      value={newTriggerEvent}
                      onChange={(e) => setNewTriggerEvent(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
                    >
                      <option value="Doorbell rings">Doorbell rings (Ding button pushed)</option>
                      <option value="Motion detected">Motion stream detected in zone</option>
                      <option value="Door contact opened">Door contact sensor opened</option>
                      <option value="Smart deadbolt unlocked">Smart deadbolt unlocked</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 2. AND (Combined Device State Conditions) */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-rose-400 uppercase font-mono">2. AND (Combined Device Conditions)</div>
                <p className="text-[11px] text-slate-400">Rule only fires if all selected conditions match active state:</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                  <label className="flex items-center gap-2 p-2 rounded bg-slate-900 border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedConditions.includes('alarm_away')}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedConditions([...selectedConditions, 'alarm_away']);
                        else setSelectedConditions(selectedConditions.filter((c) => c !== 'alarm_away'));
                      }}
                      className="rounded text-sky-500 bg-slate-950 border-slate-700"
                    />
                    <span className="text-slate-200">Alarm is Away</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded bg-slate-900 border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedConditions.includes('alarm_home')}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedConditions([...selectedConditions, 'alarm_home']);
                        else setSelectedConditions(selectedConditions.filter((c) => c !== 'alarm_home'));
                      }}
                      className="rounded text-sky-500 bg-slate-950 border-slate-700"
                    />
                    <span className="text-slate-200">Alarm is Home</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded bg-slate-900 border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedConditions.includes('lock_locked')}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedConditions([...selectedConditions, 'lock_locked']);
                        else setSelectedConditions(selectedConditions.filter((c) => c !== 'lock_locked'));
                      }}
                      className="rounded text-sky-500 bg-slate-950 border-slate-700"
                    />
                    <span className="text-slate-200">Deadbolt is Locked</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded bg-slate-900 border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedConditions.includes('time_night')}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedConditions([...selectedConditions, 'time_night']);
                        else setSelectedConditions(selectedConditions.filter((c) => c !== 'time_night'));
                      }}
                      className="rounded text-sky-500 bg-slate-950 border-slate-700"
                    />
                    <span className="text-slate-200">Time is Night (10PM-6AM)</span>
                  </label>
                </div>
              </div>

              {/* 3. THEN (Combined Target Actions) */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-amber-400 uppercase font-mono">3. THEN (Dispatched Actions)</div>
                <p className="text-[11px] text-slate-400">Select actions to execute simultaneously when conditions pass:</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                  <label className="flex items-center gap-2 p-2 rounded bg-slate-900 border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedActionTypes.includes('switch_on_floodlight')}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedActionTypes([...selectedActionTypes, 'switch_on_floodlight']);
                        else setSelectedActionTypes(selectedActionTypes.filter((a) => a !== 'switch_on_floodlight'));
                      }}
                      className="rounded text-amber-500 bg-slate-950 border-slate-700"
                    />
                    <span className="text-slate-200">Switch on Floodlight (100%)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded bg-slate-900 border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedActionTypes.includes('notify_mobile')}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedActionTypes([...selectedActionTypes, 'notify_mobile']);
                        else setSelectedActionTypes(selectedActionTypes.filter((a) => a !== 'notify_mobile'));
                      }}
                      className="rounded text-sky-500 bg-slate-950 border-slate-700"
                    />
                    <span className="text-slate-200">Notify Mobile Security</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded bg-slate-900 border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedActionTypes.includes('sound_siren')}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedActionTypes([...selectedActionTypes, 'sound_siren']);
                        else setSelectedActionTypes(selectedActionTypes.filter((a) => a !== 'sound_siren'));
                      }}
                      className="rounded text-rose-500 bg-slate-950 border-slate-700"
                    />
                    <span className="text-slate-200">Sound 110dB Siren</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded bg-slate-900 border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedActionTypes.includes('auto_lock_deadbolt')}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedActionTypes([...selectedActionTypes, 'auto_lock_deadbolt']);
                        else setSelectedActionTypes(selectedActionTypes.filter((a) => a !== 'auto_lock_deadbolt'));
                      }}
                      className="rounded text-emerald-500 bg-slate-950 border-slate-700"
                    />
                    <span className="text-slate-200">Auto-Lock Deadbolt</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newRoutineDesc}
                  onChange={(e) => setNewRoutineDesc(e.target.value)}
                  placeholder="e.g. When Doorbell rings AND Alarm is Away, THEN switch on floodlight and notify mobile."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-xs font-semibold text-white transition-colors cursor-pointer"
                >
                  Save Conditional Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
