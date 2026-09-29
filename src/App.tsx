import React, { useState } from 'react';
import { MapPin } from 'lucide-react';
import { Header, NavTab } from './components/Header.tsx';
import { DevToolbar } from './components/DevToolbar.tsx';
import { SimulatorPanel, RingSimulatedEventPayload } from './components/SimulatorPanel.tsx';
import { VoiceCommandOverlay } from './components/VoiceCommandOverlay.tsx';
import { LiveDashboardView } from './components/LiveDashboardView.tsx';
import { AccessControlView } from './components/AccessControlView.tsx';
import { CaretakingView } from './components/CaretakingView.tsx';
import { AccessibilityView } from './components/AccessibilityView.tsx';
import { AutomationView } from './components/AutomationView.tsx';
import { AnalyticsView } from './components/AnalyticsView.tsx';
import { ApiConsoleView } from './components/ApiConsoleView.tsx';
import { LiveCameraModal } from './components/LiveCameraModal.tsx';
import { ThemeManagerProvider } from './context/ThemeManagerContext.tsx';
import { ThemeManagerModal } from './components/ThemeManagerModal.tsx';
import {
  INITIAL_DEVICES,
  INITIAL_PASSES,
  INITIAL_EVENTS,
  INITIAL_ROUTINES,
  INITIAL_CARE_PROFILE,
  INITIAL_ACCESSIBILITY,
  INITIAL_BOOKING_WINDOWS,
  INITIAL_SAFETY_RULES,
} from './data/mockData.ts';
import {
  RingDevice,
  AccessPass,
  AccessEventLog,
  AutomationRoutine,
  AccessibilitySettings,
  BookingWindow,
  SafetyRule,
  AiSnapshotResult,
} from './types/ring.ts';
import { ringAudio } from './utils/audio.ts';

function MainApp() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [devices, setDevices] = useState<RingDevice[]>(INITIAL_DEVICES);
  const [passes, setPasses] = useState<AccessPass[]>(INITIAL_PASSES);
  const [events, setEvents] = useState<AccessEventLog[]>(INITIAL_EVENTS);
  const [routines, setRoutines] = useState<AutomationRoutine[]>(INITIAL_ROUTINES);
  const [careProfile, setCareProfile] = useState(INITIAL_CARE_PROFILE);
  const [accessibilitySettings, setAccessibilitySettings] = useState<AccessibilitySettings>(INITIAL_ACCESSIBILITY);
  const [bookingWindows, setBookingWindows] = useState<BookingWindow[]>(INITIAL_BOOKING_WINDOWS);
  const [safetyRules, setSafetyRules] = useState<SafetyRule[]>(INITIAL_SAFETY_RULES);

  // Global Hardware States
  const [alarmMode, setAlarmMode] = useState<'disarmed' | 'home' | 'away'>('home');
  const [isLocked, setIsLocked] = useState(true);
  const [isSpotlightOn, setIsSpotlightOn] = useState(false);
  const [isSirenOn, setIsSirenOn] = useState(false);
  const [isDoorOpen, setIsDoorOpen] = useState(false);
  const [isRinging, setIsRinging] = useState(false);
  const [isMotionActive, setIsMotionActive] = useState(false);
  const [isWanderingAlert, setIsWanderingAlert] = useState(false);
  const [isStrobing, setIsStrobing] = useState(false);
  const [strobeBorderColor, setStrobeBorderColor] = useState<'cyan' | 'amber' | 'rose'>('cyan');

  // Geofencing Mock State
  const [isInsideGeofence, setIsInsideGeofence] = useState(false);
  const [geofenceDistance, setGeofenceDistance] = useState(260); // In meters (outside 150m boundary)
  const [geofenceAutoDisarm, setGeofenceAutoDisarm] = useState(true);
  const [geofenceToast, setGeofenceToast] = useState<string | null>(null);

  const handleEnterHomePerimeter = (meters: number = 35) => {
    setIsInsideGeofence(true);
    setGeofenceDistance(meters);

    if (geofenceAutoDisarm) {
      // Automatically change alarm mode to 'disarmed'
      setAlarmMode('disarmed');
      ringAudio.playLockSound(false);
      ringAudio.speakMessage('Welcome home. Ring Alarm disarmed by Geofence.');

      const geoEvent: AccessEventLog = {
        id: `evt_geo_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        deviceId: 'dev_alarm_base',
        eventType: 'remote_unlock',
        deviceName: 'Ring Alarm Base Station Pro',
        actor: 'Owner Phone (GPS Geofence)',
        status: 'granted',
        snapshotUrl: '/src/assets/images/ring_hardware_showcase_1790696875828.jpg',
        aiSummary: `Geofence Ingress: Simulated device breached home boundary (${meters}m <= 150m perimeter). Alarm Mode automatically changed to DISARMED.`,
      };
      setEvents((prev) => [geoEvent, ...prev]);

      setGeofenceToast(
        `📍 Geofence Ingress: User device entered home perimeter (${meters}m). Alarm automatically DISARMED.`
      );
      setTimeout(() => setGeofenceToast(null), 5000);
    } else {
      setGeofenceToast(`📍 Geofence Ingress: User device entered perimeter (${meters}m). Auto-disarm disabled.`);
      setTimeout(() => setGeofenceToast(null), 4000);
    }
  };

  const handleExitHomePerimeter = (meters: number = 260) => {
    setIsInsideGeofence(false);
    setGeofenceDistance(meters);
    setGeofenceToast(`🚗 Geofence Egress: User device exited home perimeter (${meters}m). Safe travels!`);
    setTimeout(() => setGeofenceToast(null), 4000);
  };

  const handleSetGeofenceDistance = (meters: number) => {
    setGeofenceDistance(meters);
    const entered = meters <= 150;
    if (entered && !isInsideGeofence) {
      handleEnterHomePerimeter(meters);
    } else if (!entered && isInsideGeofence) {
      handleExitHomePerimeter(meters);
    }
  };

  const handleToggleGeofence = () => {
    if (isInsideGeofence) {
      handleExitHomePerimeter(260);
    } else {
      handleEnterHomePerimeter(35);
    }
  };

  // AI Snapshot State
  const [latestAiSnapshot, setLatestAiSnapshot] = useState<AiSnapshotResult | null>({
    caption: 'Amazon Prime courier placed a brown delivery box on the front doorstep near the planter.',
    detectedObjects: ['Delivery Box', 'Doorstep', 'Courier (Safety Vest)'],
    threatLevel: 'None',
    confidence: 0.98,
    analyzedAt: 'Just now',
  });
  const [isAnalyzingSnapshot, setIsAnalyzingSnapshot] = useState(false);

  // Active Camera & Dev Toolbar
  const [activeCameraDevice, setActiveCameraDevice] = useState<RingDevice | null>(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(true);
  const [lastVisitorSpeech, setLastVisitorSpeech] = useState('Hello, I have a package delivery from Amazon for Eleanor.');

  // Visual Strobe Trigger
  const triggerVisualStrobe = (color: 'cyan' | 'amber' | 'rose' = 'cyan') => {
    setStrobeBorderColor(color);
    setIsStrobing(true);
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
    setTimeout(() => setIsStrobing(false), 3000);
  };

  // Hardware Simulation Handlers:
  // 1. Simulate Doorbell Ring ('ding')
  const handleSimulateDing = (speech?: string) => {
    if (speech) {
      setLastVisitorSpeech(speech);
    }
    setIsRinging(true);
    if (accessibilitySettings.visualStrobeEnabled) {
      triggerVisualStrobe('cyan');
    }

    setDevices((prev) =>
      prev.map((d) => (d.kind === 'doorbell' ? { ...d, state: { ...d.state, isRinging: true } } : d))
    );

    const newEvent: AccessEventLog = {
      id: `evt_${Date.now()}`,
      timestamp: 'Just now',
      deviceId: 'dev_doorbell_front',
      deviceName: 'Ring Video Doorbell Pro 2',
      eventType: 'doorbell_ring',
      actor: 'Visitor at Front Entryway',
      status: 'granted',
      snapshotUrl: '/src/assets/images/ring_doorbell_cam_feed_1790696834179.jpg',
      aiSummary: 'Doorbell push button pressed. Visitor speech stream connected.',
      details: speech || 'Doorbell ding received.',
    };
    setEvents((prev) => [newEvent, ...prev]);

    // Auto-analyze snapshot for incoming ding
    handleAnalyzeSnapshot(devices[0]);

    setTimeout(() => {
      setIsRinging(false);
      setDevices((prev) =>
        prev.map((d) => (d.kind === 'doorbell' ? { ...d, state: { ...d.state, isRinging: false } } : d))
      );
    }, 4500);
  };

  // 2. Simulate Motion Stream ('motion')
  const handleSimulateMotion = () => {
    setIsMotionActive(true);
    setIsSpotlightOn(true);
    triggerVisualStrobe('amber');

    const newEvent: AccessEventLog = {
      id: `evt_${Date.now()}`,
      timestamp: 'Just now',
      deviceId: 'dev_floodlight_dock',
      deviceName: 'Ring Floodlight Cam Wired Pro',
      eventType: 'motion_zone',
      actor: 'Walkway PIR Motion Sensor',
      status: 'normal',
      snapshotUrl: '/src/assets/images/ring_warehouse_dock_cam_1790696848723.jpg',
      aiSummary: 'Motion stream active in zone 1. Floodlight spotlights illuminated.',
    };
    setEvents((prev) => [newEvent, ...prev]);

    setTimeout(() => {
      setIsMotionActive(false);
    }, 4000);
  };

  // 3. Toggle Ring Alarm Mode (Home / Away / Disarmed)
  const handleCycleAlarmMode = () => {
    if (alarmMode === 'disarmed') setAlarmMode('home');
    else if (alarmMode === 'home') setAlarmMode('away');
    else setAlarmMode('disarmed');
  };

  // 4. Simulate Smart Lock State (Locked / Unlocked)
  const handleToggleLock = () => {
    const nextLocked = !isLocked;
    setIsLocked(nextLocked);
    ringAudio.playLockSound(nextLocked);

    const newEvent: AccessEventLog = {
      id: `evt_${Date.now()}`,
      timestamp: 'Just now',
      deviceId: 'dev_smart_lock_front',
      deviceName: 'Ring Smart Deadbolt Plus',
      eventType: nextLocked ? 'door_closed' : 'remote_unlock',
      actor: nextLocked ? 'Auto-Relock / Manual Lock' : 'Remote App Unlock',
      status: 'granted',
      snapshotUrl: '/src/assets/images/ring_doorbell_cam_feed_1790696834179.jpg',
      aiSummary: nextLocked ? 'Door deadbolt bolted securely.' : 'Smart deadbolt unlatched.',
    };
    setEvents((prev) => [newEvent, ...prev]);
  };

  // 5. Trigger Night Wandering Alert (12 AM - 5 AM Rule)
  const handleTriggerNightWandering = () => {
    setIsWanderingAlert(true);
    triggerVisualStrobe('rose');

    const newEvent: AccessEventLog = {
      id: `evt_${Date.now()}`,
      timestamp: '02:14 AM (Simulated Night Window)',
      deviceId: 'dev_contact_frontdoor',
      deviceName: 'Front Door Jamb Contact Sensor',
      eventType: 'wandering_alert',
      actor: `${careProfile.residentName} (Night Wandering)`,
      status: 'flagged',
      snapshotUrl: '/src/assets/images/ring_doorbell_cam_feed_1790696834179.jpg',
      aiSummary: 'Front door opened between 12 AM - 5 AM. Urgent caregiver SMS dispatched.',
    };
    setEvents((prev) => [newEvent, ...prev]);

    // Update safety rule status
    setSafetyRules((prev) =>
      prev.map((r) =>
        r.type === 'night_wandering'
          ? { ...r, status: 'triggered', lastEvaluated: 'ALERT TRIGGERED: 02:14 AM' }
          : r
      )
    );

    setTimeout(() => {
      setIsWanderingAlert(false);
    }, 6000);
  };

  // 6. Trigger Morning Inactivity Check-in (7 AM - 10 AM Rule)
  const handleTriggerInactivityCheck = () => {
    const newEvent: AccessEventLog = {
      id: `evt_${Date.now()}`,
      timestamp: '08:30 AM (Simulated Morning Window)',
      deviceId: 'dev_motion_hallway',
      deviceName: 'Senior Hallway & Entry Motion Sensor',
      eventType: 'motion_zone',
      actor: 'Resident Movement Verified',
      status: 'normal',
      snapshotUrl: '/src/assets/images/ring_interior_care_livingroom_1790696861770.jpg',
      aiSummary: 'Morning mobility detected. Inactivity rule satisfied. Caregiver updated.',
    };
    setEvents((prev) => [newEvent, ...prev]);

    setSafetyRules((prev) =>
      prev.map((r) =>
        r.type === 'morning_inactivity'
          ? { ...r, status: 'nominal', lastEvaluated: 'Verified Normal: 08:30 AM' }
          : r
      )
    );
  };

  // 7. Simulate Courier Delivery Window & Auto-Relock
  const handleSimulateDelivery = () => {
    setIsLocked(false);
    ringAudio.playLockSound(false);

    const newEvent: AccessEventLog = {
      id: `evt_${Date.now()}`,
      timestamp: 'Just now',
      deviceId: 'dev_smart_lock_front',
      deviceName: 'Ring Smart Deadbolt Plus',
      eventType: 'pin_unlock',
      actor: 'Amazon Fresh Courier (PIN 8491)',
      status: 'granted',
      snapshotUrl: '/src/assets/images/ring_doorbell_cam_feed_1790696834179.jpg',
      aiSummary: 'Authorized delivery window code used. 60s auto-relock countdown active.',
    };
    setEvents((prev) => [newEvent, ...prev]);

    setTimeout(() => {
      setIsLocked(true);
      ringAudio.playLockSound(true);
    }, 8000);
  };

  // 8. Ring Webhook Trigger
  const handleTriggerWebhook = async (eventKind: 'ding' | 'motion') => {
    try {
      await fetch('/api/ring/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: eventKind,
          kind: eventKind === 'ding' ? 'doorbot_ding' : 'motion_stream',
          device_id: 'dev_doorbell_front',
        }),
      });
      if (eventKind === 'ding') handleSimulateDing();
      else handleSimulateMotion();
    } catch (e) {
      console.warn('Webhook error', e);
    }
  };

  // 9. AI Snapshot Analyzer
  const handleAnalyzeSnapshot = async (device: RingDevice) => {
    setIsAnalyzingSnapshot(true);
    try {
      const res = await fetch('/api/ai/analyze-snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceName: device.name,
          eventType: isRinging ? 'Doorbell Ding' : isMotionActive ? 'Motion Stream' : 'Security Snapshot',
          timestamp: new Date().toLocaleTimeString(),
          context: `High-definition security frame from ${device.location}`,
        }),
      });
      const data = await res.json();
      setLatestAiSnapshot({
        caption: data.caption || 'Verified event: visitor detected near front entryway.',
        detectedObjects: data.detectedObjects || ['Visitor', 'Doorstep'],
        threatLevel: data.threatLevel || 'None',
        confidence: data.confidence || 0.97,
        snapshotUrl: device.previewImage,
        analyzedAt: new Date().toLocaleTimeString(),
        deviceName: device.name,
      });
    } catch (e) {
      setLatestAiSnapshot({
        caption: 'Package safely delivered on the front porch near the entryway planter.',
        detectedObjects: ['Delivery Box', 'Doorstep', 'Courier'],
        threatLevel: 'None',
        confidence: 0.98,
        snapshotUrl: device.previewImage,
        analyzedAt: new Date().toLocaleTimeString(),
        deviceName: device.name,
      });
    } finally {
      setIsAnalyzingSnapshot(false);
    }
  };

  // Accessibility Color Cue simulation
  const handleSimulateColorAlert = (color: 'blue' | 'amber' | 'red') => {
    if (color === 'blue') {
      handleSimulateDing();
    } else if (color === 'amber') {
      handleSimulateMotion();
    } else {
      setIsSirenOn(true);
      ringAudio.playSirenShort();
      triggerVisualStrobe('rose');
      setTimeout(() => setIsSirenOn(false), 3000);
    }
  };

  // Update Safety Rule Times
  const handleUpdateRuleTime = (id: string, start: string, end: string) => {
    setSafetyRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, startTime: start, endTime: end } : r))
    );
  };

  const handleToggleRule = (id: string) => {
    setSafetyRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  };

  // Handler for SimulatorPanel event dispatch
  const handleSimulatedPayloadDispatch = (payload: RingSimulatedEventPayload) => {
    const newEvent: AccessEventLog = {
      id: payload.eventId,
      timestamp: payload.timestamp,
      deviceId: payload.deviceId,
      deviceName: payload.deviceName,
      eventType:
        payload.kind === 'doorbot_ding'
          ? 'doorbell_ring'
          : payload.kind === 'motion'
          ? 'motion_zone'
          : payload.kind === 'smart_lock_toggle'
          ? isLocked
            ? 'remote_unlock'
            : 'door_closed'
          : payload.kind === 'caretaking_inactivity'
          ? 'wandering_alert'
          : 'door_opened',
      actor: payload.deviceName,
      status: payload.kind === 'caretaking_inactivity' ? 'flagged' : 'granted',
      snapshotUrl: payload.snapshotUrl,
      aiSummary: payload.details,
      details: JSON.stringify(payload.metadata || {}),
    };
    setEvents((prev) => [newEvent, ...prev]);
  };

  return (
    <div
      className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col relative transition-all duration-300 ${
        isStrobing
          ? strobeBorderColor === 'cyan'
            ? 'ring-8 ring-sky-400 ring-inset bg-sky-950/20'
            : strobeBorderColor === 'amber'
            ? 'ring-8 ring-amber-400 ring-inset bg-amber-950/20'
            : 'ring-8 ring-rose-500 ring-inset bg-rose-950/20'
          : ''
      }`}
    >
      {/* Top Bar Navigation */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        alarmMode={alarmMode}
        onChangeAlarmMode={setAlarmMode}
        isSimulatorOpen={isSimulatorOpen}
        onToggleSimulator={() => setIsSimulatorOpen(!isSimulatorOpen)}
        isRinging={isRinging}
      />

      {/* Main Viewport Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8">
        {activeTab === 'dashboard' && (
          <LiveDashboardView
            devices={devices}
            events={events}
            alarmMode={alarmMode}
            isLocked={isLocked}
            onToggleLock={handleToggleLock}
            isSpotlightOn={isSpotlightOn}
            onToggleSpotlight={() => setIsSpotlightOn(!isSpotlightOn)}
            isSirenOn={isSirenOn}
            onToggleSiren={() => setIsSirenOn(!isSirenOn)}
            isRinging={isRinging}
            isMotionActive={isMotionActive}
            isWanderingAlert={isWanderingAlert}
            onOpenLiveModal={(d) => setActiveCameraDevice(d)}
            latestAiSnapshot={latestAiSnapshot}
            onAnalyzeSnapshot={handleAnalyzeSnapshot}
            isAnalyzingSnapshot={isAnalyzingSnapshot}
            isInsideGeofence={isInsideGeofence}
            geofenceDistance={geofenceDistance}
          />
        )}

        {activeTab === 'access' && (
          <AccessControlView
            passes={passes}
            onAddPass={(pass) => setPasses((prev) => [pass, ...prev])}
            onRevokePass={(id) => setPasses((prev) => prev.filter((p) => p.id !== id))}
            events={events}
            devices={devices}
            isLocked={isLocked}
            onToggleLock={handleToggleLock}
            onOpenLiveCam={(d) => setActiveCameraDevice(d)}
            bookingWindows={bookingWindows}
            onAddBookingWindow={(w) => setBookingWindows((prev) => [w, ...prev])}
          />
        )}

        {activeTab === 'caretaking' && (
          <CaretakingView
            profile={careProfile}
            devices={devices}
            onOpenLiveCam={(d) => setActiveCameraDevice(d)}
            onSimulateMedicineBox={() => {
              ringAudio.playKeypadBeep();
              setCareProfile((prev) => ({
                ...prev,
                medications: prev.medications.map((m, i) => (i === 2 ? { ...m, verified: true } : m)),
              }));
            }}
            isDoorOpen={isDoorOpen}
            safetyRules={safetyRules}
            onToggleRule={handleToggleRule}
            onUpdateRuleTime={handleUpdateRuleTime}
            onTriggerRuleSimulation={(r) => {
              if (r.type === 'night_wandering') handleTriggerNightWandering();
              else handleTriggerInactivityCheck();
            }}
            isWanderingActive={isWanderingAlert}
          />
        )}

        {activeTab === 'accessibility' && (
          <AccessibilityView
            settings={accessibilitySettings}
            onUpdateSettings={setAccessibilitySettings}
            lastVisitorSpeech={lastVisitorSpeech}
            isStrobing={isStrobing}
            onTriggerVisualStrobe={() => triggerVisualStrobe('cyan')}
            onSimulateColorAlert={handleSimulateColorAlert}
          />
        )}

        {activeTab === 'automation' && (
          <AutomationView
            devices={devices}
            routines={routines}
            onToggleRoutine={(id) =>
              setRoutines((prev) =>
                prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
              )
            }
            onAddRoutine={(r) => setRoutines((prev) => [r, ...prev])}
            isLocked={isLocked}
            onToggleLock={handleToggleLock}
            isSpotlightOn={isSpotlightOn}
            onToggleSpotlight={() => setIsSpotlightOn(!isSpotlightOn)}
            isSirenOn={isSirenOn}
            onToggleSiren={() => setIsSirenOn(!isSirenOn)}
            alarmMode={alarmMode}
            onChangeAlarmMode={setAlarmMode}
            onOpenLiveCam={(d) => setActiveCameraDevice(d)}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView events={events} bookingWindows={bookingWindows} />
        )}

        {activeTab === 'api' && (
          <ApiConsoleView
            devices={devices}
            passes={passes}
            events={events}
            onTriggerDing={() => handleSimulateDing()}
            onToggleLock={handleToggleLock}
            isLocked={isLocked}
          />
        )}
      </main>

      {/* In-App Ring Hardware & Event Simulator (Dev Toolbar) (Feature #2) */}
      <DevToolbar
        onSimulateDing={() => handleSimulateDing()}
        onSimulateMotion={handleSimulateMotion}
        alarmMode={alarmMode}
        onCycleAlarmMode={handleCycleAlarmMode}
        isLocked={isLocked}
        onToggleLock={handleToggleLock}
        onTriggerNightWandering={handleTriggerNightWandering}
        onTriggerInactivityAlert={handleTriggerInactivityCheck}
        onSimulateDelivery={handleSimulateDelivery}
        onTriggerWebhook={handleTriggerWebhook}
        isInsideGeofence={isInsideGeofence}
        geofenceDistance={geofenceDistance}
        onToggleGeofence={handleToggleGeofence}
        onChangeGeofenceDistance={handleSetGeofenceDistance}
        geofenceAutoDisarm={geofenceAutoDisarm}
        onToggleGeofenceAutoDisarm={() => setGeofenceAutoDisarm(!geofenceAutoDisarm)}
      />

      {/* Geofence Notification Toast Banner */}
      {geofenceToast && (
        <div className="fixed top-16 right-6 z-50 bg-slate-900 border border-emerald-400 text-emerald-200 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs animate-in slide-in-from-top duration-200">
          <MapPin className="w-4 h-4 text-emerald-400 shrink-0 animate-bounce" />
          <span className="font-semibold">{geofenceToast}</span>
        </div>
      )}

      {/* Simulator Side Drawer / Overlay Panel */}
      <SimulatorPanel
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        alarmMode={alarmMode}
        onChangeAlarmMode={setAlarmMode}
        isLocked={isLocked}
        onToggleLock={handleToggleLock}
        onDispatchEvent={handleSimulatedPayloadDispatch}
        onTriggerDoorbellDing={handleSimulateDing}
        onTriggerMotionEvent={(loc) => handleSimulateMotion()}
        onTriggerInactivityAlert={handleTriggerNightWandering}
      />

      {/* Web Speech Recognition Voice Command Simulator Module */}
      <VoiceCommandOverlay
        onTriggerDing={() => handleSimulateDing()}
        onTriggerMotion={handleSimulateMotion}
        onUnlockDoor={() => {
          if (isLocked) handleToggleLock();
        }}
        onLockDoor={() => {
          if (!isLocked) handleToggleLock();
        }}
        isLocked={isLocked}
        onSetAlarmMode={(mode) => setAlarmMode(mode)}
        onToggleSpotlight={() => setIsSpotlightOn(!isSpotlightOn)}
        isSpotlightOn={isSpotlightOn}
        onTriggerNightWandering={handleTriggerNightWandering}
        onTriggerInactivityCheck={handleTriggerInactivityCheck}
        onToggleSiren={() => setIsSirenOn(!isSirenOn)}
        isSirenOn={isSirenOn}
      />

      {/* Live Camera Stream Modal */}
      {activeCameraDevice && (
        <LiveCameraModal
          device={activeCameraDevice}
          onClose={() => setActiveCameraDevice(null)}
          isLocked={isLocked}
          onToggleLock={handleToggleLock}
          isSpotlightOn={isSpotlightOn}
          onToggleSpotlight={() => setIsSpotlightOn(!isSpotlightOn)}
          isSirenOn={isSirenOn}
          onToggleSiren={() => setIsSirenOn(!isSirenOn)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 px-6 py-4 text-center text-xs text-slate-500 font-mono">
        Ring Pulse Hackathon Suite · Live Stream, In-App Hardware Simulator, Caretaking Engine, Accessibility Cues &amp; AI Vision
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeManagerProvider>
      <MainApp />
      <ThemeManagerModal />
    </ThemeManagerProvider>
  );
}

