import React, { useState } from 'react';
import {
  Building2,
  ShieldAlert,
  ShieldCheck,
  Truck,
  Users,
  AlertOctagon,
  Video,
  CheckCircle,
  Lightbulb,
  Radio,
} from 'lucide-react';
import { RingDevice } from '../types/ring.ts';
import { ringAudio } from '../utils/audio.ts';

interface BusinessSystemsViewProps {
  devices: RingDevice[];
  onOpenLiveCam: (device: RingDevice) => void;
  isSpotlightOn: boolean;
  onToggleSpotlight: () => void;
  isSirenOn: boolean;
  onToggleSiren: () => void;
}

interface StaffMember {
  id: string;
  name: string;
  role: string;
  badgeId: string;
  zoneAccess: string[];
  status: 'On Site' | 'Off Duty' | 'In Transit';
  lastBadgeTime: string;
}

export const BusinessSystemsView: React.FC<BusinessSystemsViewProps> = ({
  devices,
  onOpenLiveCam,
  isSpotlightOn,
  onToggleSpotlight,
  isSirenOn,
  onToggleSiren,
}) => {
  const [isLockdownActive, setIsLockdownActive] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<'All' | 'Logistics Bay' | 'Corporate HQ'>('All');

  const [staffList, setStaffList] = useState<StaffMember[]>([
    {
      id: 'staff_1',
      name: 'Marcus Vance',
      role: 'Logistics Operations Lead',
      badgeId: 'RING-BIZ-4019',
      zoneAccess: ['Bay 4 Dock', 'Gate Intercom', 'Perimeter Storage'],
      status: 'On Site',
      lastBadgeTime: '08:42 AM (Gate Scanner)',
    },
    {
      id: 'staff_2',
      name: 'Elena Rostova',
      role: 'Site Security Supervisor',
      badgeId: 'RING-SEC-1102',
      zoneAccess: ['All Zones', 'Siren Master', 'Access Control Hub'],
      status: 'On Site',
      lastBadgeTime: '07:15 AM (HQ Main)',
    },
    {
      id: 'staff_3',
      name: 'Devon Miller',
      role: 'Lead Freight Contractor',
      badgeId: 'RING-CTR-9821',
      zoneAccess: ['Bay 4 Dock Gate'],
      status: 'In Transit',
      lastBadgeTime: 'Yesterday, 04:30 PM',
    },
    {
      id: 'staff_4',
      name: 'Sarah Chen',
      role: 'Compliance & Audit Inspector',
      badgeId: 'RING-AUD-5541',
      zoneAccess: ['HQ Main', 'Records Archive'],
      status: 'Off Duty',
      lastBadgeTime: 'Sep 28, 05:00 PM',
    },
  ]);

  const dockDevice = devices.find((d) => d.id === 'dev_floodlight_dock') || devices[0];

  const handleToggleLockdown = () => {
    if (!isLockdownActive) {
      ringAudio.playSirenShort();
      setIsLockdownActive(true);
    } else {
      ringAudio.playKeypadBeep();
      setIsLockdownActive(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Commercial Operations Control */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-sky-400" />
            <h1 className="text-xl font-bold tracking-tight text-white">Commercial Facility &amp; Multi-Site Security</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Ring Business fleet coordination: freight gate intercoms, shift badge auditing, and perimeter spotlight deterrence.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleLockdown}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs tracking-wider uppercase transition-all cursor-pointer shadow-md ${
              isLockdownActive
                ? 'bg-rose-600 text-white animate-pulse border border-rose-500'
                : 'bg-slate-800 hover:bg-rose-950/80 text-rose-300 border border-rose-900/60'
            }`}
          >
            <AlertOctagon className="w-4 h-4" />
            <span>{isLockdownActive ? 'FACILITY LOCKDOWN ACTIVE' : 'Initiate Facility Lockdown'}</span>
          </button>
        </div>
      </div>

      {/* Facilities Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400">Connected Ring Fleets</div>
          <div className="text-2xl font-bold text-white mt-1 font-mono tabular-nums">3 Sites</div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
            <span className="text-emerald-400 font-medium">100% Online</span>
            <span>·</span>
            <span>8 Active Cameras</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400">On-Site Verified Staff</div>
          <div className="text-2xl font-bold text-white mt-1 font-mono tabular-nums">12 Personnel</div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
            <span className="text-sky-400 font-medium">Shift 1 (Daytime)</span>
            <span>·</span>
            <span>2 Patrol Guards</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400">Perimeter Ingress / Egress</div>
          <div className="text-2xl font-bold text-white mt-1 font-mono tabular-nums">48 Events / 24h</div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
            <span className="text-emerald-400 font-medium">Zero Unidentified Breaches</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Logistics Dock Live Feed (Left) + Staff Access Badges & Incident Rules (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Commercial Gate / Dock Cam Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-white">Commercial Loading Bay 4 &amp; Automated Gate</h2>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                  <span>Ring Floodlight Cam Wired Pro</span>
                  <span>·</span>
                  <span className="font-mono tabular-nums">2000 Lumen Spotlights</span>
                  <span>·</span>
                  <span className="font-mono tabular-nums">110dB Siren</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onToggleSpotlight}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                    isSpotlightOn
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-semibold'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>Spotlights {isSpotlightOn ? 'ON' : 'OFF'}</span>
                </button>

                <button
                  onClick={() => onOpenLiveCam(dockDevice)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Inspect Full Feed</span>
                </button>
              </div>
            </div>

            <div className="relative aspect-video bg-black flex items-center justify-center">
              {dockDevice.previewImage && (
                <img
                  src={dockDevice.previewImage}
                  alt="Loading dock surveillance"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              )}

              {/* Security Overlay */}
              <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md px-3 py-1 rounded text-xs text-white font-mono tabular-nums border border-white/10 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>BAY 4 GATE SENSOR: SECURE</span>
              </div>

              {isLockdownActive && (
                <div className="absolute inset-0 bg-rose-950/40 backdrop-blur-xs flex items-center justify-center">
                  <div className="bg-rose-950/90 border border-rose-500 text-white p-4 rounded-xl text-center space-y-2 shadow-2xl">
                    <ShieldAlert className="w-8 h-8 text-rose-400 mx-auto animate-bounce" />
                    <div className="font-bold text-sm tracking-wide">FACILITY PERIMETER LOCKED DOWN</div>
                    <div className="text-xs text-rose-200">Electronic gates bolted. Security dispatch alerted.</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Commercial Ingress Rules */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white mb-3">Automated Logistics &amp; Courier Gate Ingress Rules</h2>
            <div className="space-y-3">
              {[
                {
                  rule: 'Apex Freight Auto-Ingress (Plate / QR)',
                  policy: 'Automatically unlatch motorized freight gate when scheduled Ring QR pass is presented between 06:00 and 18:00.',
                  status: 'Active Policy',
                },
                {
                  rule: 'After-Hours Intrusion Spotlight Escalation',
                  policy: 'Between 20:00 and 05:00, motion in Bay 4 triggers 2000-lumen floodlights and pushes high-priority clip to Security Ops.',
                  status: 'Active Policy',
                },
                {
                  rule: 'Delivery Driver Intercom Remote Verification',
                  policy: 'Couriers press Intercom button -> Two-way audio connects to dispatch desk with 1-tap gate release.',
                  status: 'Active Policy',
                },
              ].map((item, idx) => (
                <div key={idx} className="p-3.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-start justify-between gap-3 text-xs">
                  <div>
                    <div className="font-semibold text-slate-200">{item.rule}</div>
                    <div className="text-slate-400 mt-1 leading-relaxed">{item.policy}</div>
                  </div>
                  <span className="text-emerald-400 font-medium whitespace-nowrap">{item.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Staff Access Directory */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-semibold text-white">Staff Credential Directory</h3>
              </div>
              <span className="text-xs text-slate-400">{staffList.length} Active Badges</span>
            </div>

            <div className="space-y-3">
              {staffList.map((staff) => (
                <div
                  key={staff.id}
                  className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex flex-col gap-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{staff.name}</span>
                    <span
                      className={`font-medium ${
                        staff.status === 'On Site'
                          ? 'text-emerald-400'
                          : staff.status === 'In Transit'
                          ? 'text-amber-400'
                          : 'text-slate-500'
                      }`}
                    >
                      {staff.status}
                    </span>
                  </div>

                  <div className="text-slate-400">{staff.role}</div>

                  <div className="flex items-center justify-between text-slate-500 pt-1 border-t border-slate-900 font-mono tabular-nums">
                    <span>{staff.badgeId}</span>
                    <span>{staff.lastBadgeTime}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Dispatch Action Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-semibold text-white">Security Dispatch Intercom</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Broadcast high-priority announcement across all Ring Floodlight and Chime Pro speakers in Warehouse Bay 4.
            </p>
            <button
              onClick={() => {
                ringAudio.speakMessage('Attention all warehouse personnel: Loading dock safety check in progress.');
              }}
              className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors cursor-pointer"
            >
              Test Fleet PA Broadcast
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
