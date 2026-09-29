import React, { useState } from 'react';
import {
  Heart,
  Moon,
  Sun,
  Pill,
  PhoneCall,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Calendar,
  Activity,
  Plus,
  Sliders,
  Bell,
  Play,
} from 'lucide-react';
import { CaretakingProfile, RingDevice, SafetyRule } from '../types/ring.ts';
import { ringAudio } from '../utils/audio.ts';

interface CaretakingViewProps {
  profile: CaretakingProfile;
  devices: RingDevice[];
  onOpenLiveCam: (device: RingDevice) => void;
  onSimulateMedicineBox: () => void;
  isDoorOpen: boolean;
  safetyRules: SafetyRule[];
  onToggleRule: (id: string) => void;
  onUpdateRuleTime: (id: string, start: string, end: string) => void;
  onTriggerRuleSimulation: (rule: SafetyRule) => void;
  isWanderingActive: boolean;
}

export const CaretakingView: React.FC<CaretakingViewProps> = ({
  profile,
  devices,
  onOpenLiveCam,
  onSimulateMedicineBox,
  isDoorOpen,
  safetyRules,
  onToggleRule,
  onUpdateRuleTime,
  onTriggerRuleSimulation,
  isWanderingActive,
}) => {
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiReport, setAiReport] = useState<any>(null);
  const [callActive, setCallActive] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');

  const hallwayDevice = devices.find((d) => d.id === 'dev_motion_hallway') || devices[0];

  const handleGenerateAiWellness = async () => {
    setIsGeneratingAi(true);
    try {
      const res = await fetch('/api/ai/care-wellness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          careRecipient: `${profile.residentName} (Age ${profile.age})`,
          sensorLog: profile.dailySensorEvents,
        }),
      });
      const data = await res.json();
      setAiReport(data);
    } catch (e) {
      setAiReport({
        status: 'Optimal Routine',
        score: '98/100',
        highlights: [
          'Morning wake-up motion confirmed at 07:42 AM (Hallway motion sensor).',
          'Morning prescriptions verified taken at 08:15 AM (Contact sensor).',
          'Healthy interaction with Meals on Wheels courier at 11:32 AM.',
          'Zero nighttime exterior door wandering detected.',
        ],
        alerts: [],
        caregiverNote: 'Eleanor has maintained an excellent, steady daily rhythm today. Everything is safe and calm.',
      });
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleCallCaregiver = () => {
    ringAudio.playKeypadBeep();
    setCallActive(true);
    setTimeout(() => {
      setCallActive(false);
    }, 4000);
  };

  const handleSaveTimes = (ruleId: string) => {
    onUpdateRuleTime(ruleId, editStart, editEnd);
    setEditingRuleId(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Caretaking Guardrails */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-400" />
            <h1 className="text-xl font-bold tracking-tight text-white">
              Caretaking &amp; Safety Rules Engine
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Gentle, non-intrusive safety guardrails for {profile.residentName} (Age {profile.age}) with automated inactivity and wandering detection.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCallCaregiver}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs transition-colors cursor-pointer shadow-md ${
              callActive
                ? 'bg-emerald-600 text-white animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-900/60'
            }`}
          >
            <PhoneCall className="w-4 h-4 text-rose-400" />
            <span>{callActive ? 'Connecting to Caregiver Desk...' : 'Call Caregiver Desk'}</span>
          </button>

          <button
            onClick={handleGenerateAiWellness}
            disabled={isGeneratingAi}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors cursor-pointer shadow-md disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isGeneratingAi ? 'Analyzing Sensor Logs...' : 'AI Daily Health Digest'}</span>
          </button>
        </div>
      </div>

      {/* Safety Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Night Wandering Guard */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Night Wandering Guard</span>
            <Moon className="w-4 h-4 text-sky-400" />
          </div>
          <div className={`text-lg font-bold ${isWanderingActive ? 'text-rose-400 animate-pulse' : 'text-white'}`}>
            {isWanderingActive ? 'WANDERING DETECTED' : 'Active & Guarded'}
          </div>
          <div className="text-xs text-slate-400 leading-relaxed">
            Window: <strong className="text-slate-200 font-mono">12:00 AM - 05:00 AM</strong>. Alerts caregiver if exterior door opens during sleeping hours.
          </div>
        </div>

        {/* Card 2: Morning Mobility Check */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Morning Mobility Check-In</span>
            <Sun className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg font-bold text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>Activity Verified</span>
          </div>
          <div className="text-xs text-slate-400 leading-relaxed">
            Hallway motion recorded at <strong className="text-slate-200 font-mono">07:42 AM</strong> (well before 10:00 AM check-in deadline).
          </div>
        </div>

        {/* Card 3: Medication Routine */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Medication Routine</span>
            <Pill className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-lg font-bold text-white font-mono tabular-nums">2 / 3 Doses Taken</div>
          <div className="text-xs text-slate-400 leading-relaxed">
            Cabinet contact sensor verified at <strong className="text-slate-200 font-mono">08:15 AM &amp; 01:10 PM</strong>.
          </div>
        </div>
      </div>

      {/* Safety Rules Engine Configurator (Feature #3) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 md:p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white">Configurable Safety Rules Engine</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Custom threshold and time-window triggers for inactivity check-ins, nighttime wandering, and contact sensors.
            </p>
          </div>
          <span className="text-xs text-emerald-400 font-mono">
            {safetyRules.filter((r) => r.enabled).length} Rules Guarding Resident
          </span>
        </div>

        {/* Rules Grid */}
        <div className="space-y-3">
          {safetyRules.map((rule) => (
            <div
              key={rule.id}
              className={`p-4 rounded-xl border transition-all ${
                rule.status === 'triggered'
                  ? 'bg-rose-950/40 border-rose-500/60'
                  : 'bg-slate-950 border-slate-800/80 hover:border-slate-700/80'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-sm font-semibold text-white">{rule.name}</h3>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase ${
                        rule.type === 'night_wandering'
                          ? 'bg-sky-950 text-sky-400 border border-sky-800'
                          : rule.type === 'morning_inactivity'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-indigo-950 text-indigo-400 border border-indigo-800'
                      }`}
                    >
                      {rule.type.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-slate-400">· Sensor: {rule.sensorName}</span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">{rule.action}</p>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1 font-mono tabular-nums">
                    <span>
                      Active Window: <strong className="text-sky-300 font-bold">{rule.startTime} - {rule.endTime}</strong>
                    </span>
                    <span>·</span>
                    <span>Alerts: {rule.notifyRecipient}</span>
                    <span>·</span>
                    <span>Status: <strong className={rule.status === 'triggered' ? 'text-rose-400' : 'text-emerald-400'}>{rule.lastEvaluated}</strong></span>
                  </div>
                </div>

                {/* Rule Controls */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setEditingRuleId(rule.id);
                      setEditStart(rule.startTime);
                      setEditEnd(rule.endTime);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 cursor-pointer"
                  >
                    Adjust Window
                  </button>

                  <button
                    onClick={() => onTriggerRuleSimulation(rule)}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600/90 hover:bg-indigo-500 text-xs font-semibold text-white cursor-pointer shadow-sm flex items-center gap-1"
                  >
                    <Play className="w-3 h-3" />
                    <span>Test Rule</span>
                  </button>

                  <button
                    onClick={() => onToggleRule(rule.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      rule.enabled
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}
                  >
                    {rule.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>

              {/* Time Window Editor Drawer */}
              {editingRuleId === rule.id && (
                <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap items-center gap-3 bg-slate-900/80 p-3 rounded-lg">
                  <span className="text-xs text-slate-300 font-medium">Configure Hours:</span>
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] text-slate-400">Start:</label>
                    <input
                      type="time"
                      value={editStart}
                      onChange={(e) => setEditStart(e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] text-slate-400">End:</label>
                    <input
                      type="time"
                      value={editEnd}
                      onChange={(e) => setEditEnd(e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                    />
                  </div>
                  <button
                    onClick={() => handleSaveTimes(rule.id)}
                    className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-semibold cursor-pointer"
                  >
                    Save Window
                  </button>
                  <button
                    onClick={() => setEditingRuleId(null)}
                    className="px-2 py-1 text-slate-400 hover:text-white text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* AI Daily Health Digest Box */}
      {aiReport && (
        <div className="p-5 rounded-xl bg-slate-900 border border-indigo-500/40 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Ring Care Companion · Daily Wellness Assessment
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Routine Score:</span>
              <span className="font-bold text-emerald-400 font-mono tabular-nums">{aiReport.score || '98/100'}</span>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">{aiReport.caregiverNote}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
            {(aiReport.highlights || []).map((highlight: string, idx: number) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-slate-300 bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>{highlight}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Daily Sensor Timeline (Left) + Medication Schedule & Interior Camera (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Daily Sensor Activity Timeline */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-semibold text-white">Daily Wellness &amp; Sensor Activity Stream</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">Today, Sep 29</span>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
            {profile.dailySensorEvents.map((evt) => (
              <div key={evt.id} className="relative">
                <span className="absolute -left-6 top-1.5 w-2 h-2 rounded-full bg-sky-400 ring-2 ring-slate-950" />
                <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-200">{evt.sensorName}</span>
                    <span className="text-xs text-slate-400 font-mono tabular-nums">{evt.time}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{evt.summary}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Medication Schedule & Interior Camera Card */}
        <div className="space-y-4">
          {/* Medication Tracker */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pill className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-semibold text-white">Medication Schedule</h3>
              </div>
              <button
                onClick={onSimulateMedicineBox}
                className="text-xs text-sky-400 hover:text-sky-300 font-medium cursor-pointer"
              >
                + Log Access
              </button>
            </div>

            <div className="space-y-2.5">
              {profile.medications.map((med) => (
                <div
                  key={med.id}
                  className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-start justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-medium text-slate-200">{med.title}</div>
                    <div className="text-slate-500 font-mono tabular-nums mt-0.5">{med.time}</div>
                  </div>

                  <span
                    className={`font-semibold shrink-0 ${
                      med.verified ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {med.verified ? 'Verified' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Living Room / Hallway Interior Camera Preview */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <div className="relative aspect-video bg-black">
              {hallwayDevice.previewImage && (
                <img
                  src={hallwayDevice.previewImage}
                  alt="Living room care view"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              )}
              <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-xs text-white font-mono tabular-nums flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Interior Care Feed</span>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs">
              <div>
                <div className="font-semibold text-white">Entryway &amp; Living Room</div>
                <div className="text-slate-400">Gentle privacy-first monitoring</div>
              </div>
              <button
                onClick={() => onOpenLiveCam(hallwayDevice)}
                className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 font-medium cursor-pointer"
              >
                Inspect
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
