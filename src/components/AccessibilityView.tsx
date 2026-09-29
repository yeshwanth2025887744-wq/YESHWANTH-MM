import React, { useState } from 'react';
import {
  Ear,
  Eye,
  Volume2,
  Sparkles,
  Send,
  MessageSquare,
  Check,
  Radio,
  Sliders,
  Bell,
  Footprints,
  AlertTriangle,
  Smartphone,
  Vibrate,
} from 'lucide-react';
import { AccessibilitySettings } from '../types/ring.ts';
import { ringAudio } from '../utils/audio.ts';

interface AccessibilityViewProps {
  settings: AccessibilitySettings;
  onUpdateSettings: (settings: AccessibilitySettings) => void;
  lastVisitorSpeech: string;
  isStrobing: boolean;
  onTriggerVisualStrobe: () => void;
  onSimulateColorAlert: (color: 'blue' | 'amber' | 'red') => void;
}

export const AccessibilityView: React.FC<AccessibilityViewProps> = ({
  settings,
  onUpdateSettings,
  lastVisitorSpeech,
  isStrobing,
  onTriggerVisualStrobe,
  onSimulateColorAlert,
}) => {
  const [customReplyInput, setCustomReplyInput] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([
    'Hello! Please leave the package behind the planter box.',
    'I am deaf and on my way to the door. Please wait 1 minute.',
    'We do not accept solicitations today, thank you.',
    'Please slide the envelope under the gate. Thanks!',
  ]);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [lastSpokenText, setLastSpokenText] = useState<string | null>(null);
  const [hapticTestState, setHapticTestState] = useState(false);

  const handleSpeak = (text: string) => {
    ringAudio.speakMessage(text);
    setLastSpokenText(text);
    setTimeout(() => setLastSpokenText(null), 4000);
  };

  const handleSendCustomReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customReplyInput.trim()) return;
    handleSpeak(customReplyInput.trim());
    setCustomReplyInput('');
  };

  const handleTestHaptic = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 300]);
    }
    setHapticTestState(true);
    setTimeout(() => setHapticTestState(false), 2000);
  };

  const handleFetchAiReplies = async () => {
    setIsLoadingAi(true);
    try {
      const res = await fetch('/api/ai/quick-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorSpeech: lastVisitorSpeech,
          residentContext: 'Resident is deaf/hard of hearing and lives independently. Values courteous, direct instructions.',
        }),
      });
      const data = await res.json();
      if (data.quickReplies && data.quickReplies.length > 0) {
        setAiSuggestions(data.quickReplies);
      }
    } catch (e) {
      console.warn('AI suggestions error', e);
    } finally {
      setIsLoadingAi(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Ear className="w-5 h-5 text-sky-400" />
            <h1 className="text-xl font-bold tracking-tight text-white">
              Accessibility &amp; Sensory Cues Hub
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Engineered for Deaf, Hard-of-Hearing, and Non-Verbal residents: visual strobe alerts, strict color-coded cues (Blue, Amber, Red), and AAC voice talkback.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTestHaptic}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
              hapticTestState
                ? 'bg-sky-500 text-white border-sky-400 scale-95'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            <Smartphone className="w-4 h-4 text-sky-400" />
            <span>{hapticTestState ? 'Haptic Pulsing...' : 'Test Haptic Cue'}</span>
          </button>

          <button
            onClick={onTriggerVisualStrobe}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs transition-colors cursor-pointer shadow-md"
          >
            <Eye className="w-4 h-4" />
            <span>Test Visual Strobe</span>
          </button>
        </div>
      </div>

      {/* Color-Coded Sensory Cue Matrix (Feature #4) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Accessible Color-Coded Alert Matrix
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              High-visibility optical spectrum mapped to Ring device events for immediate visual comprehension.
            </p>
          </div>
          <span className="text-xs text-sky-400 font-mono">WCAG AAA Contrast Compliant</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Blue = Ring */}
          <div className="p-4 rounded-xl bg-sky-950/50 border border-sky-500/50 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-sky-400 ring-4 ring-sky-950 animate-pulse" />
                <span className="text-sm font-bold text-white">BLUE ALERT</span>
              </div>
              <Bell className="w-4 h-4 text-sky-400" />
            </div>

            <div>
              <div className="text-xs font-semibold text-sky-200">Doorbell Ring ('ding')</div>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Fires when visitor presses the Ring Doorbell Pro 2 push button. Triggers high-contrast visual strobe.
              </p>
            </div>

            <button
              onClick={() => onSimulateColorAlert('blue')}
              className="w-full py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs cursor-pointer transition-colors"
            >
              Simulate Blue Ring Cue
            </button>
          </div>

          {/* Amber = Motion */}
          <div className="p-4 rounded-xl bg-amber-950/50 border border-amber-500/50 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-400 ring-4 ring-amber-950 animate-pulse" />
                <span className="text-sm font-bold text-white">AMBER ALERT</span>
              </div>
              <Footprints className="w-4 h-4 text-amber-400" />
            </div>

            <div>
              <div className="text-xs font-semibold text-amber-200">Motion Stream Detected</div>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Fires when PIR radar or optical 3D motion zones detect activity along walkway or loading dock perimeter.
              </p>
            </div>

            <button
              onClick={() => onSimulateColorAlert('amber')}
              className="w-full py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs cursor-pointer transition-colors"
            >
              Simulate Amber Motion Cue
            </button>
          </div>

          {/* Red = Alarm */}
          <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-500/50 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-400 ring-4 ring-rose-950 animate-pulse" />
                <span className="text-sm font-bold text-white">RED ALERT</span>
              </div>
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>

            <div>
              <div className="text-xs font-semibold text-rose-200">Ring Alarm &amp; Wandering</div>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Fires for 110dB Base Station siren, security tamper, or exterior night wandering between 12 AM - 5 AM.
              </p>
            </div>

            <button
              onClick={() => onSimulateColorAlert('red')}
              className="w-full py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs cursor-pointer transition-colors"
            >
              Simulate Red Alarm Cue
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Live Transcripts & AAC Talkback (Left) + Visual Alert Preferences (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Live Visitor Captions & AAC Quick Voice Soundboard */}
        <div className="lg:col-span-2 space-y-6">
          {/* Live Visitor Speech Caption Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                <h2 className="text-sm font-semibold text-white">Live Visitor Speech-to-Text Transcription</h2>
              </div>
              <span className="text-xs text-slate-400 font-mono">Headset &amp; Doorbell Mic Live</span>
            </div>

            {/* High-legibility caption screen */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4.5 min-h-[5.5rem] flex items-center">
              <div className="space-y-1">
                <div className="text-xs text-sky-400 font-medium">Doorbell Audio Stream Transcribed:</div>
                <p className="text-base text-slate-100 font-medium leading-relaxed">
                  "{lastVisitorSpeech}"
                </p>
              </div>
            </div>

            {/* AI Contextual Reply Generator trigger */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800/80">
              <span className="text-xs text-slate-400">Contextual response suggestions for visitor:</span>
              <button
                onClick={handleFetchAiReplies}
                disabled={isLoadingAi}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/90 hover:bg-indigo-500 text-white text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isLoadingAi ? 'Generating AI Replies...' : 'Refresh AI Context Replies'}</span>
              </button>
            </div>
          </div>

          {/* AAC Quick Reply Soundboard (Spoken out loud via Ring Doorbell) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">AAC Quick Reply Soundboard</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tap any response to transmit synthesized voice through the Ring Doorbell speaker to the visitor.
                </p>
              </div>
              <span className="text-xs text-sky-400 font-mono">Voice: {settings.selectedVoice}</span>
            </div>

            {/* Response Buttons Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {aiSuggestions.map((reply, i) => (
                <button
                  key={i}
                  onClick={() => handleSpeak(reply)}
                  className="p-3.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/50 text-left transition-all cursor-pointer group flex items-start justify-between gap-2 shadow-sm"
                >
                  <span className="text-xs text-slate-200 group-hover:text-white leading-relaxed">{reply}</span>
                  <Volume2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                </button>
              ))}
            </div>

            {/* Custom Response Input */}
            <form onSubmit={handleSendCustomReply} className="flex gap-2 pt-2">
              <input
                type="text"
                value={customReplyInput}
                onChange={(e) => setCustomReplyInput(e.target.value)}
                placeholder="Type custom text to speak through Ring Doorbell..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
              />
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Speak Out Loud</span>
              </button>
            </form>

            {/* Spoken Feedback Notice */}
            {lastSpokenText && (
              <div className="p-2.5 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-xs text-emerald-200 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Transmitted to Doorbell speaker: "{lastSpokenText}"</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Sensory Preferences & Hardware Strobe Configuration */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-semibold text-white">Visual &amp; Haptic Cues</h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800/80">
                <div>
                  <div className="text-xs font-medium text-slate-200">Screen Visual Strobe Alert</div>
                  <div className="text-xs text-slate-500">Pulses viewport when doorbell rings</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.visualStrobeEnabled}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, visualStrobeEnabled: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 bg-slate-900 border-slate-700 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800/80">
                <div>
                  <div className="text-xs font-medium text-slate-200">High Contrast Mode</div>
                  <div className="text-xs text-slate-500">Boosts element borders and readability</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.highContrastMode}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, highContrastMode: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 bg-slate-900 border-slate-700 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800/80">
                <div>
                  <div className="text-xs font-medium text-slate-200">Auto Quick-Reply on Ding</div>
                  <div className="text-xs text-slate-500">Speaks default greeting in 3 seconds</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoQuickReplyEnabled}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, autoQuickReplyEnabled: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 bg-slate-900 border-slate-700 cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Visual Strobe Color</label>
              <div className="grid grid-cols-4 gap-2">
                {(['cyan', 'amber', 'emerald', 'white'] as const).map((color) => (
                  <button
                    key={color}
                    onClick={() => onUpdateSettings({ ...settings, strobeColor: color })}
                    className={`py-2 rounded-lg text-xs font-semibold capitalize border transition-all cursor-pointer ${
                      settings.strobeColor === color
                        ? 'border-sky-400 bg-sky-950/60 text-white'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Doorbell Voice Synthesizer</label>
              <select
                value={settings.selectedVoice}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, selectedVoice: e.target.value as any })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
              >
                <option value="Zephyr">Zephyr (Clear &amp; Natural Female)</option>
                <option value="Puck">Puck (Warm &amp; Friendly Male)</option>
                <option value="Kore">Kore (Authoritative &amp; Direct)</option>
                <option value="Charon">Charon (Deep &amp; Resonant)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
