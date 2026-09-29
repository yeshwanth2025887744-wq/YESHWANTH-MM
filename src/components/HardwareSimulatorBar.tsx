import React, { useState } from 'react';
import { Bell, Footprints, DoorOpen, PackageCheck, Pill, AlertTriangle, Mic, Volume2 } from 'lucide-react';
import { ringAudio } from '../utils/audio.ts';

interface HardwareSimulatorBarProps {
  onSimulateDoorbellRing: (visitorSpeech?: string) => void;
  onSimulateMotion: () => void;
  onSimulateDoorToggle: () => void;
  onSimulateCourierDelivery: () => void;
  onSimulateMedicineCabinet: () => void;
  onSimulateSirenToggle: () => void;
  isDoorOpen: boolean;
  isSirenOn: boolean;
}

export const HardwareSimulatorBar: React.FC<HardwareSimulatorBarProps> = ({
  onSimulateDoorbellRing,
  onSimulateMotion,
  onSimulateDoorToggle,
  onSimulateCourierDelivery,
  onSimulateMedicineCabinet,
  onSimulateSirenToggle,
  isDoorOpen,
  isSirenOn,
}) => {
  const [visitorSpeechInput, setVisitorSpeechInput] = useState('Hello, I have a package delivery from Amazon for Eleanor.');
  const [isCustomSpeechOpen, setIsCustomSpeechOpen] = useState(false);

  const handleRing = () => {
    ringAudio.playChime();
    onSimulateDoorbellRing(visitorSpeechInput);
  };

  const handleMotion = () => {
    ringAudio.playKeypadBeep();
    onSimulateMotion();
  };

  const handleDoor = () => {
    ringAudio.playLockSound(!isDoorOpen);
    onSimulateDoorToggle();
  };

  const handleCourier = () => {
    ringAudio.playKeypadBeep();
    setTimeout(() => ringAudio.playLockSound(false), 400);
    onSimulateCourierDelivery();
  };

  const handleMeds = () => {
    ringAudio.playKeypadBeep();
    onSimulateMedicineCabinet();
  };

  const handleSiren = () => {
    if (!isSirenOn) {
      ringAudio.playSirenShort();
    }
    onSimulateSirenToggle();
  };

  return (
    <div className="bg-slate-900 border-b border-sky-950/60 px-4 md:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-sky-400 ring-led-active" />
          <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">Ring Hardware Test Bench</span>
          <span className="text-xs text-slate-400 hidden sm:inline">· Physical Event Simulator</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-sky-600 hover:bg-sky-500 text-white transition-colors cursor-pointer shadow-sm"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Ring Doorbell</span>
          </button>

          <button
            onClick={handleMotion}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
          >
            <Footprints className="w-3.5 h-3.5 text-amber-400" />
            <span>Trigger Motion</span>
          </button>

          <button
            onClick={handleDoor}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border transition-colors cursor-pointer ${
              isDoorOpen
                ? 'bg-rose-950/80 text-rose-200 border-rose-600'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            <DoorOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isDoorOpen ? 'Close Front Door' : 'Open Front Door'}</span>
          </button>

          <button
            onClick={handleCourier}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
          >
            <PackageCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Delivery PIN Pass</span>
          </button>

          <button
            onClick={handleMeds}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
          >
            <Pill className="w-3.5 h-3.5 text-indigo-400" />
            <span>Open Medicine Box</span>
          </button>

          <button
            onClick={handleSiren}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border transition-colors cursor-pointer ${
              isSirenOn
                ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-rose-300 border-rose-900/60'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>{isSirenOn ? 'Stop Siren' : 'Test Siren (110dB)'}</span>
          </button>

          <button
            onClick={() => setIsCustomSpeechOpen(!isCustomSpeechOpen)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700/80 transition-colors cursor-pointer"
            title="Configure Visitor Speech for Assistive AI testing"
          >
            <Mic className="w-3.5 h-3.5 text-sky-400" />
            <span>Voice Sim</span>
          </button>
        </div>
      </div>

      {isCustomSpeechOpen && (
        <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-slate-800 flex flex-col sm:flex-row items-center gap-2">
          <label className="text-xs text-slate-400 whitespace-nowrap">Visitor Simulated Audio Prompt:</label>
          <input
            type="text"
            value={visitorSpeechInput}
            onChange={(e) => setVisitorSpeechInput(e.target.value)}
            className="flex-1 w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            placeholder="What visitor says when ringing doorbell..."
          />
          <button
            onClick={() => {
              ringAudio.speakMessage(visitorSpeechInput);
            }}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 cursor-pointer"
          >
            <Volume2 className="w-3 h-3 text-sky-400" />
            <span>Preview Audio</span>
          </button>
        </div>
      )}
    </div>
  );
};
