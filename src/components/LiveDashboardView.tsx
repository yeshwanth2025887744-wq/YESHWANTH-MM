import React, { useState, useEffect } from 'react';
import {
  Video,
  Bell,
  Footprints,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  Sparkles,
  Volume2,
  Mic,
  MicOff,
  AlertTriangle,
  Lightbulb,
  Maximize2,
  Clock,
  Radio,
  Eye,
  Camera,
  Heart,
  Layers,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Monitor,
  MapPin,
} from 'lucide-react';
import { RingDevice, AccessEventLog, AiSnapshotResult } from '../types/ring.ts';
import { ringAudio } from '../utils/audio.ts';

export type EventCategory = 'all' | 'security' | 'automation' | 'caretaking';

interface LiveDashboardViewProps {
  devices: RingDevice[];
  events: AccessEventLog[];
  alarmMode: 'disarmed' | 'home' | 'away';
  isLocked: boolean;
  onToggleLock: () => void;
  isSpotlightOn: boolean;
  onToggleSpotlight: () => void;
  isSirenOn: boolean;
  onToggleSiren: () => void;
  isRinging: boolean;
  isMotionActive: boolean;
  isWanderingAlert: boolean;
  onOpenLiveModal: (device: RingDevice) => void;
  latestAiSnapshot: AiSnapshotResult | null;
  onAnalyzeSnapshot: (device: RingDevice) => void;
  isAnalyzingSnapshot: boolean;
  isInsideGeofence?: boolean;
  geofenceDistance?: number;
}

export const LiveDashboardView: React.FC<LiveDashboardViewProps> = ({
  devices,
  events,
  alarmMode,
  isLocked,
  onToggleLock,
  isSpotlightOn,
  onToggleSpotlight,
  isSirenOn,
  onToggleSiren,
  isRinging,
  isMotionActive,
  isWanderingAlert,
  onOpenLiveModal,
  latestAiSnapshot,
  onAnalyzeSnapshot,
  isAnalyzingSnapshot,
  isInsideGeofence,
  geofenceDistance = 260,
}) => {
  const [selectedCameraId, setSelectedCameraId] = useState<string>('dev_doorbell_front');
  const [categoryFilter, setCategoryFilter] = useState<EventCategory>('all');
  const [isMicOn, setIsMicOn] = useState(false);
  const [viewLayout, setViewLayout] = useState<'single' | 'grid' | 'carousel'>('single');
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isAutoPatrol, setIsAutoPatrol] = useState(false);

  // Filter camera feeds
  const cameraDevices = devices.filter(
    (d) => d.kind === 'doorbell' || d.kind === 'floodlight_cam' || d.id === 'dev_motion_hallway' || !!d.previewImage
  );

  const activeDevice =
    viewLayout === 'carousel'
      ? cameraDevices[carouselIndex] || devices[0]
      : devices.find((d) => d.id === selectedCameraId) || devices[0];

  // Auto-Patrol interval for carousel mode
  useEffect(() => {
    if (!isAutoPatrol || viewLayout !== 'carousel' || cameraDevices.length <= 1) return;
    const timer = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % cameraDevices.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isAutoPatrol, viewLayout, cameraDevices.length]);

  const getEventCategory = (evt: AccessEventLog): 'security' | 'automation' | 'caretaking' => {
    if (
      evt.eventType === 'wandering_alert' ||
      evt.eventType === 'medication_cabinet_opened' ||
      evt.actor.toLowerCase().includes('eleanor') ||
      evt.actor.toLowerCase().includes('nurse') ||
      evt.deviceName.toLowerCase().includes('medicine')
    ) {
      return 'caretaking';
    }
    if (
      evt.eventType === 'pin_unlock' ||
      evt.eventType === 'remote_unlock' ||
      evt.eventType === 'door_closed' ||
      evt.eventType === 'door_opened' ||
      evt.actor.toLowerCase().includes('courier') ||
      evt.actor.toLowerCase().includes('auto-relock') ||
      evt.actor.toLowerCase().includes('amazon')
    ) {
      return 'automation';
    }
    return 'security';
  };

  const filteredEvents = events.filter((e) => {
    if (categoryFilter === 'all') return true;
    return getEventCategory(e) === categoryFilter;
  });

  const getCategoryCount = (cat: EventCategory) => {
    if (cat === 'all') return events.length;
    return events.filter((e) => getEventCategory(e) === cat).length;
  };

  return (
    <div className="space-y-6">
      {/* Real-Time Status Banners Matrix (Armed/Disarmed, Motion, Ringing, Alarm) */}
      <div className="space-y-2">
        {/* Banner 1: Doorbell Ringing Banner (Blue Ring Glow) */}
        {isRinging && (
          <div className="bg-sky-600 border border-sky-400 text-white p-3.5 rounded-xl shadow-lg shadow-sky-600/30 flex items-center justify-between gap-3 animate-pulse">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-lg bg-sky-950/80 text-sky-200">
                <Bell className="w-5 h-5 animate-bounce" />
              </span>
              <div>
                <div className="font-bold text-sm tracking-wide flex items-center gap-2">
                  <span>DOORBELL RINGING (DING RECEIVED)</span>
                  <span className="text-[10px] bg-white text-sky-900 px-1.5 py-0.5 rounded font-mono font-bold">
                    BLUE ALERT
                  </span>
                </div>
                <div className="text-xs text-sky-100 mt-0.5">
                  Front Doorbell Pro 2 push button pressed · Live stream open · Strobe activated
                </div>
              </div>
            </div>

            <button
              onClick={() => onOpenLiveModal(activeDevice)}
              className="px-3.5 py-1.5 rounded-lg bg-white text-sky-900 hover:bg-sky-50 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shadow"
            >
              Answer Door
            </button>
          </div>
        )}

        {/* Banner 2: Motion Detected Banner (Amber Glow) */}
        {isMotionActive && !isRinging && (
          <div className="bg-amber-600 border border-amber-400 text-white p-3.5 rounded-xl shadow-lg shadow-amber-600/20 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-lg bg-amber-950/80 text-amber-200">
                <Footprints className="w-5 h-5 animate-pulse" />
              </span>
              <div>
                <div className="font-bold text-sm tracking-wide flex items-center gap-2">
                  <span>MOTION DETECTED IN ZONE 1 (WALKWAY)</span>
                  <span className="text-[10px] bg-white text-amber-900 px-1.5 py-0.5 rounded font-mono font-bold">
                    AMBER ALERT
                  </span>
                </div>
                <div className="text-xs text-amber-100 mt-0.5">
                  PIR radar motion stream verified · Spotlights illuminated · Recording 30s clip
                </div>
              </div>
            </div>

            <button
              onClick={() => onAnalyzeSnapshot(activeDevice)}
              className="px-3.5 py-1.5 rounded-lg bg-white text-amber-900 hover:bg-amber-50 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shadow"
            >
              Analyze Motion Frame
            </button>
          </div>
        )}

        {/* Banner 3: Night Wandering / Alarm Active (Red Alert) */}
        {(isWanderingAlert || isSirenOn) && (
          <div className="bg-rose-600 border border-rose-400 text-white p-3.5 rounded-xl shadow-lg shadow-rose-600/30 flex items-center justify-between gap-3 animate-pulse">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-lg bg-rose-950/80 text-rose-200">
                <AlertTriangle className="w-5 h-5 animate-bounce" />
              </span>
              <div>
                <div className="font-bold text-sm tracking-wide flex items-center gap-2">
                  <span>{isWanderingAlert ? 'NIGHT WANDERING SAFETY ALERT' : 'RING ALARM SIREN ENGAGED (110dB)'}</span>
                  <span className="text-[10px] bg-white text-rose-900 px-1.5 py-0.5 rounded font-mono font-bold">
                    RED ALERT
                  </span>
                </div>
                <div className="text-xs text-rose-100 mt-0.5">
                  Exterior door opened during protected window · Caregiver SMS dispatched
                </div>
              </div>
            </div>

            <button
              onClick={onToggleSiren}
              className="px-3.5 py-1.5 rounded-lg bg-white text-rose-900 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shadow"
            >
              Silence Alarm
            </button>
          </div>
        )}

        {/* Banner 4: Base Mode Banner (Armed / Disarmed) */}
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            {alarmMode === 'away' && <ShieldAlert className="w-4 h-4 text-rose-400" />}
            {alarmMode === 'home' && <ShieldCheck className="w-4 h-4 text-emerald-400" />}
            {alarmMode === 'disarmed' && <Shield className="w-4 h-4 text-slate-400" />}
            <span className="font-semibold text-white">
              System Status: {alarmMode === 'away' ? 'Armed (Away Mode)' : alarmMode === 'home' ? 'Armed (Home Mode)' : 'Disarmed'}
            </span>
            <span className="text-slate-400 hidden sm:inline">
              · {devices.filter((d) => d.online).length} Ring Devices Guarding Perimeter
            </span>
          </div>

          <div className="flex items-center gap-3 text-slate-400 font-mono tabular-nums">
            <span className={`flex items-center gap-1 ${isInsideGeofence ? 'text-emerald-400' : 'text-amber-400'}`}>
              <MapPin className="w-3.5 h-3.5" />
              <span>
                Geofence: {isInsideGeofence ? `Inside Home (${geofenceDistance}m)` : `Outside (${geofenceDistance}m)`}
              </span>
            </span>
            <span>·</span>
            <span>Deadbolt: <strong className={isLocked ? 'text-emerald-400' : 'text-amber-400'}>{isLocked ? 'LOCKED' : 'UNLOCKED'}</strong></span>
            <span>·</span>
            <span>Cloud Sync: Nominal</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Live Camera Stream Viewport (Left 2 cols) + AI Snapshot Analyzer & Event Feed (Right 1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Live Feed & Multi-Cam Selector */}
        <div className="lg:col-span-2 space-y-4">
          {/* Multi-Camera Stream Container */}
          <div className="space-y-3">
            {/* View Mode Switcher Header */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Camera Monitoring Viewport
                </span>
                <span className="text-[10px] bg-slate-800 text-sky-300 px-2 py-0.5 rounded font-mono border border-slate-700">
                  {cameraDevices.length} Live Feeds Online
                </span>
              </div>

              {/* View Layout Switcher Tabs */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                <button
                  onClick={() => setViewLayout('single')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded font-medium transition-all cursor-pointer ${
                    viewLayout === 'single'
                      ? 'bg-sky-600 text-white shadow-sm font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Single high-detail camera view"
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Single</span>
                </button>

                <button
                  onClick={() => setViewLayout('grid')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded font-medium transition-all cursor-pointer ${
                    viewLayout === 'grid'
                      ? 'bg-sky-600 text-white shadow-sm font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Multi-camera simultaneous grid view"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Grid ({cameraDevices.length})</span>
                </button>

                <button
                  onClick={() => setViewLayout('carousel')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded font-medium transition-all cursor-pointer ${
                    viewLayout === 'carousel'
                      ? 'bg-sky-600 text-white shadow-sm font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Patrol Carousel cycling between active feeds"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Carousel</span>
                </button>
              </div>
            </div>

            {/* Layout Mode 1: Single Camera View */}
            {viewLayout === 'single' && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                {/* Camera Header */}
                <div className="p-3.5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-sm font-bold text-white">{activeDevice.name}</span>
                    <span className="text-xs text-slate-400">({activeDevice.location})</span>
                  </div>

                  {/* Camera Switcher Tabs */}
                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
                    {cameraDevices.map((cam) => (
                      <button
                        key={cam.id}
                        onClick={() => setSelectedCameraId(cam.id)}
                        className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                          selectedCameraId === cam.id
                            ? 'bg-sky-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {cam.kind === 'doorbell'
                          ? 'Front Door'
                          : cam.kind === 'floodlight_cam'
                          ? 'Dock Gate'
                          : 'Hallway'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Video Canvas Container */}
                <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden group">
                  {activeDevice.previewImage ? (
                    <img
                      src={activeDevice.previewImage}
                      alt={activeDevice.name}
                      referrerPolicy="no-referrer"
                      className={`w-full h-full object-cover transition-transform duration-500 ${
                        isMotionActive ? 'scale-105' : 'scale-100'
                      }`}
                    />
                  ) : (
                    <div className="text-slate-500 text-xs font-mono">Stream Connecting...</div>
                  )}

                  {/* HUD Timestamp & Live Pill */}
                  <div className="absolute top-3.5 left-3.5 flex items-center gap-2 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded text-xs text-white font-mono tabular-nums border border-white/10">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    <span className="font-bold">LIVE HD</span>
                    <span className="text-slate-400">·</span>
                    <span>{new Date().toLocaleTimeString()}</span>
                  </div>

                  {/* Live Signal & Battery HUD */}
                  <div className="absolute top-3.5 right-3.5 flex items-center gap-2 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded text-xs text-slate-300 font-mono tabular-nums border border-white/10">
                    <span>{activeDevice.wifiSignalRssi} dBm</span>
                    {activeDevice.batteryLevel && (
                      <>
                        <span>·</span>
                        <span>Bat: {activeDevice.batteryLevel}%</span>
                      </>
                    )}
                  </div>

                  {/* Bottom In-Video Controls Floating Bar */}
                  <div className="absolute bottom-3.5 inset-x-3.5 flex items-center justify-between gap-2 bg-slate-950/85 backdrop-blur-md p-2.5 rounded-xl border border-slate-700/60 shadow-lg">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          ringAudio.playKeypadBeep();
                          setIsMicOn(!isMicOn);
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          isMicOn
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                        }`}
                      >
                        {isMicOn ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                        <span>{isMicOn ? 'Live Audio ON' : 'Two-Way Talk'}</span>
                      </button>

                      <button
                        onClick={() => {
                          ringAudio.playLockSound(!isLocked);
                          onToggleLock();
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          isLocked
                            ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border-slate-700'
                            : 'bg-emerald-600 text-white border-emerald-500'
                        }`}
                      >
                        {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        <span>{isLocked ? 'Unlock Deadbolt' : 'Door Unlocked'}</span>
                      </button>

                      {activeDevice.kind === 'floodlight_cam' && (
                        <button
                          onClick={onToggleSpotlight}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                            isSpotlightOn
                              ? 'bg-amber-500 text-slate-950 border-amber-400'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                          }`}
                        >
                          <Lightbulb className="w-3.5 h-3.5" />
                          <span>Spotlight {isSpotlightOn ? 'ON' : 'OFF'}</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onAnalyzeSnapshot(activeDevice)}
                        disabled={isAnalyzingSnapshot}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                        <span>{isAnalyzingSnapshot ? 'Analyzing...' : 'AI Snapshot Caption'}</span>
                      </button>

                      <button
                        onClick={() => onOpenLiveModal(activeDevice)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                        title="Fullscreen Inspect"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Layout Mode 2: Multi-Camera Simultaneous Grid View */}
            {viewLayout === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cameraDevices.map((cam) => {
                  const isCamDoorbell = cam.kind === 'doorbell';
                  const isCamFloodlight = cam.kind === 'floodlight_cam';
                  return (
                    <div
                      key={cam.id}
                      className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col justify-between group hover:border-sky-500/50 transition-all"
                    >
                      {/* Grid Tile Header */}
                      <div className="p-3 border-b border-slate-800 bg-slate-950 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                          <span className="font-bold text-white truncate">{cam.name}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono shrink-0">
                          {cam.location}
                        </span>
                      </div>

                      {/* Video Stream Container */}
                      <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                        {cam.previewImage ? (
                          <img
                            src={cam.previewImage}
                            alt={cam.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                          />
                        ) : (
                          <div className="text-slate-500 text-xs font-mono">Stream Ready</div>
                        )}

                        {/* Stream Pill */}
                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded text-[11px] text-white font-mono border border-white/10">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                          <span>LIVE</span>
                        </div>

                        {/* Top Right Signals */}
                        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-slate-300 font-mono border border-white/10">
                          <span>{cam.wifiSignalRssi} dBm</span>
                        </div>

                        {/* Hover Overlay Button to Maximize */}
                        <button
                          onClick={() => onOpenLiveModal(cam)}
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-xs font-bold text-white cursor-pointer"
                        >
                          <Maximize2 className="w-5 h-5 text-sky-400" />
                          <span>Click to Inspect Fullscreen</span>
                        </button>
                      </div>

                      {/* Grid Tile Bottom Quick Action Controls */}
                      <div className="p-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1.5">
                          {isCamDoorbell && (
                            <button
                              onClick={() => {
                                ringAudio.playLockSound(!isLocked);
                                onToggleLock();
                              }}
                              className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition-all cursor-pointer flex items-center gap-1 ${
                                isLocked
                                  ? 'bg-slate-800 text-emerald-400 border-slate-700'
                                  : 'bg-emerald-600 text-white border-emerald-500'
                              }`}
                            >
                              {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                              <span>{isLocked ? 'Unlock' : 'Locked'}</span>
                            </button>
                          )}

                          {isCamFloodlight && (
                            <button
                              onClick={onToggleSpotlight}
                              className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition-all cursor-pointer flex items-center gap-1 ${
                                isSpotlightOn
                                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                                  : 'bg-slate-800 text-slate-200 border-slate-700'
                              }`}
                            >
                              <Lightbulb className="w-3 h-3" />
                              <span>{isSpotlightOn ? 'Light ON' : 'Light'}</span>
                            </button>
                          )}

                          <button
                            onClick={() => onAnalyzeSnapshot(cam)}
                            disabled={isAnalyzingSnapshot}
                            className="px-2.5 py-1 rounded bg-indigo-600/80 hover:bg-indigo-600 text-white text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Sparkles className="w-3 h-3 text-indigo-200" />
                            <span>AI Caption</span>
                          </button>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedCameraId(cam.id);
                            setViewLayout('single');
                          }}
                          className="text-[11px] text-sky-400 hover:text-sky-300 font-medium cursor-pointer"
                        >
                          Focus Feed &rarr;
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Layout Mode 3: Patrol Carousel View */}
            {viewLayout === 'carousel' && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl space-y-0">
                {/* Carousel Header */}
                <div className="p-3.5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-sm font-bold text-white">{activeDevice.name}</span>
                    <span className="text-xs text-slate-400 font-mono">
                      (Feed {carouselIndex + 1} of {cameraDevices.length})
                    </span>
                  </div>

                  {/* Auto-Patrol Mode Switcher Button */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsAutoPatrol(!isAutoPatrol)}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        isAutoPatrol
                          ? 'bg-rose-600 text-white border-rose-400 animate-pulse shadow-md shadow-rose-600/30'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                      }`}
                      title="Automatically cycle camera feeds every 5 seconds"
                    >
                      {isAutoPatrol ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-sky-400" />}
                      <span>{isAutoPatrol ? 'Patrol Active (5s)' : 'Start Auto-Patrol'}</span>
                    </button>
                  </div>
                </div>

                {/* Hero Carousel Video Container with Left/Right Arrows */}
                <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden group">
                  {activeDevice.previewImage ? (
                    <img
                      src={activeDevice.previewImage}
                      alt={activeDevice.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-all duration-300"
                    />
                  ) : (
                    <div className="text-slate-500 text-xs font-mono">Stream Connecting...</div>
                  )}

                  {/* Left Carousel Arrow */}
                  <button
                    onClick={() =>
                      setCarouselIndex(
                        (prev) => (prev - 1 + cameraDevices.length) % cameraDevices.length
                      )
                    }
                    className="absolute left-3 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-all cursor-pointer backdrop-blur-md shadow-lg"
                    title="Previous Camera"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  {/* Right Carousel Arrow */}
                  <button
                    onClick={() => setCarouselIndex((prev) => (prev + 1) % cameraDevices.length)}
                    className="absolute right-3 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-all cursor-pointer backdrop-blur-md shadow-lg"
                    title="Next Camera"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  {/* Live HUD Pill */}
                  <div className="absolute top-3.5 left-3.5 flex items-center gap-2 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded text-xs text-white font-mono tabular-nums border border-white/10">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    <span className="font-bold">LIVE HD</span>
                    <span className="text-slate-400">·</span>
                    <span>{activeDevice.location}</span>
                  </div>

                  {/* Bottom Controls */}
                  <div className="absolute bottom-3.5 inset-x-3.5 flex items-center justify-between gap-2 bg-slate-950/85 backdrop-blur-md p-2.5 rounded-xl border border-slate-700/60 shadow-lg">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onOpenLiveModal(activeDevice)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>Inspect Feed</span>
                      </button>

                      <button
                        onClick={() => onAnalyzeSnapshot(activeDevice)}
                        disabled={isAnalyzingSnapshot}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>AI Caption</span>
                      </button>
                    </div>

                    <div className="text-xs text-slate-300 font-mono">
                      Signal: {activeDevice.wifiSignalRssi} dBm
                    </div>
                  </div>
                </div>

                {/* Carousel Thumbnail Strip */}
                <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-3 overflow-x-auto">
                  {cameraDevices.map((cam, idx) => (
                    <button
                      key={cam.id}
                      onClick={() => setCarouselIndex(idx)}
                      className={`flex items-center gap-2 p-1.5 rounded-lg border transition-all cursor-pointer shrink-0 ${
                        carouselIndex === idx
                          ? 'bg-slate-900 border-sky-400 ring-2 ring-sky-500/30'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <div className="w-12 h-8 rounded bg-black overflow-hidden shrink-0">
                        {cam.previewImage && (
                          <img
                            src={cam.previewImage}
                            alt={cam.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="text-left text-xs pr-1">
                        <div className="font-semibold text-white truncate max-w-[120px]">{cam.name}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[120px]">{cam.location}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Audio Talkback Preset Drawer */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <span className="text-slate-400 font-medium">Quick Voice Replies to Doorbell Speaker:</span>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Please leave package by the door. Thanks!',
                'I am on my way, please wait a moment.',
                'No solicitations today, thank you.',
              ].map((msg, i) => (
                <button
                  key={i}
                  onClick={() => ringAudio.speakMessage(msg)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Volume2 className="w-3 h-3 text-sky-400" />
                  <span>{msg}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: AI Snapshot Analyzer & Real-Time Event Log */}
        <div className="space-y-4">
          {/* AI Snapshot 1-Sentence Caption Card (Feature #6) */}
          <div className="bg-slate-900 border border-indigo-500/40 rounded-xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">AI Snapshot Analyzer</h3>
              </div>
              <span className="text-[10px] font-mono text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800">
                Gemini Vision
              </span>
            </div>

            {latestAiSnapshot ? (
              <div className="space-y-2.5">
                {/* 1-Sentence Caption */}
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider mb-1">
                    Event Caption (1-Sentence):
                  </div>
                  <p className="text-xs text-white font-medium leading-relaxed">
                    "{latestAiSnapshot.caption}"
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 font-mono tabular-nums">
                  <span>Confidence: {Math.round(latestAiSnapshot.confidence * 100)}%</span>
                  <span>·</span>
                  <span>Threat: <strong className="text-emerald-400">{latestAiSnapshot.threatLevel}</strong></span>
                </div>

                {latestAiSnapshot.detectedObjects && (
                  <div className="flex flex-wrap gap-1">
                    {latestAiSnapshot.detectedObjects.map((obj, i) => (
                      <span key={i} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                        {obj}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800 text-center space-y-2">
                <Camera className="w-6 h-6 text-slate-500 mx-auto" />
                <p className="text-xs text-slate-400">
                  Click below or trigger an event to generate a 1-sentence AI vision event caption from the live camera frame.
                </p>
                <button
                  onClick={() => onAnalyzeSnapshot(activeDevice)}
                  disabled={isAnalyzingSnapshot}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  {isAnalyzingSnapshot ? 'Analyzing Snapshot...' : 'Analyze Snapshot Now'}
                </button>
              </div>
            )}
          </div>

          {/* Real-Time Ring Event Stream with Category Filters */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <h3 className="text-sm font-semibold text-white">Ring Event Stream</h3>
                <div className="text-xs text-slate-400">Live Sensor &amp; Cloud Dispatch</div>
              </div>

              {/* Category Filter Buttons */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs flex-wrap">
                {[
                  { id: 'all', label: 'All', icon: Layers },
                  { id: 'security', label: 'Security', icon: Shield },
                  { id: 'automation', label: 'Automation', icon: Lock },
                  { id: 'caretaking', label: 'Caretaking', icon: Heart },
                ].map((item) => {
                  const Icon = item.icon;
                  const count = getCategoryCount(item.id as EventCategory);
                  const isSelected = categoryFilter === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setCategoryFilter(item.id as EventCategory)}
                      className={`px-2.5 py-1 rounded capitalize font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? item.id === 'security'
                            ? 'bg-sky-600 text-white shadow-sm font-semibold'
                            : item.id === 'automation'
                            ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                            : item.id === 'caretaking'
                            ? 'bg-rose-600 text-white shadow-sm font-semibold'
                            : 'bg-slate-800 text-white shadow-sm font-semibold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{item.label}</span>
                      <span className="text-[10px] font-mono opacity-80">({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Events List */}
            <div className="divide-y divide-slate-800/80 max-h-72 overflow-y-auto pr-1">
              {filteredEvents.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 font-mono space-y-1">
                  <div>No events recorded under category "{categoryFilter.toUpperCase()}" yet.</div>
                  <div className="text-[11px] text-slate-600 font-sans">
                    Trigger simulated events using the Dev Toolbar or Voice Commands to populate this feed.
                  </div>
                </div>
              ) : (
                filteredEvents.map((evt) => {
                  const category = getEventCategory(evt);
                  return (
                    <div key={evt.id} className="py-2.5 flex items-start justify-between gap-2 text-xs">
                      <div className="flex items-start gap-2">
                        <span
                          className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                            evt.eventType === 'doorbell_ring'
                              ? 'bg-sky-400 ring-2 ring-sky-950'
                              : evt.eventType === 'motion_zone'
                              ? 'bg-amber-400 ring-2 ring-amber-950'
                              : 'bg-emerald-400 ring-2 ring-emerald-950'
                          }`}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-200">{evt.actor}</span>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-mono uppercase font-bold shrink-0 ${
                                category === 'security'
                                  ? 'bg-sky-950 text-sky-400 border border-sky-800'
                                  : category === 'automation'
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                  : 'bg-rose-950 text-rose-400 border border-rose-800'
                              }`}
                            >
                              {category}
                            </span>
                          </div>
                          <div className="text-slate-400 text-[11px] leading-tight mt-0.5">
                            {evt.deviceName} · {evt.eventType.replace('_', ' ')}
                          </div>
                          {evt.aiSummary && (
                            <div className="text-slate-500 text-[11px] mt-0.5">{evt.aiSummary}</div>
                          )}
                        </div>
                      </div>

                      <span className="text-slate-500 text-[11px] font-mono tabular-nums whitespace-nowrap shrink-0">
                        {evt.timestamp}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
