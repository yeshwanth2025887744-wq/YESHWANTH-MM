export type DeviceKind =
  | 'doorbell'
  | 'floodlight_cam'
  | 'alarm_base'
  | 'smart_lock'
  | 'contact_sensor'
  | 'motion_sensor'
  | 'chime';

export interface RingDevice {
  id: string;
  name: string;
  kind: DeviceKind;
  location: string;
  facility: 'Residential Home' | 'Commerce Logistics Center' | 'West Coast Branch';
  batteryLevel?: number; // 0-100 or null if wired
  wired: boolean;
  online: boolean;
  wifiSignalRssi: number; // e.g. -54 dBm
  firmware: string;
  state: {
    isRinging?: boolean;
    motionDetected?: boolean;
    locked?: boolean;
    sirenOn?: boolean;
    spotlightsOn?: boolean;
    contactOpen?: boolean;
    alarmMode?: 'disarmed' | 'home' | 'away';
    volume?: number;
    lightBrightness?: number;
  };
  lastEventTime: string;
  previewImage?: string;
}

export type RecipientType = 'visitor' | 'delivery' | 'contractor' | 'caregiver' | 'employee';

export interface AccessPass {
  id: string;
  name: string;
  recipientType: RecipientType;
  pinCode: string;
  status: 'active' | 'scheduled' | 'expired' | 'revoked';
  validFrom: string;
  validUntil: string;
  grantedDoors: string[];
  usageLimit: number; // 0 for unlimited
  timesUsed: number;
  autoRelockSeconds: number;
  qrPayload?: string;
  notes?: string;
}

export interface AccessEventLog {
  id: string;
  timestamp: string;
  deviceId: string;
  deviceName: string;
  eventType:
    | 'doorbell_ring'
    | 'motion_zone'
    | 'pin_unlock'
    | 'remote_unlock'
    | 'door_opened'
    | 'door_closed'
    | 'lockdown_engaged'
    | 'wandering_alert'
    | 'medication_cabinet_opened';
  actor: string;
  status: 'granted' | 'denied' | 'flagged' | 'normal';
  snapshotUrl?: string;
  aiSummary?: string;
  details?: string;
}

export interface AutomationCondition {
  field: 'alarm_mode' | 'lock_state' | 'door_contact' | 'time_window';
  value: string;
  label: string;
}

export interface AutomationRoutine {
  id: string;
  name: string;
  enabled: boolean;
  description: string;
  category: 'security' | 'access' | 'caretaking' | 'convenience';
  trigger: {
    deviceId: string;
    eventType: string;
    conditionText: string;
  };
  conditions?: AutomationCondition[];
  actions: Array<{
    deviceId: string;
    action: string;
    label: string;
  }>;
  executionCount: number;
  lastRun?: string;
}

export interface BookingWindow {
  id: string;
  title: string;
  source: 'Amazon Key' | 'FedEx Express' | 'Airbnb Calendar' | 'Visiting Nurse Service' | 'Google Calendar';
  serviceRecipient: string;
  pinCode: string;
  startWindow: string; // ISO date or time string
  endWindow: string;
  doorAssigned: string;
  status: 'active' | 'upcoming' | 'completed' | 'expired';
  snapshotUrl?: string;
  unlockTimestamp?: string;
}

export interface SafetyRule {
  id: string;
  name: string;
  type: 'morning_inactivity' | 'night_wandering' | 'medication_reminder' | 'door_ajar';
  enabled: boolean;
  sensorId: string;
  sensorName: string;
  startTime: string; // e.g. "07:00"
  endTime: string;   // e.g. "10:00"
  thresholdMinutes: number;
  notifyRecipient: string;
  action: string;
  status: 'nominal' | 'triggered' | 'monitoring';
  lastEvaluated: string;
}

export interface AiSnapshotResult {
  caption: string;
  detectedObjects: string[];
  threatLevel: 'None' | 'Low' | 'Medium' | 'High';
  confidence: number;
  snapshotUrl?: string;
  analyzedAt: string;
  deviceName?: string;
}

export interface CaretakingProfile {
  residentName: string;
  age: number;
  residence: string;
  caregiverName: string;
  caregiverPhone: string;
  emergencyPhone: string;
  nightWanderGuard: boolean;
  nightWindow: string; // e.g. "11:00 PM - 06:00 AM"
  morningMobilityDeadline: string; // e.g. "09:30 AM"
  morningActivityLogged: boolean;
  medications: Array<{
    id: string;
    time: string;
    title: string;
    verified: boolean;
    sensorLinked: string;
  }>;
  dailySensorEvents: Array<{
    id: string;
    time: string;
    sensorName: string;
    summary: string;
    anomaly: boolean;
  }>;
}

export interface AccessibilitySettings {
  visualStrobeEnabled: boolean;
  strobeColor: 'cyan' | 'amber' | 'emerald' | 'white';
  liveTranscriptionEnabled: boolean;
  highContrastMode: boolean;
  autoQuickReplyEnabled: boolean;
  selectedVoice: 'Zephyr' | 'Kore' | 'Puck' | 'Charon';
  aacReplies: string[];
}
