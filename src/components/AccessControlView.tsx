import React, { useState } from 'react';
import {
  KeyRound,
  ShieldCheck,
  Lock,
  Unlock,
  Plus,
  Clock,
  CheckCircle2,
  Trash2,
  QrCode,
  Truck,
  HeartHandshake,
  UserCheck,
  Building,
  Calendar,
  Camera,
  ExternalLink,
} from 'lucide-react';
import { AccessPass, AccessEventLog, RingDevice, BookingWindow } from '../types/ring.ts';
import { ringAudio } from '../utils/audio.ts';

interface AccessControlViewProps {
  passes: AccessPass[];
  onAddPass: (pass: AccessPass) => void;
  onRevokePass: (id: string) => void;
  events: AccessEventLog[];
  devices: RingDevice[];
  isLocked: boolean;
  onToggleLock: () => void;
  onOpenLiveCam: (device: RingDevice) => void;
  bookingWindows: BookingWindow[];
  onAddBookingWindow: (window: BookingWindow) => void;
}

export const AccessControlView: React.FC<AccessControlViewProps> = ({
  passes,
  onAddPass,
  onRevokePass,
  events,
  devices,
  isLocked,
  onToggleLock,
  onOpenLiveCam,
  bookingWindows,
  onAddBookingWindow,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [keypadInput, setKeypadInput] = useState('');
  const [keypadFeedback, setKeypadFeedback] = useState<string | null>(null);

  // New Pass Form state
  const [newRecipientName, setNewRecipientName] = useState('');
  const [newRecipientType, setNewRecipientType] = useState<AccessPass['recipientType']>('delivery');
  const [newPin, setNewPin] = useState(() => Math.floor(1000 + Math.random() * 9000).toString());
  const [newUsageLimit, setNewUsageLimit] = useState(1);
  const [newRelockSeconds, setNewRelockSeconds] = useState(60);

  // New Booking Window state
  const [bookingTitle, setBookingTitle] = useState('');
  const [bookingSource, setBookingSource] = useState<BookingWindow['source']>('Amazon Key');
  const [bookingRecipient, setBookingRecipient] = useState('');
  const [bookingStart, setBookingStart] = useState('02:00 PM');
  const [bookingEnd, setBookingEnd] = useState('04:00 PM');

  const filteredPasses = passes.filter((p) => {
    if (filterType === 'all') return true;
    return p.recipientType === filterType;
  });

  const handleKeypadPress = (digit: string) => {
    ringAudio.playKeypadBeep();
    if (keypadInput.length < 4) {
      const next = keypadInput + digit;
      setKeypadInput(next);
      if (next.length === 4) {
        verifyPin(next);
      }
    }
  };

  const handleKeypadClear = () => {
    ringAudio.playKeypadBeep();
    setKeypadInput('');
    setKeypadFeedback(null);
  };

  const verifyPin = (pin: string) => {
    const matched =
      passes.find((p) => p.pinCode === pin && p.status === 'active') ||
      bookingWindows.find((b) => b.pinCode === pin && (b.status === 'active' || b.status === 'upcoming'));

    if (matched) {
      ringAudio.playLockSound(false);
      setKeypadFeedback(`Access Granted: ${'title' in matched ? matched.title : matched.name}`);
      if (isLocked) {
        onToggleLock();
      }
      setTimeout(() => {
        setKeypadInput('');
        setKeypadFeedback(null);
      }, 3000);
    } else {
      ringAudio.playSirenShort();
      setKeypadFeedback('Invalid PIN. Access Denied.');
      setTimeout(() => {
        setKeypadInput('');
        setKeypadFeedback(null);
      }, 2500);
    }
  };

  const handleCreatePass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecipientName.trim()) return;

    const newPass: AccessPass = {
      id: `pass_${Date.now()}`,
      name: newRecipientName.trim(),
      recipientType: newRecipientType,
      pinCode: newPin,
      status: 'active',
      validFrom: new Date().toISOString(),
      validUntil: new Date(Date.now() + 86400000 * 7).toISOString(),
      grantedDoors: ['dev_smart_lock_front'],
      usageLimit: newUsageLimit,
      timesUsed: 0,
      autoRelockSeconds: newRelockSeconds,
      qrPayload: `RING_PASS_${newPin}_${Date.now()}`,
      notes: `Generated pass with auto-relock in ${newRelockSeconds}s.`,
    };

    onAddPass(newPass);
    setIsPassModalOpen(false);
    setNewRecipientName('');
    setNewPin(Math.floor(1000 + Math.random() * 9000).toString());
  };

  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingTitle.trim()) return;

    const genPin = Math.floor(1000 + Math.random() * 9000).toString();
    const newBooking: BookingWindow = {
      id: `bw_${Date.now()}`,
      title: bookingTitle.trim(),
      source: bookingSource,
      serviceRecipient: bookingRecipient.trim() || 'Resident / Guest',
      pinCode: genPin,
      startWindow: bookingStart,
      endWindow: bookingEnd,
      doorAssigned: 'Main Front Door Deadbolt',
      status: 'active',
      snapshotUrl: '/src/assets/images/ring_doorbell_cam_feed_1790696834179.jpg',
      unlockTimestamp: 'Scheduled code active',
    };

    onAddBookingWindow(newBooking);
    setIsBookingModalOpen(false);
    setBookingTitle('');
    setBookingRecipient('');
  };

  const doorbellDevice = devices.find((d) => d.kind === 'doorbell');

  return (
    <div className="space-y-6">
      {/* Top Banner / Master Access Hub */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Dynamic Access Control &amp; Smart Locks</h1>
          <p className="text-sm text-slate-400 mt-1">
            Schedule temporary access codes tied to booking or delivery windows and audit camera snapshot timestamps.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              ringAudio.playLockSound(!isLocked);
              onToggleLock();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs tracking-wide transition-all cursor-pointer shadow-md ${
              isLocked
                ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/40'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            <span>{isLocked ? 'Main Deadbolt: LOCKED' : 'Main Deadbolt: UNLOCKED'}</span>
          </button>

          <button
            onClick={() => setIsBookingModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors cursor-pointer shadow-md"
          >
            <Calendar className="w-4 h-4" />
            <span>Schedule Delivery/Booking Window</span>
          </button>

          <button
            onClick={() => setIsPassModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs transition-colors cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Issue Guest PIN</span>
          </button>
        </div>
      </div>

      {/* Feature #5: Scheduled Booking & Delivery Windows */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Scheduled Delivery Windows &amp; Calendar Bookings</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Time-bound access codes synced with Amazon Key, FedEx, and calendar reservations.
            </p>
          </div>
          <span className="text-xs text-sky-400 font-mono">
            {bookingWindows.length} Active Booking Schedules
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {bookingWindows.map((bw) => (
            <div
              key={bw.id}
              className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-sky-300 border border-slate-700">
                    {bw.source}
                  </span>
                  <span
                    className={`text-xs font-semibold ${
                      bw.status === 'active'
                        ? 'text-emerald-400'
                        : bw.status === 'upcoming'
                        ? 'text-sky-400'
                        : 'text-slate-500'
                    }`}
                  >
                    {bw.status.toUpperCase()}
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-white mt-2">{bw.title}</h3>
                <div className="text-xs text-slate-400 mt-0.5">{bw.serviceRecipient}</div>

                <div className="mt-3 pt-2.5 border-t border-slate-900 space-y-1 text-xs font-mono tabular-nums">
                  <div className="text-slate-400">
                    Window: <strong className="text-slate-200">{bw.startWindow} - {bw.endWindow}</strong>
                  </div>
                  <div className="text-slate-400">
                    PIN Code: <strong className="text-sky-300 font-bold tracking-wider">{bw.pinCode}</strong>
                  </div>
                  <div className="text-slate-500 text-[11px] truncate">Door: {bw.doorAssigned}</div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-900 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 truncate">{bw.unlockTimestamp}</span>
                <button
                  onClick={() => {
                    setKeypadInput(bw.pinCode);
                    verifyPin(bw.pinCode);
                  }}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer"
                >
                  Test Code
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Grid: Active Passes & Camera Integrated Audit Trail (Left 2 cols) + Interactive Keypad (Right 1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Integrated Audit Trail with Camera Snapshots & Credentials */}
        <div className="lg:col-span-2 space-y-6">
          {/* Integrated Audit Trail Mapping Camera Event Snapshots to Lock Timestamps (Feature #5) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Camera className="w-4 h-4 text-sky-400" />
                  <span>Integrated Camera Snapshot &amp; Lock Audit Trail</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Visual proof of entry matching physical lock actuation timestamps to high-definition camera snapshots.
                </p>
              </div>
              <span className="text-xs text-slate-400 font-mono">Immutable Log</span>
            </div>

            <div className="space-y-3">
              {events.slice(0, 4).map((evt) => (
                <div
                  key={evt.id}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5">
                    {/* Snapshot Preview Thumbnail */}
                    <div className="w-16 h-12 rounded-lg bg-black overflow-hidden shrink-0 border border-slate-800 relative group">
                      {evt.snapshotUrl ? (
                        <img
                          src={evt.snapshotUrl}
                          alt="Snapshot proof"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500 font-mono">
                          No Pic
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-white">{evt.actor}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                          {evt.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-slate-400 text-xs mt-0.5">
                        {evt.deviceName} · {evt.eventType.replace('_', ' ')}
                      </div>
                      {evt.aiSummary && (
                        <div className="text-slate-500 text-[11px] mt-0.5 italic">"{evt.aiSummary}"</div>
                      )}
                    </div>
                  </div>

                  <div className="text-right sm:text-right self-end sm:self-center font-mono tabular-nums text-xs">
                    <div className="text-slate-300 font-semibold">{evt.timestamp}</div>
                    <div className="text-slate-500 text-[11px]">Auto-Relock: 60s</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Digital Passes List */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Active Guest Credentials</h2>
                <div className="text-xs text-slate-400">{passes.length} Authorized Credentials</div>
              </div>

              {/* Segmented Filter Control */}
              <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs">
                {(['all', 'delivery', 'caregiver', 'contractor', 'visitor'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-3 py-1 rounded capitalize font-medium transition-colors cursor-pointer ${
                      filterType === type
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {filteredPasses.map((pass) => (
                <div
                  key={pass.id}
                  className="bg-slate-950 border border-slate-800/90 hover:border-slate-700/80 rounded-xl p-4 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-sky-400 mt-0.5">
                      {pass.recipientType === 'delivery' && <Truck className="w-5 h-5 text-amber-400" />}
                      {pass.recipientType === 'caregiver' && <HeartHandshake className="w-5 h-5 text-rose-400" />}
                      {pass.recipientType === 'contractor' && <Building className="w-5 h-5 text-cyan-400" />}
                      {pass.recipientType === 'visitor' && <UserCheck className="w-5 h-5 text-emerald-400" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-sm font-semibold text-white">{pass.name}</h3>
                        <span className="text-xs text-slate-400 capitalize">{pass.recipientType}</span>
                      </div>

                      <p className="text-xs text-slate-400 mt-1">{pass.notes}</p>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-2 font-mono tabular-nums">
                        <span>PIN: <strong className="text-sky-300 font-bold tracking-wider">{pass.pinCode}</strong></span>
                        <span>·</span>
                        <span>Used: {pass.timesUsed} {pass.usageLimit > 0 ? `/ ${pass.usageLimit}` : '(Unlimited)'}</span>
                        <span>·</span>
                        <span>Auto-Relock: {pass.autoRelockSeconds}s</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => {
                        setKeypadInput(pass.pinCode);
                        verifyPin(pass.pinCode);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Simulate Use
                    </button>
                    <button
                      onClick={() => onRevokePass(pass.id)}
                      title="Revoke Access Pass"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Physical Doorbell Live View & Interactive Smart Keypad */}
        <div className="space-y-6">
          {/* Front Porch Doorbell Live Snapshot card */}
          {doorbellDevice && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
              <div className="relative aspect-video bg-black">
                {doorbellDevice.previewImage && (
                  <img
                    src={doorbellDevice.previewImage}
                    alt="Doorbell camera"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                )}
                <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-xs text-white font-mono tabular-nums flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Doorbell Pro 2 Live</span>
                </div>

                <button
                  onClick={() => onOpenLiveCam(doorbellDevice)}
                  className="absolute bottom-2.5 right-2.5 px-3 py-1 rounded bg-sky-600/90 hover:bg-sky-500 text-white text-xs font-medium backdrop-blur-sm transition-colors cursor-pointer"
                >
                  Open Stream
                </button>
              </div>

              <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-white">Front Door Entry</div>
                  <div className="text-slate-400">Head-to-Toe 1536p HD Video</div>
                </div>
                <div className="text-slate-400 font-mono tabular-nums">Battery: 98%</div>
              </div>
            </div>
          )}

          {/* Interactive Smart Keypad Simulator */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-semibold text-white">Door Access Keypad</h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">Z-Wave Keypad v2</span>
            </div>

            {/* Display screen */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 mb-4 text-center font-mono">
              <div className="text-xs text-slate-400 mb-1">ENTER 4-DIGIT PASSCODE</div>
              <div className="text-xl font-bold tracking-widest text-sky-400 min-h-[1.75rem]">
                {keypadInput.padEnd(4, '·')}
              </div>
              {keypadFeedback && (
                <div className="text-xs mt-1 font-semibold text-amber-300 transition-all">{keypadFeedback}</div>
              )}
            </div>

            {/* Keypad Grid 1-9, Clear, 0, Check */}
            <div className="grid grid-cols-3 gap-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  onClick={() => handleKeypadPress(digit)}
                  className="py-2.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-sm font-bold text-white transition-colors cursor-pointer border border-slate-700/60 active:scale-95"
                >
                  {digit}
                </button>
              ))}
              <button
                onClick={handleKeypadClear}
                className="py-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-xs font-semibold text-rose-400 transition-colors cursor-pointer border border-slate-700/60"
              >
                Clear
              </button>
              <button
                onClick={() => handleKeypadPress('0')}
                className="py-2.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-sm font-bold text-white transition-colors cursor-pointer border border-slate-700/60 active:scale-95"
              >
                0
              </button>
              <button
                onClick={() => verifyPin(keypadInput)}
                className="py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-xs font-bold text-white transition-colors cursor-pointer shadow-sm active:scale-95"
              >
                Enter
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Schedule Booking/Delivery Window */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-1">Schedule Delivery / Booking Window</h2>
            <p className="text-xs text-slate-400 mb-4">
              Create a time-restricted access code tied to an incoming delivery carrier or calendar reservation.
            </p>

            <form onSubmit={handleCreateBooking} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  value={bookingTitle}
                  onChange={(e) => setBookingTitle(e.target.value)}
                  placeholder="e.g. Amazon Fresh 2-Hour Window or Airbnb Guest Arrival"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Provider / Platform</label>
                  <select
                    value={bookingSource}
                    onChange={(e) => setBookingSource(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="Amazon Key">Amazon Key</option>
                    <option value="FedEx Express">FedEx Express</option>
                    <option value="Airbnb Calendar">Airbnb Calendar</option>
                    <option value="Visiting Nurse Service">Visiting Nurse Service</option>
                    <option value="Google Calendar">Google Calendar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Recipient / Guest</label>
                  <input
                    type="text"
                    value={bookingRecipient}
                    onChange={(e) => setBookingRecipient(e.target.value)}
                    placeholder="e.g. Eleanor Vance / Driver"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Start Time</label>
                  <input
                    type="text"
                    value={bookingStart}
                    onChange={(e) => setBookingStart(e.target.value)}
                    placeholder="e.g. 02:00 PM"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">End Time</label>
                  <input
                    type="text"
                    value={bookingEnd}
                    onChange={(e) => setBookingEnd(e.target.value)}
                    placeholder="e.g. 04:00 PM"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBookingModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors cursor-pointer"
                >
                  Schedule Window
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Issue Digital Pass */}
      {isPassModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-1">Issue New Digital Pass</h2>
            <p className="text-xs text-slate-400 mb-4">
              Create a time-limited or single-use PIN code for visitors, couriers, or visiting nurses.
            </p>

            <form onSubmit={handleCreatePass} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Recipient Name</label>
                <input
                  type="text"
                  required
                  value={newRecipientName}
                  onChange={(e) => setNewRecipientName(e.target.value)}
                  placeholder="e.g. UPS Courier, Nurse Clara, Cleaner"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                  <select
                    value={newRecipientType}
                    onChange={(e) => setNewRecipientType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="delivery">Delivery Courier</option>
                    <option value="caregiver">Caregiver / Nurse</option>
                    <option value="contractor">Contractor / Cleaner</option>
                    <option value="visitor">Guest Visitor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">PIN Code (4-digits)</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-sky-400 font-mono font-bold focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Usage Limit</label>
                  <select
                    value={newUsageLimit}
                    onChange={(e) => setNewUsageLimit(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value={1}>1-Time Use</option>
                    <option value={2}>2 Times (Dropoff &amp; Return)</option>
                    <option value={0}>Unlimited during window</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Auto-Relock Delay</label>
                  <select
                    value={newRelockSeconds}
                    onChange={(e) => setNewRelockSeconds(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value={30}>30 Seconds</option>
                    <option value={60}>60 Seconds</option>
                    <option value={120}>2 Minutes</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPassModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-xs font-semibold text-white transition-colors cursor-pointer"
                >
                  Issue Pass
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
